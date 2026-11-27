# Phase 12B — PhonePe UPI AutoPay implementation

Status: **BLOCKED** overall (repository implementation complete; PhonePe UAT and production execution blocked).

This document records the additive implementation approved after the read-only
audit in `docs/phase12-payment-migration-audit.md`. Stripe remains the default
provider for new purchases until an operator explicitly opts in, and Stripe
history/lifecycle is unchanged.

## What is implemented

| Area | Implementation |
| --- | --- |
| Provider selection | `BILLING_PROVIDER_NEW` (`stripe` default, `phonepe` opt-in), read server-side only in `lib/billing/config.ts` and `server/modules/billing/service.ts`. |
| Server-trusted plans | `billing_plans` table; browser sends only an opaque `planId`. Amount, currency, auth workflow, and frequency come from the database row. |
| PhonePe API client | `lib/phonepe/client.ts`: OAuth token with cache, `POST /subscriptions/v2/setup`, order/subscription status, subscription cancel, refund initiate/status. All responses validated with Zod. |
| Webhook | `app/api/webhooks/phonepe/route.ts` + `lib/phonepe/webhook.ts`: raw-body HMAC (base64 or hex, preferred) or documented SHA `username:password` auth, size cap, loose Zod schema, semantic dedupe, 5-minute processing lease with crash recovery, atomic state guard, 400 on invalid auth. |
| Normalized state | `server/modules/billing/providers/phonepe-shared.ts` maps PhonePe events to `active`, `past_due`, `paused`, `canceled`, `revoked`, etc. Event time is authoritative; rank only breaks same-instant ties. The guard is enforced inside the conditional UPDATE, so concurrent callbacks cannot both win. |
| Money | `provider_payments` + `provider_ledger_entries` record setup and renewal debits/refunds using the existing `STRIPE_PLATFORM_FEE_PERCENT` split logic. Stripe earnings rows are untouched. |
| Entitlement | `has_active_membership(creator)` now also accepts an explicitly active, paid-through PhonePe row. `membershipFor()` prefers active Stripe rows and then any active PhonePe row, so a newer incomplete row cannot hide an older active membership. |
| Lifecycle APIs | `/api/v1/billing/cancel`, `/api/v1/billing/history`, `/api/v1/billing/refund` (plus legacy `/api/billing/*` adapters). |
| UI | Subscribe/Paywall send only a creator id and opaque plan id; the provider setting selects PhonePe cancellation instead of the Stripe portal. Memberships and earnings pages show both providers. Payout UI is disabled for PhonePe because payout routing is unresolved. |

### Official contracts used

- Authorization: `POST /v1/oauth/token`, `grant_type=client_credentials`, `Authorization: O-Bearer <token>`, `X-MERCHANT-ID`.
- Subscription setup: `POST /subscriptions/v2/setup` with `paymentFlow.type = SUBSCRIPTION_SETUP`, `paymentMode.type = UPI_INTENT`, amount in paise, `MONTHLY`/`YEARLY` frequency.
- Order/status/cancel: `GET /subscriptions/v2/order/{merchantOrderId}/status?details=true`, `GET /subscriptions/v2/{merchantSubscriptionId}/status?details=true`, `POST /subscriptions/v2/{merchantSubscriptionId}/cancel`.
- Refund: `POST /payments/v2/refund` and `GET /payments/v2/refund/{merchantRefundId}/status`.
- Webhook events and payload shape: `subscription.setup.order.*`, `subscription.paused|unpaused|revoked|cancelled`, `subscription.notification.*`, `subscription.redemption.*`, `pg.refund.completed|failed`. Root `payload.state` is authoritative; `event` is used, deprecated `type` is ignored; epoch values may be seconds or milliseconds.
- Pause/unpause/revoke are treated as PhonePe-side customer actions delivered by callbacks. No merchant-side pause/resume/revoke API call was invented.
- Standard PhonePe Checkout is not used for subscriptions.

Reference pages: PhonePe Developer Docs → Payment Gateway → Autopay → API Integration (Authorization, Subscription Setup, Order/Subscription Status, Subscription Cancel, Initiate Refund, Webhook Handling).

## Operator runbook (required before any real purchase)

1. **Enable AutoPay** on the PhonePe merchant account and obtain sandbox/UAT
   credentials (`client id`, `client version`, `secret`, `merchant id`).
2. **Apply the migration** to the intended non-production database only:
   `supabase/migrations/20261127130000_phonepe_autopay.sql`. It creates new
   tables and extends `has_active_membership` with an additional PhonePe
   branch; it does not alter `memberships`, `earnings`, `creator_accounts`,
   `billing_customers`, any Stripe table, or `/api/webhooks/stripe`.
3. **Seed the plan catalog** with approved server-side amounts. No plan or
   payment rows are seeded by the migration. Example shape (replace every
   placeholder with operator-approved values; amounts are paise):

   ```sql
   insert into public.billing_plans
     (id, provider, cycle, amount_minor, max_amount_minor, currency, auth_workflow, active)
   values
     ('phonepe-monthly-inr', 'phonepe', 'MONTHLY', <approved-monthly-paise>, <approved-monthly-paise>, 'INR', 'TRANSACTION', true),
     ('phonepe-yearly-inr',  'phonepe', 'YEARLY',  <approved-yearly-paise>,  <approved-yearly-paise>,  'INR', 'TRANSACTION', true);
   ```

   Do not seed fake payments, subscriptions, or test members into a hosted
   project. A browser-supplied plan id must resolve to one of these rows.
4. **Enable creators** explicitly: insert a `provider_creator_accounts` row with
   `provider = 'phonepe'` and `status = 'ACTIVE'` only for creators approved to
   collect via UPI. No rows are seeded by default, so checkout fails closed.
5. **Configure secrets** in the server environment using `.env.example`; never
   use `NEXT_PUBLIC_*` for PhonePe values. Set `BILLING_PROVIDER_NEW=stripe`
   until steps 1–4 and UAT are complete.
6. **Register the webhook** in the PhonePe dashboard at
   `https://<host>/api/webhooks/phonepe`, with either HMAC (preferred)
   credentials in `PHONEPE_WEBHOOK_KEY_ID`/`PHONEPE_WEBHOOK_SECRET` or SHA
   credentials in `PHONEPE_WEBHOOK_USERNAME`/`PHONEPE_WEBHOOK_PASSWORD`. Select
   only the events listed above and allowlist the callback URL.
7. **Run UAT** with real PhonePe sandbox responses, then flip the provider and
   environment only after approval.

## Security invariants

- No PhonePe secret, token, or raw provider response reaches the browser.
- Client input is limited to a UUID creator id and an opaque plan id; amount,
  currency, provider state, and entitlement are never trusted from the client.
- HMAC webhook checksums are verified over the exact raw body before parsing
  and invalid checksums are rejected with 400. The documented SHA fallback is
  credential authentication only (`sha256(username:password)`) and does not
  bind the body; require HMAC in the PhonePe dashboard for production.
- Event ids are derived from stable provider fields (refund id/amount for
  refunds; event, reference, state, order id, and provider timestamp otherwise)
  rather than the raw byte hash, so a retry with harmless serialization changes
  is deduplicated. Processing uses a recoverable 5-minute lease, and ordering
  is enforced inside the conditional UPDATE to defeat concurrent stale events.
- Callbacks without a provider timestamp are ordered by ingestion time. UAT
  must confirm that the merchant account emits timestamps on all state events.
- New tables have RLS enabled with least-privilege grants; service-role writes
  are server-only. No existing policy was weakened and no Stripe table was
  altered.
- Phase 12 did not modify `/api/webhooks/stripe`. Its pre-existing null-admin
  guards are older uncommitted work; signature verification and Stripe event
  behavior remain intact.

## Verification tiers

| Tier | Status | Evidence |
| --- | --- | --- |
| Static | **PASS** | `npm run typecheck`; `npm run lint` (0 errors, 16 pre-existing warnings); `npm run build` (passed, using the existing WASM SWC fallback because the local native binary was unreadable); `git diff --check`. |
| Unit / mock | **PASS** | `npm test` — 37 files, 225 tests, including config guards, token cache, setup payload, webhook HMAC/SHA, loose timestamp parsing, semantic refund dedupe, atomic ordering filters, lease recovery, refund mapping, server-trusted plan selection, duplicate-checkout prevention, and provider routing. |
| Local DB | **NOT RUN** | Migration not applied locally; the Supabase CLI is unavailable in this environment and no local stack was started for this phase. |
| PhonePe UAT/sandbox | **BLOCKED** | No merchant approval, AutoPay enablement, UAT credentials, webhook registration, callback allowlist, or test UPI evidence supplied. |
| Hosted staging | **BLOCKED** | No confirmed isolated staging identity or non-seed test accounts. |
| Production | **BLOCKED** | Requires explicit approval; no production migration, query, or credential change was made. |

## Rollback

1. Set `BILLING_PROVIDER_NEW=stripe` (or unset it). New checkouts return to the
   untouched Stripe path immediately; existing PhonePe rows remain readable.
2. Remove PhonePe webhook registration or leave it receiving harmless 503s.
3. Only with separate approval, drop the additive tables in reverse dependency
   order (`provider_operations`, `provider_ledger_entries`, `provider_payments`,
   `provider_payment_events`, `provider_subscriptions`,
   `provider_creator_accounts`, `billing_plans`) and restore the previous
   `has_active_membership` definition from the Phase 8 baseline migration.
   No Stripe table or row is dropped at any step.

## Open decisions (still required)

1. Monthly/yearly amounts in paise and whether the landing yearly toggle is authoritative.
2. Failed-renewal grace policy (`past_due` entitlement window).
3. Creator payout/settlement model for PhonePe collections.
4. Refund policy for creator earnings and partial-refund representation.
5. Whether to expose any pause/unpause UI (PhonePe documents customer-side actions).
6. Secret hygiene approval for the credential-shaped value in the untracked `.env.local.example` (not touched here).
