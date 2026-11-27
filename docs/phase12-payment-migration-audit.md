# Phase 12A — Payment Migration Read-Only Audit

Date: 2026-11-27

Scope: repository-only audit of the existing Commun.dev billing system and the documented PhonePe UPI AutoPay contracts.

Change policy: **read-only**. No application code, database schema, migration, environment file, hosted resource, commit, push, deployment, or production query was changed as part of Phase 12A.

## Status

| Item | Status |
|---|---|
| Phase 12A read-only audit | **COMPLETE** |
| Proposed architecture/schema review and approval | **PENDING** |
| PhonePe UAT/sandbox execution | **BLOCKED** — no merchant/UAT credentials, allowlisted webhook URL, or test evidence supplied |
| PhonePe production enablement | **BLOCKED** — requires explicit business approval and live credentials |
| Phase 12 overall | **BLOCKED** |

The working tree already contained extensive uncommitted Phase 10/11/12-era work when this audit began. All of it was treated as user work and preserved. The only new artifact from Phase 12A is this audit document.

---

## 1. Scope and guardrails

### Intended target state

PhonePe UPI AutoPay should become the explicit, server-selected provider for **new** Commun.dev subscriptions. Stripe must remain intact for historical inspection, existing operational lifecycle, historical IDs, webhook verification, cancellation/refund history, and existing environment variables.

### Explicitly preserved

- Stripe SDK, Stripe routes, Stripe customer/account/subscription/invoice IDs, `stripe_webhook_events`, and `/api/webhooks/stripe` processing logic.
- Existing Stripe webhook signature verification and idempotency ledger behavior.
- Existing Stripe historical tables: `billing_customers`, `creator_accounts`, `memberships`, `earnings`, `stripe_webhook_events`.
- Existing env variable names: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MEMBERSHIP_MONTHLY`, `STRIPE_PLATFORM_FEE_PERCENT`.
- RLS posture: user-facing billing rows are read-only to authenticated users; privileged writes use service-role/admin code only.
- Server-only secret handling. No provider secret is exposed to browser code.

### Explicitly not done

- No Stripe subscription, payment, customer, or payout account was inspected in a hosted environment.
- No hosted Supabase migration, Vercel deployment, PhonePe API call, webhook configuration, or production access was performed.
- No fake payment records were seeded into local, staging, or production databases.
- No PhonePe dependency, SDK, route, table, or env variable was added.

---

## 2. Current stack, dependencies, and configuration

### Runtime stack

- Next.js `16.3.8`, App Router, webpack build (`next dev --webpack`, `next build --webpack`).
- React `19.2.0`.
- Supabase `@supabase/supabase-js ^2.119.2` and `@supabase/ssr ^0.12.7`.
- Zod `^4.6.5` at request boundaries.
- Stripe `^23.0.0`; `package-lock.json` pins `stripe@23.0.0`.
- No `@stripe/stripe-js` and no browser-side Stripe SDK.
- Vitest `1.6.1` for tests.

### Stripe config helper

`lib/stripe.ts` is the single Stripe client/config boundary:

- `stripeSecretKey()` accepts `STRIPE_SECRET_KEY` only when `isConfiguredValue()` passes and returns `''` otherwise.
- `isStripeConfigured()` requires a key beginning `sk_` plus a configured `STRIPE_WEBHOOK_SECRET`.
- `hasMembershipPrice()` requires `STRIPE_PRICE_MEMBERSHIP_MONTHLY`.
- `canBill()` requires both.
- `getStripe()` lazily creates one module-level `Stripe` client. It does not pin `apiVersion`.
- `stripeWebhookSecret()` reads `STRIPE_WEBHOOK_SECRET`.
- `siteUrl()` reads `NEXT_PUBLIC_SITE_URL` with a localhost fallback.

`lib/env.ts` rejects documented placeholders (`sk_test_your`, `whsec_your`, `price_your`, etc.) but does not reject arbitrary test-looking values.

### Env templates

- `.env.example` contains blank Stripe values and documents test-mode-only usage.
- `.env.local.example` is untracked and contains a credential-shaped `sk_test_...` test secret on line 33 despite the adjacent comment saying the value should be blank. **Hygiene finding:** this value must be redacted before the file is committed. It is not reproduced in this report.
- `.gitignore` ignores `.env.local` and `.env.*.local`, but not the untracked `.env.local.example`, so it could be accidentally committed.
- No PhonePe variables exist anywhere in the repository. Case-insensitive searches found no PhonePe references in the working tree, filenames, or available git history.

### Baseline verification run during Phase 12A

| Command | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS with 0 errors and 16 pre-existing warnings |
| `npm test` | PASS — 28 files, 188 tests |
| `npm run build` | PASS — Next.js fell back to WASM SWC bindings after native `dlopen` warnings; build completed |
| `git diff --check` | PASS |

These are repository/mock-level checks only. They are **not** PhonePe UAT, hosted Supabase, hosted Vercel, Stripe live, or production verification.

`vercel.json` contains only `{"framework":"nextjs"}` — no env blocks, staging project, or production config. CI runs `npm ci`, tests, typecheck, lint, build, and dependency audit on `main`/PRs, and references only Supabase/site secrets. It has no Stripe, KV, PhonePe, or hosted-deploy secrets. The smoke workflow is manual and takes only a target URL/environment.

Secret hygiene: no committed real credentials were found in tracked files at HEAD or in the tracked working tree. The only high-risk item is the untracked, non-ignored `.env.local.example` credential-shaped Stripe test value noted above. Ignored `.env.local` contains populated Supabase service-role, KV, and publishable keys by name only; it was not used to contact hosted systems.

---

## 3. Existing endpoint inventory

Canonical v1 routes are thin adapters to `server/modules/billing/service.ts`; `/api/billing/*` files are legacy compatibility re-exports.

| Endpoint | Implementation | Current contract |
|---|---|---|
| `POST /api/v1/billing/checkout` | `createCheckout()` | Body `{ creatorId: uuid }`; creates Stripe Checkout subscription session; returns `{ url }`. 401/403/422/409/429/502/503. |
| `POST /api/v1/billing/portal` | `createBillingPortal()` | No body; creates Stripe Billing Portal session; returns `{ url }`. 401/404/429/502/503. |
| `GET /api/v1/billing/connect` | `getConnectStatus()` | Returns account readiness flags plus active/trialing member count. 401/503. |
| `POST /api/v1/billing/connect` | `startConnect()` | Creates/reuses Stripe Express account and account onboarding link; returns `{ url }`. 401/403/429/500/502/503. |
| `POST /api/webhooks/stripe` | webhook route | Raw-body Stripe signature verification, event ledger, membership/invoice/account sync. Intentionally unversioned. |

Frontend boundary: `features/billing/api.ts` exposes `startMembershipCheckout(creatorId)`, `openBillingPortal()`, and `startConnectOnboarding()`. Components only receive URLs and never construct provider API calls. `requireRedirectUrl()` checks only truthiness, not that the payload is actually a string, and `features/api-client.ts` leaves success payloads as generic casts; this is existing Phase 11 debt.

Contract drift: `docs/api-contracts.md` and `PRODUCTION.md` imply all billing routes return 503 without full Stripe config, but `createBillingPortal()` only requires a Stripe client and customer row, and `GET /api/v1/billing/connect` does not require `canBill()`. Keep these behaviors unchanged for Stripe; document the exceptions when adding provider-neutral routes.

---

## 4. Existing service and customer lifecycle

`server/modules/billing/service.ts`:

1. `createCheckout()`
   - Requires an authenticated, `ACTIVE` user.
   - Requires `canBill()`.
   - Validates `{ creatorId }` with Zod.
   - Rejects self-subscription.
   - Rate limits `checkout:${userId}` to 5 requests/minute.
   - Rejects an existing membership with status `active`, `trialing`, or `past_due`.
   - Requires the creator account to be Connect-ready: `details_submitted && charges_enabled && payouts_enabled`.
   - Creates or reuses a Stripe customer keyed by `user_id`.
   - Creates a Checkout session in `subscription` mode with one server-configured monthly price, quantity 1, no promotion codes, `application_fee_percent`, destination transfer to the creator's Stripe account, and `creator_id`/`subscriber_id` metadata.
   - Returns the hosted Stripe Checkout URL.

2. `startConnect()`
   - Creates an Express account with requested `transfers` capability.
   - Persists `details_submitted`, `charges_enabled`, and `payouts_enabled`.
   - Creates an account onboarding link.

3. `createBillingPortal()`
   - Requires a `billing_customers` row for the signed-in user.
   - Returns a Stripe Billing Portal URL.

The client sends only `creatorId`. It cannot override amount, currency, price, fee, entitlement, or provider.

---

## 5. Database schema, constraints, and RLS

All relevant schema is in `supabase/migrations/20261017120000_creator_monetization.sql`, with the membership gate helper in `supabase/migrations/20261001000000_phase8_core_social_baseline.sql`.

| Table | Shape and constraints | RLS |
|---|---|---|
| `creator_accounts` | `user_id` PK → `auth.users`; `stripe_account_id text not null unique`; three readiness booleans; timestamps. | SELECT to authenticated when own row or `details_submitted = true`; no browser insert/update/delete. |
| `billing_customers` | `user_id` PK → `auth.users`; `stripe_customer_id text not null unique`; timestamps. | Own row SELECT only; no browser writes. |
| `memberships` | `id` UUID PK; `subscriber_id` and `creator_id` FKs; 8-value status check; `stripe_subscription_id text not null unique`; `stripe_price_id text not null default ''`; `current_period_end`; `cancel_at_period_end`; timestamps; `unique (subscriber_id, creator_id)`. | Subscriber or creator SELECT only; no browser writes. |
| `earnings` | `id` UUID PK; `creator_id`; `membership_id → memberships ON DELETE SET NULL`; `stripe_invoice_id text not null unique`; gross/fee/net bigint; currency default `usd`; status `paid|failed|refunded`; period timestamps. | Creator SELECT only; no browser writes. |
| `stripe_webhook_events` | `event_id` PK; `event_type`; status `received|processed|failed`; `error`; `received_at`; `processed_at`. | RLS enabled; browser access revoked; service-role select/insert/update. |

Indexes exist on `memberships(creator_id,status)`, `memberships(subscriber_id,created_at desc)`, and `earnings(creator_id,created_at desc)`.

### Entitlement path

- `public.has_active_membership(creator uuid)` is a security-definer function that checks only `memberships.status = 'active'` for `auth.uid()`.
- `posts_select_visible` allows published members-only posts when that function returns true.
- App-level helpers in `lib/monetization.ts` use `active|trialing` plus a future `current_period_end` guard; `active` with no period end is treated as active, while `trialing` with no period end is not.
- `app/post/[slug]/page.tsx` and `server/modules/posts/service.ts` also enforce gating by stripping the body when access is denied.
- **Divergence:** SQL RLS, app entitlement, checkout duplicate guard, and UI readiness use slightly different rules. This must be unified before introducing a second provider so that PhonePe cannot create a state where the API allows access but RLS denies it, or vice versa.

### Historical record limitations

- `memberships` is current-state only. A replacement Stripe subscription causes `DELETE` then `INSERT`, discarding the prior row.
- Cancellation sets `status = 'canceled'` and `current_period_end = null`; `cancel_at_period_end` is preserved.
- `earnings` is the de facto Stripe invoice ledger. It has no partial-refund amount, dispute state, or provider-neutral reference.
- `stripe_webhook_events` stores event metadata and status, not raw payloads.
- `creator_accounts` flags are overwritten from `account.updated`.

These are existing Stripe behaviors and must remain intact. Provider-neutral history for PhonePe should be additive rather than rewriting these tables.

---

## 6. Webhook verification, idempotency, and processing

`app/api/webhooks/stripe/route.ts` is unchanged in behavior by Phase 12A.

### Security and deduplication

- Requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`; otherwise 503.
- Requires `stripe-signature`; otherwise 400.
- Reads the raw request body with `request.text()`.
- Verifies with `stripe.webhooks.constructEvent(payload, signature, secret)`; invalid signatures return 400 before any database write.
- Inserts `event_id` into `stripe_webhook_events` as a claim.
- `23505` duplicate with status `processed` returns `{ received: true, duplicate: true }`.
- Processing failure stores a truncated error and marks the event `failed`, allowing provider retry.
- Success marks the event `processed` with `processed_at`.

### Handled events

`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`, `charge.dispute.created`, `account.updated`.

### Current limitations to preserve or later improve without touching this route

- No explicit application-level body-size limit; platform/WAF limits apply.
- No explicit Stripe tolerance argument.
- No row lock/lease: concurrent duplicate deliveries with status `received` can both process.
- No event ordering guard: an older `customer.subscription.updated` can overwrite newer state.
- `invoice.payment_failed` is logged but does not write `past_due`.
- Partial refunds and disputes are logged for manual reconciliation and do not mutate `earnings`.

The PhonePe webhook design must address deduplication and out-of-order delivery independently; Stripe processing must stay unchanged.

---

## 7. Plans, prices, and entitlement state

### Current plans

- One plan only: the server-configured `STRIPE_PRICE_MEMBERSHIP_MONTHLY`.
- Quantity is always 1 and the client cannot choose a price.
- No plan catalog table and no shared billing types in `packages/shared`.
- The landing page has a monthly/yearly visual toggle, but it is presentational; "Pricing information coming soon".
- Platform fee is `STRIPE_PLATFORM_FEE_PERCENT`, default 10, clamped to 0–100 and floored. `splitGross()` mirrors the fee in the earnings ledger.

### Membership statuses

`incomplete`, `incomplete_expired`, `trialing`, `active`, `past_due`, `canceled`, `unpaid`, `paused`.

Accessible statuses in app helpers are `active` and `trialing`, with a period-end guard. `past_due` is not accessible but does block checkout.

### Proposal principle

Plans and amounts must be server-trusted. The browser may send a `creatorId` and an opaque `planId`; the server resolves cycle, amount, currency, and mandate cap from a database plan catalog or server configuration. It must never accept amount, currency, provider state, entitlement, or paid status from the client.

### UI findings

- `/memberships`, `/profile/[username]`, and `/post/[slug]` are Stripe-specific in copy and readiness checks, but receive only normalized state in practice.
- `SubscribeButton` hides itself when `billingReady` is false for non-members, but its member-state "Manage membership" portal button is not gated by `billingReady`.
- `ManageBilling` hides itself when `billingReady` is false.
- `EarningsDashboard.ready` requires only `details_submitted && charges_enabled`, while backend `isConnectReady()` also requires `payouts_enabled`.
- The live marketing homepage shows Free `$0`, Starter `$19/month`, Pro `$49/month`, and Enterprise Custom, all linking to `/register`; legacy `pricing.html` shows different annual amounts; the unused `PricingSection` has a monthly/yearly toggle with no price data; mock workspace pages show unrelated plan text. No static file contains a real plan ID or Stripe price ID.
- There are no component/TSX tests for billing pages, pricing UI, or plan selection, and no billing-page smoke coverage for `/memberships` or `/earnings`.

The monthly/yearly design should be aligned with the server plan catalog before PhonePe enablement; marketing prices must not be treated as authoritative payment amounts.

---

## 8. Renewal, failure, cancellation, refund, and history behavior

| Capability | Current Stripe behavior |
|---|---|
| Initial payment | Stripe Checkout. `checkout.session.completed` retrieves the subscription and syncs membership/customer. |
| Recurring renewal | `invoice.paid` writes one `earnings` row with the platform fee split. |
| Failed renewal | `invoice.payment_failed` logs a warning only. No `past_due` write and no entitlement change. |
| Cancellation | Via Stripe Billing Portal. `customer.subscription.deleted` sets membership `status = 'canceled'` and clears `current_period_end`. No app-side cancel endpoint. |
| Pause/resume | `paused` is allowed in the schema but there is no app flow and no Stripe pause implementation. |
| Revocation | No explicit Stripe revocation concept in the app. |
| Refund | Full `charge.refunded` marks the matching earning `refunded`. Partial refunds and disputes are logged only. |
| Payment history | `earnings` shows the most recent 25 entries on `/earnings`; Stripe invoice IDs are used as labels. |
| Entitlement sync | App helper plus SQL RLS gate on `posts`. Current-state membership row drives both. |

---

## 9. Tests and verification evidence

### Existing coverage

- `lib/webhook-stripe.test.ts` — 13 tests with an in-memory Supabase fake: missing/invalid signature, config 503, membership sync, duplicate delivery, cancellation, earnings split, unmapped invoice, checkout fulfillment, Connect account update, full refund, partial refund/dispute no-op, failed-event retry.
- `lib/stripe.test.ts` — 2 config-guard tests.
- `lib/monetization.test.ts` — 20 tests for entitlement, statuses, fee split, currency formatting, gating, and Connect readiness.
- `features/services.test.ts` — billing client URL/error handling.
- `server/http/boundaries.test.ts` — v1 adapters and legacy re-export boundary.
- Phase D/7/8/11 scripts — auth matrices, RLS probes, table presence, and local integration fixtures, but consistently mark real Stripe as BLOCKED.

### Gaps

- No `server/modules/billing/service.test.ts`.
- No billing repository tests.
- No hosted Stripe test-mode event replay evidence.
- No hosted RLS verification against production data.
- No PhonePe unit, mock, UAT, or production tests.

---

## 10. Official PhonePe AutoPay contract

Sources consulted on 2026-11-27:

- `https://developer.phonepe.com/payment-gateway/autopay/api-integration/introduction`
- `https://developer.phonepe.com/payment-gateway/autopay/api-integration/integration-steps`
- `https://developer.phonepe.com/payment-gateway/autopay/api-integration/api-reference/authorization`
- `https://developer.phonepe.com/payment-gateway/autopay/api-integration/api-reference/subscription-setup`
- `https://developer.phonepe.com/payment-gateway/autopay/api-integration/api-reference/subscription-status`
- `https://developer.phonepe.com/payment-gateway/autopay/api-integration/api-reference/subscription-cancel`
- `https://developer.phonepe.com/payment-gateway/autopay/api-integration/api-reference/webhook`
- UAT sandbox and go-live documentation referenced from the same developer portal

### Environments

| Environment | Auth base | API base |
|---|---|---|
| Sandbox | `https://api-preprod.phonepe.com/apis/pg-sandbox/<Endpoint>` | Same sandbox base |
| Production | `https://api.phonepe.com/apis/identity-manager/<Endpoint>` | `https://api.phonepe.com/apis/pg/<Endpoint>` |

### OAuth token

`POST /v1/oauth/token` with `Content-Type: application/x-www-form-urlencoded` and fields:

- `client_id`
- `client_version`
- `client_secret`
- `grant_type=client_credentials`

Response includes `access_token`, `issued_at`, `expires_at`, and `token_type: O-Bearer`. Cache the token server-side, refresh before `expires_at`, and send `Authorization: O-Bearer <access_token>` on subsequent API calls. Partner integrations must also send `X-MERCHANT-ID`.

### Subscription/mandate setup

`POST /subscriptions/v2/setup` with JSON body and `Authorization: O-Bearer <token>`.

Important documented fields:

- `merchantOrderId` — unique, max 63 chars, only `_` and `-` special characters.
- `amount` — paise; `TRANSACTION` flow requires at least the first debit amount and at least 100 paise; `PENNY_DROP` requires exactly 200 paise.
- `expireAt` — epoch milliseconds; intent expiry max limit is 15 minutes.
- `paymentFlow.type = "SUBSCRIPTION_SETUP"`.
- `paymentFlow.merchantSubscriptionId` — unique merchant subscription reference.
- `paymentFlow.authWorkflowType` — `TRANSACTION` or `PENNY DROP`.
- `paymentFlow.amountType` — `FIXED` or `VARIABLE`.
- `paymentFlow.maxAmount` — paise cap for redemptions.
- `paymentFlow.frequency` — includes `MONTHLY` and `YEARLY`, plus others such as `ON_DEMAND`.
- `paymentFlow.paymentMode.type = "UPI_INTENT"` with `targetApp` and `deviceContext.deviceOS`.
- `metaInfo.udf1`…`udf15` — exact names; returned in status and callback responses.

Response includes `orderId`, `state: PENDING`, and an `intentUrl` for the UPI app.

### Status and lifecycle endpoints

Documented v2 endpoints:

- `GET /subscriptions/v2/order/{merchantOrderId}/status`
- `GET /subscriptions/v2/{merchantSubscriptionId}/status?details=true`
- `POST /subscriptions/v2/notify`
- `POST /subscriptions/v2/redeem`
- `POST /subscriptions/v2/{merchantSubscriptionId}/cancel` → `204 No Content`
- Pause/unpause and revoke endpoints documented in the same Autopay API reference.
- `POST /payments/v2/refund`
- `GET /payments/v2/refund/{merchantRefundId}/status`

PhonePe states include `ACTIVATION_IN_PROGRESS`, `ACTIVE`, `EXPIRED`, `FAILED`, `CANCEL_IN_PROGRESS`, `CANCELLED`, `REVOKE_IN_PROGRESS`, `REVOKED`, `PAUSE_IN_PROGRESS`, `PAUSED`, and `UNPAUSE_IN_PROGRESS`. Pause windows expose `pauseStartDate` and `pauseEndDate` in epoch milliseconds.

### Webhooks

Two authentication options:

1. HMAC: configure webhook, receive `x-phonepe-checksum-key-id` and `x-phonepe-checksum-signature`, retrieve the secret by key ID, generate the checksum over the received payload, and compare before trusting it.
2. SHA: configure username/password; PhonePe sends an `Authorization` header derived from `SHA256(username:password)`; recompute and compare.

Supported events include:

- `subscription.setup.order.completed` / `subscription.setup.order.failed`
- `subscription.paused`, `subscription.unpaused`, `subscription.revoked`, `subscription.cancelled`
- `subscription.notification.completed` / `subscription.notification.failed`
- `subscription.redemption.order.completed` / `subscription.redemption.order.failed`
- `subscription.redemption.transaction.completed` / `subscription.redemption.transaction.failed`
- `pg.refund.completed` / `pg.refund.failed`

PhonePe guidance calls out:

- Use root-level `payload.state` as the authoritative state.
- Avoid strict deserialization of callback payloads.
- Use `event`, not deprecated `type`.
- `expireAt` and timestamps are epoch milliseconds.

The exact checksum algorithm/key handling must be implemented from the official doc/SDK and validated in sandbox; do not assume a generic HMAC construction.

### Ordinary Checkout is not AutoPay

Standard PhonePe Checkout creates a one-time payment. It must not be presented or implemented as subscription functionality. A subscription requires `SUBSCRIPTION_SETUP`, a mandate/subscription ID, AutoPay enabling, and the v2 AutoPay lifecycle above.

---

## 11. Capability matrix

| Capability | Current Stripe implementation | PhonePe AutoPay docs | Proposed normalized support | Verification status |
|---|---|---|---|---|
| New subscription | Stripe Checkout subscription session | `POST /subscriptions/v2/setup` + UPI intent | Server-created setup with opaque `planId`; explicit provider selection | UAT BLOCKED |
| Monthly plan | `STRIPE_PRICE_MEMBERSHIP_MONTHLY` | `frequency: MONTHLY` | Server plan catalog, amount in paise | Proposed |
| Yearly plan | Not implemented; landing toggle is cosmetic | `frequency: YEARLY` | Server plan catalog, amount in paise | Proposed |
| Initial payment confirmation | `checkout.session.completed` + subscription retrieve | `subscription.setup.order.completed` + order status | Normalized `initial_payment_confirmed` event; no entitlement before confirmation | Proposed |
| Mandate record | Implicit Stripe subscription | `merchantSubscriptionId`, `subscriptionId`, auth/amount/frequency fields | `provider_subscriptions` with mandate reference and state | Proposed |
| Recurring renewals | `invoice.paid` → `earnings` | Redemption order/transaction callbacks and status APIs | `provider_payments` + normalized ledger entry | UAT BLOCKED |
| Failed renewals | Log only | Redemption failed events | Normalized `past_due` or grace policy, pending business decision | Proposed; policy TBD |
| Cancellation | Billing Portal + subscription deleted webhook | Cancel API + `subscription.cancelled` | App cancel action for PhonePe only; normalized `canceled` | Proposed |
| Pause/resume | Schema only | Pause/unpause APIs and events | App actions only where PhonePe account supports them | Proposed; account capability TBD |
| Revocation | No direct concept | Revoke API/event | Terminal `revoked` reason, no entitlement | Proposed |
| Refunds | Full refund marks earning; partial/dispute logged | Refund API + `pg.refund.completed/failed` | `provider_payments.refund_status` + ledger adjustment | UAT BLOCKED |
| Payment history | `earnings` with Stripe invoice IDs | Redemption/setup/refund events and transaction IDs | Provider-neutral history view; Stripe history untouched | Proposed |
| Entitlement sync | App helper + SQL RLS helper | Must be derived from normalized state | Single normalized entitlement rule used by API and RLS | Requires unified policy |
| Customer mapping | `billing_customers` with `stripe_customer_id` | PhonePe does not map to this Stripe table | `provider_customers` keyed by `(user_id, provider)` | Proposed |
| Creator payouts | Stripe Connect destination charges | No equivalent marketplace/payout contract in the reviewed AutoPay docs | Business decision required; fee may be accounting-only initially | BLOCKED |

---

## 12. Proposed provider-neutral changes

These are proposals only. None has been applied.

### 12.1 Architecture

Keep the existing layered architecture and avoid a large rewrite:

- `lib/monetization.ts` remains the home of entitlement vocabulary.
- Add provider-neutral billing types in a new server-safe module, e.g. `lib/billing/types.ts`:
  - `BillingProvider = 'stripe' | 'phonepe'`
  - `BillingPlan` with opaque `id`, `cycle: MONTHLY|YEARLY`, `amountMinor`, `currency`, active/effective timestamps.
  - Normalized subscription state, event kind, payment record, and webhook verification result types.
  - Zod schemas for untrusted provider/webhook payloads.
- Add server-only provider adapters under `server/modules/billing/providers/`:
  - `stripe-adapter.ts` wraps current SDK behavior without changing webhook semantics.
  - `phonepe-adapter.ts` handles OAuth token caching, v2 setup, status, cancel/pause/unpause/revoke, refund, and webhook checksum verification using official contracts.
  - `provider-router.ts` makes provider selection explicit from server config/audit data. Default remains Stripe until approval.
- Change `createCheckout()` to accept only `{ creatorId, planId }` and resolve all amounts server-side.
- Add `/api/webhooks/phonepe` as a separate route. Do not alter `/api/webhooks/stripe`.
- Add management/history endpoints only after approval, e.g. `/api/v1/billing/manage`, `/api/v1/billing/history`, `/api/v1/billing/cancel`, `/api/v1/billing/pause`, `/api/v1/billing/resume`.
- Browser code continues to call typed `features/billing/api.ts` functions and receives redirect/status data only.

### 12.2 Additive schema proposal

Do **not** rewrite Stripe tables. `memberships.stripe_subscription_id` is `NOT NULL`, `earnings.stripe_invoice_id` is `NOT NULL`, and `billing_customers` is Stripe-specific, so PhonePe records should not be forced into them.

Proposed new tables:

| Table | Purpose |
|---|---|
| `billing_plans` | Server-trusted plan catalog: opaque ID, monthly/yearly cycle, amount in paise or cents, currency, active/effective timestamps. |
| `provider_customers` | `(user_id, provider)` → provider customer/reference mapping. Unique per provider/user. |
| `provider_subscriptions` | Provider-neutral subscription state: subscriber, creator, provider, plan, provider subscription/mandate/order references, normalized status, provider raw state, amount/currency, period start/end, paid-through, next renewal, cancel/pause/revoke timestamps, request ID. |
| `provider_payment_events` | Deduplicated webhook/event ledger keyed by `(provider, provider_event_id)` with event name, checksum method, payload hash, state, error, provider timestamp, received/processed timestamps. Optionally a `status_rank`/state transition guard for out-of-order events. |
| `provider_payments` | Initial setup payment and recurring debits: provider order/transaction/UTR references, amount, currency, state, paid/refund timestamps, subscription reference. |
| `provider_ledger_entries` | Provider-neutral creator fee ledger: creator, subscription, payment, gross/fee/net, currency, status. Stripe `earnings` remains the historical Stripe ledger. |
| `provider_operations` | Audit of server-initiated setup/cancel/pause/resume/refund operations with idempotency key, actor, request/response hash, and result. |

RLS should follow the existing pattern:

- Users can SELECT only their own provider customers/subscriptions/payments or their own creator ledger entries.
- Creators can see subscriptions/payments relevant to their publications.
- No browser INSERT/UPDATE/DELETE on any provider table.
- Webhook/event ledger writes are service-role only.
- No raw sensitive provider payload is stored; store a hash plus normalized fields.

An entitlement view or updated `has_active_membership()` must then read the normalized subscription state consistently. This is the point where the existing RLS/app divergence must be resolved without weakening access rules.

Recommended normalized mapping:

| PhonePe state | Proposed internal status | Entitlement |
|---|---|---|
| `ACTIVATION_IN_PROGRESS`, setup pending | `incomplete` | No |
| Setup failed / `FAILED` | `incomplete_expired` | No |
| `ACTIVE` after confirmed payment | `active` | Yes, through `paid_through` |
| `PAUSED`, `PAUSE_IN_PROGRESS` | `paused` | No, or through `paid_through` if business approves |
| `UNPAUSE_IN_PROGRESS` | `active` only after confirmed state | Policy TBD |
| `CANCEL_IN_PROGRESS`, `CANCELLED` | `canceled` | No |
| `REVOKE_IN_PROGRESS`, `REVOKED` | `canceled` with `revoked` reason | No |
| `EXPIRED` | `incomplete_expired` or `canceled` | No |

Failed renewals need an explicit grace-period policy. Do not grant access merely because a webhook announced a setup/mandate; access follows confirmed paid state.

### 12.3 Env proposal

Server-only variables to add after approval:

- `BILLING_PROVIDER_NEW=stripe|phonepe` — explicit, auditable provider choice for new purchases; default `stripe`.
- `PHONEPE_ENV=sandbox|production`.
- `PHONEPE_CLIENT_ID`
- `PHONEPE_CLIENT_SECRET`
- `PHONEPE_CLIENT_VERSION`
- `PHONEPE_MERCHANT_ID`
- Webhook HMAC: `PHONEPE_WEBHOOK_KEY_ID`, `PHONEPE_WEBHOOK_SECRET` **or** SHA: `PHONEPE_WEBHOOK_USERNAME`, `PHONEPE_WEBHOOK_PASSWORD`. Choose one method per environment.
- Optional toggles for pause/resume/refund support if merchant capability differs.

All must be validated as non-placeholder, non-`NEXT_PUBLIC_*` values. `.env.local.example` must be redacted before commit.

### 12.4 UI proposal

- `/memberships`, `/profile/[username]`, and `/post/[slug]` should continue to consume normalized membership state, not provider-specific state.
- Replace the string "live status from Stripe" with provider-neutral wording when PhonePe is enabled.
- Do not label ordinary PhonePe Checkout as a subscription.
- Show plan cycle and payment history from server data only.
- Do not render PhonePe secrets, checksums, mandate payloads, or tokens in the browser.

---

## 13. Risks and open decisions

| Risk/decision | Impact | Required action |
|---|---|---|
| PhonePe AutoPay not enabled for the merchant | No mandate APIs available | Confirm merchant capability before implementation |
| No UAT credentials/webhook allowlist | No real callback/state testing | Provide isolated sandbox credentials and public callback URL |
| Exact HMAC checksum construction uncertain | Invalid signature handling or security bug | Implement from official docs/SDK and prove with sandbox callbacks |
| Out-of-order/duplicate webhooks | Access or ledger corruption | Provider event ledger, payload hash, state transition guard, status polling reconciliation |
| PhonePe state vocabulary differs from Stripe | Entitlement mismatch between app and RLS | Single normalized state definition used by both |
| Creator payouts/fee split | Existing Stripe Connect model has no confirmed PhonePe equivalent | Decide whether fees are accounting-only or require a PhonePe payout/split product |
| Currency/amount rounding | Over/under charging; mandate cap mismatch | Store minor units; server resolves plans; validate paise constraints |
| Pause/resume support varies by merchant/account | UI promises unsupported behavior | Capability flags and explicit server checks |
| Existing dirty working tree | Accidental loss or unintended commit | Preserve all changes; no commit/push; review diffs before applying Phase 12B |
| Credential-shaped value in `.env.local.example` | Secret leakage if committed | Redact before any commit and add an ignore rule if appropriate |
| Hosted staging identity not confirmed | Risk of writing to wrong project | Keep Phase 11 identity gate; no hosted writes until confirmed |
| Conflicting marketing prices and no plan IDs | User expects a price that checkout does not charge | Define one server plan catalog; align marketing copy before enabling PhonePe |
| UI readiness mismatches | Portal button shown when unavailable or payouts not enabled | Normalize readiness from server data; keep Stripe behavior unchanged until approved |
| No UI/component tests or success-payload validation | Broken plan selection or malformed redirect can ship unnoticed | Add tests to Phase 12B scope |
| Phase 11 doc/test-count inconsistencies | Misleading verification evidence | Reconcile docs before claiming Phase 12 completion |

---

## 14. Rollback plan

Because the proposal is additive:

1. Set `BILLING_PROVIDER_NEW=stripe` and remove PhonePe routes/adapters from the active request path.
2. Leave Stripe routes, webhook, tables, env vars, and historical records untouched.
3. Delete only new PhonePe/provider-neutral rows if a clean removal is desired; do not modify Stripe rows.
4. Revert the new migration with a down migration that drops only newly created tables/views/functions and any new nullable columns. No Stripe table data is deleted.
5. Restore the previous entitlement function/view from the migration rollback; verify RLS with two non-seed test accounts before and after.
6. Remove PhonePe secrets from the hosting secret store and rotate credentials that were exposed to any sandbox/test system.
7. Verify `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `git diff --check` again.
8. Never roll back by resetting production, deleting Stripe history, or weakening RLS.

---

## 15. Verification tiers

| Tier | What it proves | Current status |
|---|---|---|
| Unit/mock | Zod validation, state mapping, token cache, webhook checksum normalization, dedupe, out-of-order transitions, server-only plan resolution | Not yet implemented; baseline repo tests pass |
| Local DB | Additive migration, RLS with two accounts, entitlement view, no browser writes | Not run — no Phase 12 migration applied |
| PhonePe UAT/sandbox | Real OAuth, setup intent, callbacks, status, redemption, failure, cancel/pause/refund flows | **BLOCKED** |
| Hosted staging | Deployed config, callbacks, logs, cross-account RLS | **BLOCKED** — staging identity not confirmed |
| Production | Live purchases and reconciliation | **BLOCKED** — requires explicit approval |

Commands already run at Phase 12A baseline are in §2. They do not substitute for UAT or production verification.

---

## 16. Approval required before Phase 12B

Please confirm or supply:

1. **Architecture approval:** additive provider-neutral tables and adapters, with Stripe tables/webhook unchanged.
2. **Provider selection policy:** explicit `BILLING_PROVIDER_NEW=phonepe` for new purchases, with Stripe remaining active for historical/existing operational lifecycle.
3. **Plans:** monthly and yearly amounts in paise, currency INR, and whether existing yearly landing pricing is authoritative.
4. **Failed-renewal grace policy:** immediate loss of access, fixed grace period, or `past_due` with configurable entitlement.
5. **Pause/resume and revocation policy:** which actions should be exposed in the UI.
6. **Refund policy:** whether PhonePe refunds should adjust creator earnings and how partial refunds are represented.
7. **Creator payout model:** whether PhonePe platform fees are accounting-only or require a real payout/split integration.
8. **PhonePe account evidence:** AutoPay enabled, sandbox/UAT access, client ID/version/secret, merchant ID, webhook auth method, callback URL allowlist, and test UPI credentials.
9. **Hosted staging identity:** confirm isolated project URL/ref and two non-seed test accounts before any hosted action.
10. **Secret hygiene:** approval to redact the credential-shaped value from `.env.local.example`.

Until these are resolved, Phase 12 remains **BLOCKED** after the completed read-only audit.

---

## 17. Phase 12B implementation follow-up

Additive PhonePe AutoPay implementation is recorded in
`docs/phase12-phonepe-implementation.md`. The repository-side work (migration,
server-only provider selection, PhonePe client/webhook, normalized entitlement,
tests, and env/docs) is complete, but the overall Phase 12 status remains
**BLOCKED** because PhonePe UAT, hosted staging, and production execution require
the approvals and credentials listed in §16. No Stripe table, Stripe webhook,
hosted resource, or production credential was modified.
