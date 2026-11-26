# Commun.dev — isolated staging infrastructure

This is the Phase 5 runbook for provisioning a disposable, production-equivalent staging environment and executing the real integration checks. It contains no secrets. Use a password manager or CI secret store for every value.

> **Status:** the repository is prepared for staging verification, but no staging project, Stripe test resources, or KV namespace is configured in this workspace. Until they are, Phase 5 remains **blocked**, not complete. See `docs/phase-5-infrastructure-readiness.md` for the audit and `docs/phase-5-integration-report.md` for executed results.

## 1. What must exist

| Resource | Requirement | Why |
| --- | --- | --- |
| Supabase project | A **separate** project or branch, never production | Auth, Postgres, RLS, Storage, Realtime |
| Schema | Production-equivalent tables, constraints, indexes, triggers, grants, policies, migration ledger | The app cannot be tested against an invented schema |
| Auth | Confirmed test users, redirect allowlist, email templates, Site URL | Sessions and redirects |
| Storage | Avatars bucket and policies matching production | Profile image upload |
| Stripe | Test-mode account, price, webhook secret, Connect test account, CLI | Billing lifecycle |
| KV | Isolated Upstash/Vercel KV namespace | Shared rate limiting |
| App | A preview/deployment pointed only at staging | Browser/HTTP workflows and webhook reachability |

### Hard rules

- Never point staging at production Supabase, Stripe live mode, or production KV.
- Never copy production customer data into staging.
- Never run destructive tests against production.
- Never commit real values to `.env.example`, `.env.local`, docs, or fixtures.
- Do not apply `supabase/proposed_*.sql` to production. Rehearse them only on the isolated project after reviewing a read-only production dump.

## 2. Supabase staging setup

### 2.1 Create the project

1. Create a new Supabase project dedicated to staging. Record the 20-character project ref in a password manager.
2. Record:
   - Project URL: `https://<ref>.supabase.co`
   - Publishable/anon key
   - Service-role key (server only)
   - Database password or access token
3. Configure **Authentication → URL Configuration**:
   - Site URL: the staging origin, e.g. `https://staging.commun.dev`
   - Redirect URLs: `https://staging.commun.dev/auth/callback`, `http://localhost:3000/auth/callback`
4. Configure email templates/confirmation and password-reset redirects.

### 2.2 Apply the production-equivalent schema

The core social schema is **not in tracked migrations**. Before staging can validate RLS, export a read-only schema from production and review it:

```bash
pg_dump --schema-only --no-owner --no-privileges "$PRODUCTION_DATABASE_URL" > production-schema.sql
```

Review tables, columns, constraints, indexes, grants, triggers, RLS enablement, policies, and the migration ledger. Then apply the reviewed dump to the isolated project:

```bash
psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f production-schema.sql
for f in supabase/migrations/*.sql; do
  psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```

Do **not** apply `supabase/proposed_social_core.sql` or `supabase/proposed_phase_1b_social.sql` until the production dump has been reviewed and the change has been rehearsed on staging. The Phase 1B proposal contains the profile privilege-escalation guard and column revokes; if production lacks an equivalent guard, this is the highest-priority RLS gap.

### 2.3 Verify schema and RLS

Run these checks in the Supabase SQL editor or `psql`:

```sql
-- Every application table must have RLS enabled.
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by relname;

-- Every policy on core social tables.
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Profile privilege guard must exist or be deliberately replaced.
select tgname, tgenabled
from pg_trigger
where tgrelid = 'public.profiles'::regclass and not tgisinternal;
```

Required RLS coverage: `profiles`, `posts`, `comments`, `post_likes`, `post_saves`, `follows`, `notifications`, `reports`, `discussions`, `replies`, `post_topics`, `audit_logs`, plus the monetization/observability tables in the tracked migrations.

### 2.4 Storage

Create an `avatars` bucket with the same visibility and policies as production. Verify a signed-in user can upload only to their own folder and that public reads work only if the product requires them.

### 2.5 Test accounts

Create four confirmed users. Set `app_metadata` through the Admin API or dashboard, never through a client call:

| Account | `app_metadata.role` | `app_metadata.status` |
| --- | --- | --- |
| USER_A | `USER` | `ACTIVE` |
| USER_B | `USER` | `ACTIVE` |
| MODERATOR | `MODERATOR` | `ACTIVE` |
| ADMIN | `ADMIN` | `ACTIVE` |

Use unique passwords and store them in the secret manager. Do not reuse production passwords. Export them as `PHASE5_<KEY>_EMAIL` and `PHASE5_<KEY>_PASSWORD`. `npm run verify:integration` and `npm run verify:workflows` both assert role/status claims.

### 2.6 Fixtures

Create at least:

- one published post by USER_A;
- one draft post by USER_B;
- one comment and one reply;
- one notification for USER_B;
- one report submitted by USER_B;
- one creator account, membership, and earning for USER_B;
- one audit-log row (created by an admin action);
- one custom username per account.

`npm run verify:integration` expects the draft post, notification, report, earning, and audit-log row to exist. `npm run verify:workflows` creates and removes its own uniquely marked fixtures.

## 3. Stripe test mode

1. Enable **Test mode** in the Stripe dashboard.
2. Create a product and recurring monthly price. Record `price_...` as `PHASE5_STRIPE_PRICE_ID`.
3. Record the test secret key (`sk_test_...`) as `PHASE5_STRIPE_SECRET_KEY` and webhook signing secret (`whsec_...`) as `PHASE5_STRIPE_WEBHOOK_SECRET`.
4. Configure the webhook endpoint:
   - Local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Staging: `https://<staging-origin>/api/webhooks/stripe`
5. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `account.updated`
   - `charge.refunded`
   - `charge.dispute.created`
6. Create a Connect test account for the creator and complete test onboarding. Confirm `charges_enabled` and `payouts_enabled`.
7. Use a Stripe test clock for subscription renewal, failure, and cancellation scenarios.

### What to verify

| Scenario | Expected |
| --- | --- |
| Checkout session | Test session created; metadata contains the creator and subscriber |
| Valid webhook signature | Accepted |
| Invalid/missing signature | 400, no storage mutation |
| Duplicate event | Acknowledged, processed once |
| `invoice.paid` | Earnings row with gross/fee/net |
| `invoice.payment_failed` | Membership state unchanged or marked past due per product policy |
| Subscription update | Membership period/status synchronized |
| Subscription cancellation | Membership cancelled |
| Full refund | Earning marked `refunded` |
| Partial refund | Acknowledged/logged; manual reconciliation |
| Dispute | Acknowledged/logged; manual reconciliation |
| Payouts disabled | Checkout blocked with 503/409-style response |

Never use live keys. `npm run verify:infra` refuses `sk_live_` and checks that the provider reports `livemode=false`. Unit tests cover webhook logic, but only `stripe listen` or a dashboard-delivered event can verify real signature verification and persistence.

## 4. KV / Upstash

1. Create a separate Upstash Redis database for staging.
2. Record the REST URL and token as `PHASE5_KV_URL` and `PHASE5_KV_TOKEN`.
3. Set `PHASE5_ALLOW_KV_WRITE=true` only for this disposable namespace.
4. `npm run verify:infra` verifies:
   - `GET /ping` connectivity;
   - missing-key read returns null;
   - write/read/delete round-trip with a unique namespaced key;
   - TTL is positive and a short-lived key expires;
   - sliding-window rate limiting allows two requests and blocks the third;
   - invalid token returns 401/403 instead of a 200 or app-level 500.
5. Without KV, the app falls back to in-process rate limiting. That is acceptable for local development only; multi-instance staging must use KV.

## 5. Environment variables

Application variables (see `.env.example`; all secret values should be blank in the template):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=
KV_REST_API_URL=
KV_REST_API_TOKEN=
CRON_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_MEMBERSHIP_MONTHLY=
STRIPE_PLATFORM_FEE_PERCENT=10
```

Phase 5 verification variables (never used by the app at runtime):

```dotenv
PHASE5_CONFIRM_ISOLATED=yes
PHASE5_APP_URL=http://localhost:3000
PHASE5_PROJECT_REF=
PHASE5_SUPABASE_URL=
PHASE5_SUPABASE_ANON_KEY=
PHASE5_SUPABASE_SERVICE_ROLE_KEY=
PHASE5_USER_A_EMAIL=
PHASE5_USER_A_PASSWORD=
PHASE5_USER_B_EMAIL=
PHASE5_USER_B_PASSWORD=
PHASE5_MODERATOR_EMAIL=
PHASE5_MODERATOR_PASSWORD=
PHASE5_ADMIN_EMAIL=
PHASE5_ADMIN_PASSWORD=

PHASE5_STRIPE_SECRET_KEY=
PHASE5_STRIPE_WEBHOOK_SECRET=
PHASE5_STRIPE_PRICE_ID=

PHASE5_KV_URL=
PHASE5_KV_TOKEN=
PHASE5_ALLOW_KV_WRITE=true
```

`PHASE_D_*` remains supported for Supabase/account variables in `npm run verify:integration`, and `PHASE5_*` aliases are accepted there. Do not use `NEXT_PUBLIC_*`, `STRIPE_SECRET_KEY`, or `KV_REST_API_*` as verification inputs: the scripts deliberately refuse a target equal to the application project/namespace and refuse live Stripe keys.

## 6. Verification sequence

Run from the repository root.

```bash
# 1. Static checks
npm run typecheck
npm run lint
npm test
npm run build

# 2. Configuration/network preflight (masked output)
npm run verify:connectivity

# 3. Supabase auth + role claims + cross-account RLS reads
npm run verify:integration

# 4. Supabase schema/access, Stripe test mode, KV probes
npm run verify:infra

# 5. Authenticated user workflows against the staging app
npm run verify:workflows

# 6. Render smoke checks (public surfaces and guards)
node scripts/smoke-test.mjs --url=http://localhost:3000
```

Then execute manually:

1. User journey: register → verify → onboarding → profile update → create post → edit → delete → comment → edit comment → delete comment → like/unlike → follow/unfollow → notifications → settings.
2. Cross-user journey: USER_B must not read USER_A's draft, notifications, reports, or billing rows; USER_B must not edit/delete USER_A's post or comment.
3. Admin journey: USER_A/MODERATOR denied; ADMIN can list users, change roles/status, view audit logs.
4. Moderation journey: USER_A submits report; MODERATOR resolves/dismisses/removes/restores; audit rows recorded.
5. Payment journey: checkout → test payment → webhook → membership synchronized → cancel → refund → verify earnings.
6. Expired session: clear/expire the session and confirm protected pages redirect and APIs return 401.

Record exact HTTP status codes, row counts, and event IDs. Do not mark a check verified without evidence.

## 7. Cleanup

After verification:

1. Delete the four test users and all fixture rows, or destroy the isolated Supabase project.
2. Delete Stripe test customers, subscriptions, Connect account, price/product, and webhook endpoint.
3. Delete the isolated KV namespace.
4. Rotate any key that was pasted into a shell, ticket, or chat.
5. Confirm no production resource was touched.

## 8. Definition of done checklist

- [ ] Isolated Supabase project exists and is not production.
- [ ] Production-equivalent schema and RLS are applied and reviewed.
- [ ] Core social tables have RLS enabled and policies matching production.
- [ ] Profile privilege guard is present or an equivalent is approved.
- [ ] Four confirmed accounts with correct `app_metadata`.
- [ ] Fixtures exist for posts, comments, notifications, reports, earnings, audit logs.
- [ ] Stripe test mode configured; no live keys.
- [ ] Webhook endpoint verified with `stripe listen` or dashboard delivery.
- [ ] Full refund, partial refund, dispute, failed payment, cancellation exercised.
- [ ] KV read/write/TTL/error/rate-limit behavior verified.
- [ ] `npm run verify:connectivity` passes.
- [ ] `npm run verify:integration` passes.
- [ ] `npm run verify:infra` passes.
- [ ] `npm run verify:workflows` passes.
- [ ] User, admin/moderation, and payment journeys pass.
- [ ] No cross-user access found.
- [ ] Any finding is fixed and re-tested.
- [ ] Test users/fixtures deleted or the project destroyed.

Until every item is checked with real evidence, Phase 5 is blocked.
