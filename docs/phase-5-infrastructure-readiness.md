# Phase 5 — Infrastructure readiness audit

Date: 2026-11-27
Baseline: `d86a10c`
Status: **BLOCKED on external infrastructure** — the repository is prepared, but no isolated Supabase project, Stripe test resources, or KV namespace exists in this workspace.

## 1. Scope inspected

| Input | Result |
| --- | --- |
| `docs/phase-4-completion-matrix.md` | Reviewed. Most product features are `IMPLEMENTED, NOT INTEGRATION-VERIFIED`; RLS, auth, Stripe live mode, and E2E are `BLOCKED`. |
| `docs/phase-d-integration-report.md` | Reviewed. Documents the placeholder-host diagnosis, static security audit, read-only four-account harness, and the exact evidence still required. |
| `.env.example` and `.env.local` | Shape only inspected; values never printed. `.env.local` is still an unmodified placeholder copy. `.env.example` has been changed to blank, non-working values. |
| `lib/env.ts`, `lib/stripe.ts`, `lib/rate-limit.ts` | Placeholder detection, Stripe config guards, and in-process rate-limit fallback are present and unit tested. |
| Supabase setup | No reachable project, no service-role credentials, no CLI, no `psql`, no reviewed production schema dump. Core social schema/RLS is not version controlled; `supabase/proposed_*.sql` files are marked `NOT APPLIED`. |
| Stripe integration | Webhook and billing code reviewed. Logic is covered by in-memory tests, but no test-mode key, webhook secret, price, Connect account, CLI, or test clock exists. |
| KV integration | `@upstash/redis` and `@upstash/ratelimit` are wired, but only placeholder URLs/tokens exist. The app falls back to per-instance rate limiting. |
| Verification scripts | `verify:connectivity`, `verify:integration`, `verify:infra`, and `verify:workflows` exist. All refuse to claim success without real isolated configuration. |

## 2. Current configuration verdict

| Resource | Current state | Consequence |
| --- | --- | --- |
| Supabase URL / publishable key | Placeholders in `.env.local` | `verify:connectivity` reports `blocked`; protected routes fail closed; repository calls cannot reach a database. |
| Supabase service-role key | Placeholder | No admin/API verification possible. |
| Isolated Supabase project | Absent | No RLS, auth, persistence, or cross-user verification. |
| Core social schema / RLS | Not in tracked migrations | Cannot prove production-equivalent schema; must not invent it. |
| Stripe test key / webhook secret / price | Absent | No provider API, signature, checkout, or subscription verification. |
| Stripe CLI | Absent | No local webhook delivery without manual installation/configuration. |
| KV namespace | Absent | No shared rate-limit, TTL, or error-handling verification. |
| Test accounts | Absent | Four-account matrix cannot run. |
| Staging app URL | Absent | Authenticated HTTP workflows cannot run. |

## 3. Precise infrastructure requirements checklist

### 3.1 Supabase staging project

- [ ] A **separate** Supabase project or branch exists; it is not the production project.
- [ ] Project ref is recorded in a secret manager and exported as `PHASE5_PROJECT_REF`.
- [ ] Project URL is `https://<ref>.supabase.co` and exported as `PHASE5_SUPABASE_URL`.
- [ ] Publishable/anon key is exported as `PHASE5_SUPABASE_ANON_KEY`.
- [ ] Service-role key is exported as `PHASE5_SUPABASE_SERVICE_ROLE_KEY` and never used by the browser.
- [ ] Authentication Site URL and redirect URLs are set to the staging origin.
- [ ] Email confirmation and password-reset flows work on staging.
- [ ] An `avatars` storage bucket and its policies match production.
- [ ] A read-only production schema dump has been reviewed.
- [ ] The reviewed schema has been applied to staging; tracked migrations have been applied in order.
- [ ] `supabase/proposed_*.sql` has **not** been applied to production.
- [ ] RLS is enabled and policies exist for `profiles`, `posts`, `comments`, `post_likes`, `post_saves`, `follows`, `notifications`, `reports`, `discussions`, `replies`, `post_topics`, `audit_logs`, and the tracked monetization/observability tables.
- [ ] The profile privilege-escalation guard exists, or an equivalent reviewed control is documented.
- [ ] `comments.is_removed` and Phase 1B post columns are confirmed present (or their absence is explicitly accepted as degraded).

### 3.2 Test accounts and fixtures

- [ ] USER_A, USER_B, MODERATOR, and ADMIN are confirmed users.
- [ ] `app_metadata.role` is `USER`, `USER`, `MODERATOR`, `ADMIN` respectively.
- [ ] `app_metadata.status` is `ACTIVE` for all four.
- [ ] Emails/passwords are exported as `PHASE5_<KEY>_EMAIL` / `PHASE5_<KEY>_PASSWORD`.
- [ ] Each account has a unique profile username.
- [ ] Fixtures exist: published post, draft post owned by USER_B, comment, notification for USER_B, report, earning, audit log.
- [ ] No production customer data was copied.

### 3.3 Stripe test mode

- [ ] Test-mode secret is exported as `PHASE5_STRIPE_SECRET_KEY` and starts with `sk_test_`.
- [ ] No live key is present anywhere in staging configuration.
- [ ] Webhook signing secret is exported as `PHASE5_STRIPE_WEBHOOK_SECRET`.
- [ ] An active recurring monthly price is exported as `PHASE5_STRIPE_PRICE_ID`.
- [ ] Webhook endpoint is configured for the staging route or `stripe listen` is available.
- [ ] Required events are subscribed: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`, `account.updated`, `charge.refunded`, `charge.dispute.created`.
- [ ] A Connect test account exists with `charges_enabled` and `payouts_enabled`.
- [ ] Test clock is available for renewal, failure, and cancellation scenarios.
- [ ] Full refund, partial refund, and dispute behaviors are documented and tested with test funds only.

### 3.4 KV namespace

- [ ] A separate Upstash/Vercel KV database exists.
- [ ] URL/token are exported as `PHASE5_KV_URL` / `PHASE5_KV_TOKEN`.
- [ ] It is not the same namespace as `KV_REST_API_URL` or `UPSTASH_REDIS_REST_URL`.
- [ ] `PHASE5_ALLOW_KV_WRITE=true` is set only for the disposable namespace.
- [ ] Connectivity, missing-key read, write/read/delete, TTL expiration, rate limiting, and invalid-token handling are verified by `npm run verify:infra`.

### 3.5 Verification execution

- [ ] `npm run verify:connectivity` reports `reachable`.
- [ ] `npm run verify:integration` passes all executed checks and every skip is investigated.
- [ ] `npm run verify:infra` reports `passed` with no failed or skipped required checks.
- [ ] `npm run verify:workflows` reports `passed`.
- [ ] HTTP authorization matrix, admin/moderation journeys, and Stripe event replay have been executed with recorded status codes and event IDs.
- [ ] Cleanup has removed test users, fixtures, and webhook resources or destroyed the isolated project.

## 4. Script mapping

| Requirement | Script | Status |
| --- | --- | --- |
| Supabase connectivity | `npm run verify:connectivity`, `npm run verify:infra` | Ready; blocked by configuration |
| Database/schema access | `npm run verify:infra` | Ready; blocked by configuration |
| RLS and cross-user isolation | `npm run verify:integration` | Ready; blocked by configuration |
| Authentication and role claims | `npm run verify:integration`, `npm run verify:workflows` | Ready; blocked by configuration |
| Stripe test integration | `npm run verify:infra` | Ready; blocked by configuration |
| Webhook signature processing | `npm run verify:infra` + Stripe CLI replay | Local round-trip ready; live delivery blocked |
| KV connectivity/read/write/TTL/rate limit/error handling | `npm run verify:infra` | Ready; blocked by configuration |
| Complete user workflows | `npm run verify:workflows` | Ready; blocked by configuration |

`npm run verify:integration` keeps `PHASE_D_*` as its canonical names but now accepts `PHASE5_*` aliases, so a single isolated export can drive all four scripts.

## 5. Manual configuration still required

No external resource can be provisioned from this repository alone. A human with dashboard access must:

1. Create the isolated Supabase project and apply the reviewed schema/RLS.
2. Create the four test accounts and fixtures with correct metadata.
3. Create Stripe test-mode product, price, webhook endpoint, and Connect test account.
4. Create the isolated KV database.
5. Export the `PHASE5_*` variables in the shell or CI secret store.
6. Deploy or run the app against the staging environment and expose `PHASE5_APP_URL`.
7. Execute the manual journeys and webhook replay described in `docs/staging-infrastructure.md`.

Until those steps are complete and every applicable check passes, Phase 5 is **not complete**. Documentation and tooling readiness are not a substitute for real integration evidence.
