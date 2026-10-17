-- Migration: Creator Monetization
-- Adds membership subscriptions, paid publications (members-only posts),
-- Stripe Connect creator payout accounts, an earnings ledger, and
-- webhook event idempotency tracking.

-- 1. Stripe Connect accounts used for creator payouts (destination charges).
create table if not exists public.creator_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_account_id text not null unique,
  details_submitted boolean not null default false,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creator_accounts enable row level security;

drop policy if exists creator_accounts_own on public.creator_accounts;
create policy creator_accounts_own on public.creator_accounts
  for select to authenticated
  using ((select auth.uid()) = user_id or details_submitted = true);

revoke insert, update, delete on public.creator_accounts from anon, authenticated;
grant select on public.creator_accounts to authenticated;

-- 2. Stripe customer mapping for app users.
create table if not exists public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.billing_customers enable row level security;

drop policy if exists billing_customers_own on public.billing_customers;
create policy billing_customers_own on public.billing_customers
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.billing_customers from anon, authenticated;
grant select on public.billing_customers to authenticated;

-- 3. Memberships: a reader's recurring subscription to one creator.
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'incomplete' check (status in (
    'incomplete', 'incomplete_expired', 'trialing', 'active',
    'past_due', 'canceled', 'unpaid', 'paused'
  )),
  stripe_subscription_id text not null unique,
  stripe_price_id text not null default '',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscriber_id, creator_id)
);

create index if not exists memberships_creator_status_idx
  on public.memberships (creator_id, status);
create index if not exists memberships_subscriber_idx
  on public.memberships (subscriber_id, created_at desc);

alter table public.memberships enable row level security;

drop policy if exists memberships_parties_read on public.memberships;
create policy memberships_parties_read on public.memberships
  for select to authenticated
  using ((select auth.uid()) = subscriber_id or (select auth.uid()) = creator_id);

revoke insert, update, delete on public.memberships from anon, authenticated;
grant select on public.memberships to authenticated;

-- 4. Earnings ledger: one row per paid invoice for a creator.
create table if not exists public.earnings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  membership_id uuid references public.memberships(id) on delete set null,
  stripe_invoice_id text not null unique,
  gross_amount bigint not null check (gross_amount >= 0),
  platform_fee_amount bigint not null check (platform_fee_amount >= 0),
  net_amount bigint not null check (net_amount >= 0),
  currency text not null default 'usd',
  status text not null default 'paid' check (status in ('paid', 'failed', 'refunded')),
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists earnings_creator_created_idx
  on public.earnings (creator_id, created_at desc);

alter table public.earnings enable row level security;

drop policy if exists earnings_creator_read on public.earnings;
create policy earnings_creator_read on public.earnings
  for select to authenticated
  using ((select auth.uid()) = creator_id);

revoke insert, update, delete on public.earnings from anon, authenticated;
grant select on public.earnings to authenticated;

-- 5. Webhook delivery ledger for idempotent Stripe event processing.
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  status text not null default 'received' check (status in ('received', 'processed', 'failed')),
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;
grant select, insert, update on public.stripe_webhook_events to service_role;

-- 6. Paid publications: posts become members-only via access_level.
alter table public.posts add column if not exists access_level text not null default 'FREE';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'posts_access_level_check'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_access_level_check
      check (access_level in ('FREE', 'MEMBERS'));
  end if;
end $$;