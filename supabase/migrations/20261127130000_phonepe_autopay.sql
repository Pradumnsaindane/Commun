-- Migration: PhonePe UPI AutoPay (additive)
--
-- Adds server-trusted plans, explicit creator enablement, normalized provider
-- subscriptions, webhook idempotency, payment/ledger history, and an operation
-- audit. Stripe tables, Stripe history, and the Stripe webhook are untouched.

-- 1. Server-trusted plan catalog. Browser clients may send an opaque id only.
create table if not exists public.billing_plans (
  id text primary key,
  provider text not null default 'any' check (provider in ('any', 'stripe', 'phonepe')),
  cycle text not null check (cycle in ('MONTHLY', 'YEARLY')),
  amount_minor bigint not null check (amount_minor > 0),
  max_amount_minor bigint check (max_amount_minor is null or max_amount_minor >= amount_minor),
  currency text not null default 'INR',
  auth_workflow text not null default 'TRANSACTION' check (auth_workflow in ('TRANSACTION', 'PENNY_DROP')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.billing_plans enable row level security;
revoke all on public.billing_plans from anon, authenticated;
grant select on public.billing_plans to authenticated;
grant all on public.billing_plans to service_role;

drop policy if exists billing_plans_active_read on public.billing_plans;
create policy billing_plans_active_read on public.billing_plans
  for select to authenticated
  using (active = true);

-- 2. Explicit opt-in for creators on each provider. No rows are seeded.
create table if not exists public.provider_creator_accounts (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'phonepe')),
  status text not null default 'DISABLED' check (status in ('ACTIVE', 'DISABLED')),
  payout_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

alter table public.provider_creator_accounts enable row level security;
revoke all on public.provider_creator_accounts from anon, authenticated;
grant select on public.provider_creator_accounts to authenticated;
grant all on public.provider_creator_accounts to service_role;

drop policy if exists provider_creator_accounts_own on public.provider_creator_accounts;
create policy provider_creator_accounts_own on public.provider_creator_accounts
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- 3. Normalized current-state subscriptions for non-Stripe providers.
create table if not exists public.provider_subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'phonepe')),
  plan_id text not null references public.billing_plans(id),
  status text not null default 'incomplete' check (status in (
    'incomplete', 'incomplete_expired', 'trialing', 'active',
    'past_due', 'canceled', 'unpaid', 'paused', 'revoked'
  )),
  status_reason text,
  provider_subscription_id text,
  merchant_subscription_id text not null,
  merchant_order_id text not null,
  provider_order_id text,
  provider_state text,
  amount_minor bigint not null check (amount_minor >= 0),
  max_amount_minor bigint not null check (max_amount_minor >= 0),
  currency text not null default 'INR',
  frequency text not null default 'MONTHLY' check (frequency in ('MONTHLY', 'YEARLY')),
  current_period_end timestamptz,
  paid_through timestamptz,
  next_renewal_at timestamptz,
  cancel_at_period_end boolean not null default false,
  paused_start timestamptz,
  paused_end timestamptz,
  last_event_at timestamptz,
  last_event_rank integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, merchant_subscription_id),
  unique (provider, merchant_order_id)
);

create unique index if not exists provider_subscriptions_provider_ref_unique
  on public.provider_subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;
create index if not exists provider_subscriptions_subscriber_idx
  on public.provider_subscriptions (subscriber_id, created_at desc);
create index if not exists provider_subscriptions_creator_status_idx
  on public.provider_subscriptions (creator_id, status);

alter table public.provider_subscriptions enable row level security;
revoke all on public.provider_subscriptions from anon, authenticated;
grant select on public.provider_subscriptions to authenticated;
grant all on public.provider_subscriptions to service_role;

drop policy if exists provider_subscriptions_parties_read on public.provider_subscriptions;
create policy provider_subscriptions_parties_read on public.provider_subscriptions
  for select to authenticated
  using ((select auth.uid()) = subscriber_id or (select auth.uid()) = creator_id);

-- 4. Deduplicated webhook delivery ledger. Raw payloads are never stored.
create table if not exists public.provider_payment_events (
  provider text not null check (provider in ('stripe', 'phonepe')),
  event_id text not null,
  event_type text not null,
  state text,
  status text not null default 'received' check (status in ('received', 'processing', 'processed', 'failed', 'ignored')),
  payload_hash text not null,
  event_at timestamptz not null,
  error text,
  received_at timestamptz not null default now(),
  lease_expires_at timestamptz,
  processed_at timestamptz,
  primary key (provider, event_id)
);

create index if not exists provider_payment_events_created_idx
  on public.provider_payment_events (provider, received_at desc);

alter table public.provider_payment_events enable row level security;
revoke all on public.provider_payment_events from anon, authenticated;
grant all on public.provider_payment_events to service_role;

-- 5. Setup and recurring payment records.
create table if not exists public.provider_payments (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe', 'phonepe')),
  subscription_id uuid not null references public.provider_subscriptions(id) on delete cascade,
  merchant_order_id text not null,
  provider_order_id text,
  transaction_id text,
  kind text not null check (kind in ('SETUP', 'REDEMPTION')),
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null default 'INR',
  state text not null,
  refunded_amount_minor bigint not null default 0 check (refunded_amount_minor >= 0),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, merchant_order_id)
);

create index if not exists provider_payments_subscription_idx
  on public.provider_payments (subscription_id, created_at desc);

alter table public.provider_payments enable row level security;
revoke all on public.provider_payments from anon, authenticated;
grant select on public.provider_payments to authenticated;
grant all on public.provider_payments to service_role;

drop policy if exists provider_payments_parties_read on public.provider_payments;
create policy provider_payments_parties_read on public.provider_payments
  for select to authenticated
  using (
    exists (
      select 1 from public.provider_subscriptions s
      where s.id = subscription_id
        and (s.subscriber_id = (select auth.uid()) or s.creator_id = (select auth.uid()))
    )
  );

-- 6. Provider-neutral fee ledger. The Stripe earnings ledger remains intact.
create table if not exists public.provider_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid not null references public.provider_subscriptions(id) on delete cascade,
  payment_id uuid not null references public.provider_payments(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'phonepe')),
  gross_amount_minor bigint not null check (gross_amount_minor >= 0),
  platform_fee_minor bigint not null check (platform_fee_minor >= 0),
  net_amount_minor bigint not null check (net_amount_minor >= 0),
  currency text not null default 'INR',
  status text not null default 'paid' check (status in ('paid', 'failed', 'refunded', 'partially_refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, payment_id)
);

create index if not exists provider_ledger_creator_created_idx
  on public.provider_ledger_entries (creator_id, created_at desc);

alter table public.provider_ledger_entries enable row level security;
revoke all on public.provider_ledger_entries from anon, authenticated;
grant select on public.provider_ledger_entries to authenticated;
grant all on public.provider_ledger_entries to service_role;

drop policy if exists provider_ledger_creator_read on public.provider_ledger_entries;
create policy provider_ledger_creator_read on public.provider_ledger_entries
  for select to authenticated
  using ((select auth.uid()) = creator_id);

-- 7. Audit trail for server-initiated provider operations.
create table if not exists public.provider_operations (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe', 'phonepe')),
  operation text not null check (operation in ('SETUP', 'CANCEL', 'REFUND', 'PAUSE', 'RESUME')),
  actor_id uuid references auth.users(id) on delete set null,
  subscriber_id uuid references auth.users(id) on delete set null,
  merchant_subscription_id text,
  idempotency_key text not null,
  status text not null default 'STARTED' check (status in ('STARTED', 'COMPLETED', 'FAILED')),
  error text,
  created_at timestamptz not null default now(),
  unique (provider, idempotency_key)
);

alter table public.provider_operations enable row level security;
revoke all on public.provider_operations from anon, authenticated;
grant select on public.provider_operations to authenticated;
grant all on public.provider_operations to service_role;

drop policy if exists provider_operations_parties_read on public.provider_operations;
create policy provider_operations_parties_read on public.provider_operations
  for select to authenticated
  using ((select auth.uid()) = actor_id or (select auth.uid()) = subscriber_id);

-- 8. Entitlement gate: Stripe rows continue to work exactly as before; PhonePe
-- rows grant access only when explicitly active and paid through the current
-- period. This keeps API and RLS decisions aligned.
create or replace function public.has_active_membership(creator uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  -- Existing Stripe behavior is intentionally unchanged.
  if exists (
    select 1 from public.memberships m
    where m.subscriber_id = (select auth.uid())
      and m.creator_id = creator
      and m.status = 'active'
  ) then
    return true;
  end if;

  return exists (
    select 1 from public.provider_subscriptions s
    where s.subscriber_id = (select auth.uid())
      and s.creator_id = creator
      and s.status = 'active'
      and s.paid_through is not null
      and s.paid_through > now()
  );
end $$;

revoke all on function public.has_active_membership(uuid) from public;
grant execute on function public.has_active_membership(uuid) to anon, authenticated;
