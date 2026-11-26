# Phase D — Backend integration and reliability validation

Date: 2026-11-23
Branch: `main`
Mode: verification and reliability hardening; no commit, deployment, migration, or production data change
Status: **BLOCKED on real infrastructure**

## 1. Executive verdict

The layered application code is internally consistent and its local verification suite passes. It has **not** been verified against a real Supabase project, real Stripe test mode, or real multi-account sessions in this environment.

The root cause is concrete, not a code defect in the services:

- `.env.local` is an unmodified copy of `.env.example`.
- The Supabase URL is `https://your-project.supabase.co`, so DNS resolution fails with `ENOTFOUND` before any request reaches Supabase.
- The publishable key, service-role key, and KV token are documented placeholders.
- No real Supabase, Upstash, Stripe, or staging credentials exist in the shell, repository, or local tooling.
- The repository does not contain the core social schema or its RLS policies. The files that reference those tables are marked `PROPOSED — NOT APPLIED`.
- Docker Desktop is installed but its daemon is not running, the Supabase CLI is absent, and `psql` is absent. A faithful local stack cannot be built from the tracked migrations anyway.

Therefore Phase D's success condition is **not met**. No claim is made that RLS, authentication, cross-user isolation, repository writes, Stripe test-mode events, or the ten end-to-end journeys work against real infrastructure.

What *was* completed:

- connectivity diagnosis with secret-safe evidence;
- a static security and contract audit of the layered services and repositories;
- safe fixes for defects found during the audit;
- local unit, structural, build, and unauthenticated smoke verification;
- a read-only, isolation-guarded integration harness for the four-account matrix, plus a safe procedure to finish Phase D once an isolated project is available.

## 2. Initial inspection

| Item | Result |
| --- | --- |
| Current branch | `main` |
| Uncommitted entries | 101 (85 modified, 16 untracked) before this report was added |
| Commits / deployments / migrations | None |
| Destructive git operations | None |
| Docs reviewed | `ARCHITECTURE.md`, `docs/api-contracts.md`, `docs/engineering-report.md`, `docs/deployment.md`, `docs/private-beta-checklist.md` |
| Services reviewed | All files under `server/modules/*/service.ts` |
| Repositories reviewed | All files under `server/repositories/*.ts` |
| Supabase clients reviewed | `lib/supabase/{server,client,admin}.ts`, `lib/admin.ts`, `proxy.ts` |
| Env names reviewed | `.env.example`; `.env.local` values inspected only for placeholder shape, never printed |

The prior API-layering pass remains intact: all 26 `/api/v1` routes are thin `toResponse` adapters, and all implemented legacy routes re-export their v1 handlers except the Stripe webhook. `server/http/boundaries.test.ts` guards those invariants.

## 3. Connectivity diagnosis

### 3.1 Evidence

A one-off diagnostic and the maintained `scripts/phase-d-connectivity.mjs` both produced the same result. Neither prints keys, tokens, project refs, or raw response bodies.

| Probe | Result |
| --- | --- |
| Supabase URL present | Yes |
| Supabase URL configured (not a placeholder) | **No** |
| Publishable key present | Yes |
| Publishable key configured | **No** |
| Service-role key present | Yes |
| Service-role key configured | **No** |
| DNS lookup of configured host | **`ENOTFOUND`** for `your-project.supabase.co` |
| TLS handshake | Not attempted after DNS failure |
| `/auth/v1/health` | `TypeError: fetch failed` (cause `ENOTFOUND`) |
| `/rest/v1/profiles` | `TypeError: fetch failed` (cause `ENOTFOUND`) |
| Supabase JS `from('profiles').select()` | Threw `fetch failed` before a request was made |
| General DNS to `supabase.com`, `registry.npmjs.org`, `api.stripe.com` | Resolved successfully |
| Upstash / Vercel KV | URL and token are placeholders |
| Stripe | Secret key, webhook secret, and price are absent from `.env.local` |
| `CRON_SECRET` | Absent from `.env.local` |

`npm run verify:connectivity` exits `1` with verdict `blocked` and the reason “Supabase URL or publishable key is missing or still a placeholder.”

### 3.2 Root cause

`lib/supabase/server.ts`, `lib/supabase/client.ts`, and `proxy.ts` fall back to a placeholder Supabase project or construct a client from the placeholder values. Every subsequent request therefore attempts to resolve a host that cannot exist. The `fetch failed` error was a configuration failure, not a network outage, TLS problem, Supabase outage, or timeout.

The effective configuration was loaded by Next.js from `.env.local` (last modified 2026-11-06), so restarting the server could not fix it.

### 3.3 Credentials and environment inventory

| Potential source | Result |
| --- | --- |
| Shell variables (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_*`, `STRIPE_*`, `KV_*`, `UPSTASH_*`, `CRON_*`) | None set |
| `.env` / `.env.production` / `.env.development.local` | Absent |
| `.env.local` | Present; placeholders only |
| `~/.pgpass` | Absent |
| Vercel CLI / linked `.vercel` directory | Absent |
| Supabase CLI | Absent |
| Docker daemon | Installed, not running |
| `psql` | Absent |
| `supabase/.temp/linked-project.json` | Metadata only; no access token or database password |
| Git history for env files | No env file was ever committed; no secret exposure found |

No secret values were written to logs, reports, test files, or shell history by this phase.

### 3.4 Why a local stack was not substituted

Starting a local Supabase stack would not satisfy the requirement:

1. The tracked migrations create only the newer monetization, observability, and news tables.
2. `profiles`, `posts`, `comments`, `post_likes`, `post_saves`, `follows`, `notifications`, `reports`, `discussions`, `replies`, `post_topics`, and `audit_logs` are referenced by the application but created outside version control.
3. `supabase/proposed_social_core.sql` and `supabase/proposed_phase_1b_social.sql` explicitly say they have not been applied and must not be executed without a reviewed dump, a disposable project, and owner approval.
4. Reconstructing those tables from application queries would test an invented schema, not production. That would be less honest than reporting the blocker.
5. No mocks were used to claim database, RLS, auth, or Stripe validation.

## 4. Reliability and security fixes applied

These fixes are directly tied to defects found while diagnosing or auditing. They are uncommitted with the rest of the work.

| Change | Reason | Verification |
| --- | --- | --- |
| `lib/env.ts` placeholder detection | Placeholder values previously looked “configured” | `lib/env.test.ts` (5 tests) |
| `lib/rate-limit.ts` uses in-process fallback for placeholder KV | Otherwise every rate-limited route would call `your-kv.upstash.io` and fail | `lib/rate-limit.test.ts` (2 tests) |
| `lib/stripe.ts` ignores placeholder keys and price | `sk_test_your-secret-key` starts with `sk_`, so billing previously looked enabled | `lib/stripe.test.ts` (2 tests) |
| `isConnectReady` / `accountStatus` now require `payouts_enabled` | Destination charges cannot transfer to a creator who cannot receive payouts | `lib/monetization.test.ts` (20 tests) |
| Stripe webhook handles fully refunded invoices; logs partial refunds and disputes | Refund state was previously never written despite the `earnings.status` enum allowing `refunded` | `lib/webhook-stripe.test.ts` (13 tests) |
| `proxy.ts` fails closed for protected paths | An auth-check exception used to continue to the protected page; placeholders were treated as configured | `scripts/smoke-test.mjs`: 20/20 checks |
| `scripts/phase-d-connectivity.mjs` + `npm run verify:connectivity` | Reproducible, secret-safe infrastructure preflight | Ran locally; correctly reports `blocked` |
| `scripts/phase-d-integration.mjs` + `npm run verify:integration` | Guarded read-only account/RLS harness for the future isolated project | Refuses to run without explicit isolation confirmation and matching project ref; refuses the application project |
| `docs/deployment.md` updated | Previous text pointed at the wrong webhook file and claimed dispute handling that does not exist | Reviewed |

### 4.1 Refund and dispute caveats

- The pinned Stripe type package (v23) no longer exposes the legacy `invoice` link on `Charge`. The webhook reads it defensively at runtime; if the field is absent, the refund is logged as unmapped and the event still completes. This needs verification against the Stripe API version configured in the dashboard.
- Only **fully refunded** charges update the ledger to `refunded`. Partial refunds leave the earning as `paid` and emit `stripe.refund.partial` because the schema has no partial-refund amount model.
- Disputes are acknowledged for idempotency and logged as `stripe.dispute.created`, but the ledger has no `disputed` state and is deliberately not mutated. Manual reconciliation is required.
- Payout eligibility is now checked at checkout time, but a creator whose payouts are later disabled is not automatically prevented from having an existing membership renew. A `account.updated`/checkout-time race remains a provider-level risk.

## 5. Repository integration coverage

No live repository test was executed because no reachable, isolated database existed. The table records what was reviewed and what remains blocked.

| Domain | Repository / queries reviewed | Live test status |
| --- | --- | --- |
| Profiles | `findProfileById`, `findProfileStatus`, `findUsernameOwner`, `updateProfileById`, `updateProfileWithWriter` | BLOCKED |
| Posts / articles | `listPublishedPosts`, `findPostBySlug`, `findPostById`, `insertPost`, `updatePostById`, `softRemovePost`, topic replacement | BLOCKED |
| Comments | `listCommentsForPost`, `insertComment`, `findCommentAuthor` | BLOCKED |
| Reactions | `post_likes` / `post_saves` count, find, add, remove | BLOCKED |
| Follows | target lookup, insert, delete | BLOCKED |
| Notifications | list by recipient, actor lookup, mark read, clear | BLOCKED |
| Reports (user) | target lookup, insert, list by reporter | BLOCKED |
| Moderation | list/filter reports, find report, update report, content author lookup, content update | BLOCKED |
| Admin | auth-admin list/get/update user, audit-log list | BLOCKED |
| Billing | creator account, membership, billing customer, upsert/insert | BLOCKED |
| Product telemetry | feedback insert, event insert | BLOCKED |

Static review notes:

- Repositories accept injected `SupabaseClient` instances, so user-scoped and service-role access remain explicit at the call site.
- `server/repositories/types.ts` narrows PostgREST results without hiding errors.
- List queries use explicit columns and bounded `range`/`limit` values.
- No repository accepts a caller-supplied user id for a user-scoped operation; services derive the actor from the session.
- Admin and moderation repositories are only called after `requireRole`, using the service-role client.

## 6. RLS results

**No live RLS assertion was executed.** This section is a static audit of what version control can prove.

### 6.1 Policies present in tracked migrations

| Table | Policy / access rule |
| --- | --- |
| `product_events` | insert own only; select for admins via `auth.jwt() -> 'app_metadata' ->> 'role' = 'ADMIN'` |
| `beta_feedback` | insert own only; select for admins via the same app-metadata claim |
| `developer_news` | public select (`true`) |
| `saved_news` | own rows only for all operations |
| `creator_accounts` | own row, or rows with `details_submitted = true`; browser writes revoked |
| `billing_customers` | own row only; browser writes revoked |
| `memberships` | subscriber or creator read only; browser writes revoked |
| `earnings` | creator read only; browser writes revoked |
| `stripe_webhook_events` | service-role only; browser access revoked |

These policies are coherent with the application's authorization model and do not weaken access.

### 6.2 Core tables with no policy in version control

The repository contains **no `CREATE POLICY` statement** for:

`profiles`, `posts`, `comments`, `post_likes`, `post_saves`, `follows`, `notifications`, `reports`, `discussions`, `replies`, `post_topics`, `audit_logs`.

The core social SQL files are explicitly marked `PROPOSED — NOT APPLIED`. `proposed_phase_1b_social.sql` would add:

- a trigger preventing non-service-role updates to `profiles.status` and `profiles.role`;
- column-level revokes for those two columns;
- a case-insensitive username index;
- notification-type constraints.

Because that proposal is not applied, this report cannot claim the guard exists in production. If production has no equivalent trigger or grant restriction, a signed-in user who can update their profile through PostgREST could attempt to promote their own `role` or change `status`. The application's own profile service does not send those fields, but direct Supabase access bypasses the application. **This is the highest-priority unknown in Phase D.**

### 6.3 Required RLS matrix (not executed)

| Actor | Object | Expected result | Status |
| --- | --- | --- | --- |
| anonymous | public profile / published post | readable according to public policy | NOT RUN |
| anonymous | draft post, report, notification, billing row | not readable | NOT RUN |
| USER_A | own profile | update allowed | NOT RUN |
| USER_B | USER_A profile | update denied | NOT RUN |
| USER_A | own post / comment / reply / discussion | create, edit, soft-delete allowed | NOT RUN |
| USER_B | USER_A content | edit/delete denied | NOT RUN |
| USER_A | own notification | read / mark read | NOT RUN |
| USER_B | USER_A notification | denied | NOT RUN |
| USER_A | report created by USER_B | denied | NOT RUN |
| USER_A | billing rows of USER_B | denied | NOT RUN |
| USER_A | `audit_logs`, `stripe_webhook_events` | denied | NOT RUN |
| MODERATOR | all reports via API | allowed after role check | NOT RUN |
| USER_A | moderation/admin API | 403 | NOT RUN |
| ADMIN | admin API | allowed after role check | NOT RUN |
| expired JWT | protected page / API | redirect or 401 | NOT RUN |

## 7. Authentication and authorization

### 7.1 Application model

- Identity comes from the Supabase Auth session cookie; services never accept an actor id from a request body.
- `app_metadata.role` is the authoritative application role; users can only change it through the admin API, which is service-role gated after `requireRole('admin')`.
- `proxy.ts` redirects unauthenticated protected pages and now fails closed when Supabase is unconfigured or the auth check throws.
- Page-level checks (`redirect`) and API-level checks (401/403) remain as defense in depth.
- User-scoped services use the cookie-bound Supabase client, so RLS is intended to be the second layer.
- Moderation, admin, user-admin, and webhook operations use the service-role client only after an authorization decision.

### 7.2 Observed unauthenticated results

| Check | Result |
| --- | --- |
| `/dashboard`, `/feed`, `/write`, `/saved`, `/notifications`, `/settings` | 307 → `/login?next=…` |
| `/moderation`, `/admin/users`, `/admin/audit-logs` | 307 → `/login?next=…` |
| `/api/notifications` and `/api/v1/notifications` | 401 |
| `/api/feed` and `/api/v1/feed` | 401 |
| `/api/v1/admin/users`, `/api/v1/admin/audit-logs` | 401 |
| `/api/v1/moderation/reports` | 401 |
| `/api/v1/reports` | 401 |
| `/api/v1/feedback` | 401 |
| `/api/v1/analytics` | 401 |
| `/api/v1/billing/checkout`, `/connect`, `/portal` | 401 |
| `/api/v1/news/ingest` | 401 |
| `POST`-only route requested with `GET` | 405 |

These verify the unauthenticated boundary only. They do not verify role or ownership behavior.

### 7.3 Authorization matrix (code-audited, live status blocked)

| Surface | Required authorization | Live evidence |
| --- | --- | --- |
| `GET /api/v1/admin/*`, `PATCH /api/v1/admin/users` | `ADMIN` app-metadata role | BLOCKED |
| `GET/POST /api/v1/moderation/reports*` | `MODERATOR` or `ADMIN` | BLOCKED |
| `GET/POST /api/v1/billing/connect` | authenticated active user, own account only | BLOCKED |
| `POST /api/v1/billing/checkout` | authenticated active user; cannot subscribe to self; creator must have payouts enabled | BLOCKED |
| `POST /api/v1/billing/portal` | authenticated user, own billing customer | BLOCKED |
| `GET /api/v1/reports` | authenticated user, own reports | BLOCKED |
| `POST /api/v1/reports` | authenticated active user; target must exist | BLOCKED |
| `POST /api/v1/feedback`, `/analytics` | authenticated user (feedback also requires active status) | BLOCKED |
| `GET /api/v1/news` | public | PASS (200) |
| `POST /api/v1/news/ingest` | valid `CRON_SECRET` bearer or `ADMIN` | BLOCKED |
| `POST /api/webhooks/stripe` | valid Stripe signature | PASS in unit/in-memory test; BLOCKED against Stripe test mode |
| Social content edits/removals | resource owner, or moderator/admin workflow | BLOCKED |

### 7.4 Behavior deltas introduced by the layering refactor

These are intentional or accepted but should be reviewed before release:

1. **Reports and feedback now require `ACTIVE` status.** The original handlers required only authentication. This may prevent pending-verification users from reporting abuse or sending beta feedback.
2. **Moderation actions `SUSPEND` and `RESTORE_USER` were removed from the accepted enum.** The original route accepted them but never implemented them; the old code would have treated them as a content restore. Returning 422 is safer than falsely reporting success, but it is a visible contract change.
3. **Invalid moderation query parameters now return 422 instead of throwing a 500.**
4. **Checkout now fails if the billing customer cannot be persisted** instead of continuing to Stripe checkout.
5. **Checkout now requires `payouts_enabled`, not just details and charges.**
6. **News query inputs are bounded** (`category` 60, `q` 120, `limit` 50).
7. **Unauthenticated news-ingest message** is now “Authentication required.” instead of the previous generic message.
8. **Proxy auth failures fail closed** for protected paths.

## 8. API and service correctness

### 8.1 Locally verified

| Check | Result |
| --- | --- |
| `ServiceResult` success/failure to HTTP conversion | PASS (`server/http/boundaries.test.ts`) |
| 204 response has no body | PASS |
| Failure headers preserve `Retry-After` | PASS |
| All v1 routes remain `toResponse` adapters | PASS |
| All legacy routes remain v1 re-exports except webhook | PASS |
| Rate-limit fallback for missing/placeholder KV | PASS |
| Stripe placeholder config is treated as absent | PASS |
| Payout gating | PASS |
| News pagination, limit clamping, category filter, empty page | PASS (live external sources; see below) |
| Legacy/v1 parity for tested unauthenticated paths | PASS (same status and body) |
| Invalid moderation query shape | Unit-level only |
| Validation failures with a real session | BLOCKED |
| Permission failures with USER_B / MODERATOR / ADMIN | BLOCKED |
| Database error mapping | Partial: observed 500s caused by placeholder DNS |
| Empty results with a real empty database | BLOCKED |

### 8.2 Live API observations (placeholder environment)

| Endpoint | Status | Meaning |
| --- | --- | --- |
| `/api/v1/posts` and `/api/posts` | 500 `Unable to load articles.` | Supabase DNS failure; honest error, no fake data |
| `/api/v1/search?q=react` and `/api/search?q=react` | 500 `Unable to search right now.` | Same |
| `/api/v1/news?limit=2` | 200, 2 items | External developer-news sources are reachable |
| `/api/v1/news?limit=999` | 200, `limit=50` | Input clamp works |
| `/api/v1/news?page=-3&limit=0` | 200, page 1, limit 20 | Invalid values normalize |
| `/api/v1/news?page=99&limit=2` | 200, 0 items, total 45 | Empty page shape works |
| `/api/v1/news?category=Web%20Development&limit=1` | 200, 1 item | Category filter works |
| `/api/v1/feed` | 401 | Auth required |
| `/api/v1/notifications` | 401 | Auth required |
| `GET` on POST-only analytics/feedback/checkout | 405 | Method guard works |

The news endpoint returns live external data even when Supabase is unavailable because `lib/news.ts` has a live-fetch fallback. That is a genuine partial success, not a database read.

### 8.3 Not verified

- Real HTTP status mapping for repository failures such as unique violations, FK violations, and RLS denials.
- Pagination against real posts/comments/reports.
- Duplicate report handling (`23505`) with a real unique constraint.
- `Retry-After` on an authenticated 429 response.
- Expired-session refresh/redirect behavior.
- Concurrent writes and webhook race behavior.
- Real audit-log writes and notification inserts.

## 9. Stripe verification

Stripe was not configured, so no request reached Stripe's API. The webhook route was exercised with the real route code and an in-memory Supabase/Stripe fake, matching the existing project test pattern.

| Scenario | Result |
| --- | --- |
| Missing signature | 400 |
| Invalid signature | 400, no storage write |
| Unconfigured Stripe | 503 |
| `checkout.session.completed` retrieves subscription and stores membership/customer | PASS |
| `customer.subscription.created` / `updated` upserts membership | PASS |
| `customer.subscription.deleted` cancels membership | PASS |
| `invoice.paid` records gross/fee/net ledger row | PASS |
| Unmapped invoice does not write earnings | PASS |
| Duplicate event is acknowledged and processed once | PASS |
| `account.updated` syncs details/charges/payouts flags | PASS |
| Fully refunded invoice marks earning `refunded` | PASS |
| Duplicate refund event stays idempotent | PASS |
| Partial refund leaves earning `paid` and logs | PASS |
| Dispute is acknowledged but does not mutate earnings | PASS (by design; manual reconciliation) |
| Processing exception marks event `failed` and returns 500 for retry | PASS |
| Payouts disabled blocks checkout | PASS (unit) |

Practical Stripe test-mode work remains blocked:

- no `sk_test_...`, `whsec_...`, or `price_...` values;
- no Stripe CLI / `stripe listen`;
- no test clock or test customer;
- no Connect test account with onboarding;
- no way to verify the dashboard's webhook API version and event subscriptions.

Recommended event subscriptions once test mode is available: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `account.updated`, `charge.refunded`, `charge.dispute.created`.

## 10. End-to-end journeys

| # | Journey | Status | Evidence / blocker |
| --- | --- | --- | --- |
| 1 | Register and authenticate | BLOCKED | `/register` and `/login` render 200; no Supabase project to create or verify a session |
| 2 | Complete onboarding | BLOCKED | Requires session and profiles table |
| 3 | View and edit developer profile | BLOCKED | Profile pages require Supabase data; write requires session |
| 4 | Create a post | BLOCKED | `/api/v1/social-posts` requires session; posts table unreachable |
| 5 | Like and comment on a post | BLOCKED | Requires two sessions and persisted post |
| 6 | Follow another developer | BLOCKED | Requires two sessions and `follows` table |
| 7 | View notifications | BLOCKED | API returns 401; no notification rows |
| 8 | Publish or view an article | BLOCKED | `/api/v1/posts` returns 500 due to placeholder Supabase |
| 9 | Submit a report | BLOCKED | API returns 401; no account and no report target |
| 10 | Moderator and administrator workflows | BLOCKED | No MODERATOR/ADMIN accounts, no persisted reports, no audit rows |

A public-path partial success exists: the landing, news, explore, discussions, login, and registration pages render, and the developer-news feed works from external sources. That is not equivalent to the authenticated journeys.

## 11. Verification results

Commands were run sequentially from the repository root.

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — 0 errors, 7 pre-existing warnings |
| `npm test` | PASS — 21 files, 130 tests |
| `npm run build` | PASS — 92 pages; known local `@next/swc-darwin-arm64` dlopen warning, WASM fallback used |
| `node scripts/smoke-test.mjs --url=http://localhost:3000` | PASS — 20/20 checks |
| `npm run verify:connectivity` | EXPECTED FAILURE — verdict `blocked`; Supabase placeholders |
| `npm run verify:integration` | EXPECTED REFUSAL — no isolated project; guards reject missing `PHASE_D_CONFIRM_ISOLATED` and any project equal to `NEXT_PUBLIC_SUPABASE_URL` |
| News API checks | PASS — 200, bounded pagination/filter/empty page |
| Responsive/theme audit | Not rerun; no UI-visible change in Phase D. Prior 56/56 audit remains the latest UI evidence |

Smoke coverage: homepage, `/news`, `/explore`, `/discussions`, `/login`, `/register`, `/robots.txt`, `/sitemap.xml`, nine protected redirects, two unauthenticated API guards, and baseline security headers.

## 12. Failed checks and root causes

| Failure | Root cause | Fix status |
| --- | --- | --- |
| Supabase REST/Auth requests fail with `fetch failed` | Placeholder host in `.env.local`; DNS `ENOTFOUND` | Requires real project configuration |
| `/api/v1/posts` returns 500 | Same placeholder Supabase dependency | Blocked |
| `/api/v1/search` returns 500 | Same | Blocked |
| No repository integration tests | No isolated database, no credentials, core schema unversioned | Blocked |
| No cross-account RLS/auth tests | No USER_A/USER_B/MODERATOR/ADMIN accounts | Blocked |
| No Stripe test-mode test | No Stripe test credentials or CLI | Blocked |
| No end-to-end journeys | All of the above | Blocked |
| `verify:connectivity` exit 1 | Correctly detects placeholders | Working as designed |

No test was made to pass by weakening security or replacing real data access with a mock.

## 13. Environment requirements and safe completion procedure

### 13.1 Required resources

| Resource | Requirement |
| --- | --- |
| Supabase | A **separate** project or branch dedicated to Phase D, never production |
| Supabase schema | Full production-equivalent schema, including core social tables and RLS policies, applied and reviewed |
| Supabase Auth | Site URL and redirect allowlist set to the test origin |
| Supabase keys | Publishable key, service-role key (server only), and database password or access token |
| Upstash / KV | Test namespace URL and token |
| Stripe | Test-mode secret, webhook secret, monthly price, Connect test account |
| Stripe CLI | `stripe listen --forward-to localhost:3000/api/webhooks/stripe` |
| Test accounts | USER_A, USER_B, MODERATOR, ADMIN with confirmed email and correct app metadata |
| Fixtures | A published post, draft post, comment, discussion, reply, notification, report, creator account, membership |
| Cron | A long random `CRON_SECRET` if ingestion is tested |

### 13.2 Procedure

1. Create or select an isolated Supabase project and record its project ref in a password manager.
2. Take a read-only schema dump of production. Review tables, columns, constraints, indexes, grants, triggers, RLS policies, and the migration ledger. Do **not** apply the proposal files to production.
3. Apply the reviewed schema to the isolated project. Rehearse `supabase/proposed_phase_1b_social.sql` only after confirming the privilege guard is absent or needs replacement, and only on the isolated project.
4. Set `.env.local` (or CI secrets) with the isolated project's URL, publishable key, service-role key, site URL, and Upstash credentials. Never commit them.
5. Run `npm run verify:connectivity`. Require verdict `reachable` before any data test.
6. Create the four test accounts manually or through the Supabase admin API. Set `app_metadata.role` to `USER`, `USER`, `MODERATOR`, and `ADMIN`; ensure all four are `ACTIVE` and email-confirmed.
7. Create the fixture rows through the application's normal flows where possible, not by guessing production schema. The read-only integration harness expects one draft post, notification, report, and earning owned by USER_B, plus at least one audit-log row.
8. Export the `PHASE_D_*` variables and run `npm run verify:integration`. It signs in the accounts and asserts cross-account RLS denial without writing. Exit `0` means executed checks passed; investigate every `skipped` entry rather than treating it as a pass.
9. Run the RLS matrix in §6.3 with separate browser sessions or separate Supabase clients. Record actual status codes and row counts. The harness covers database-level reads; it does not replace the HTTP authorization matrix.
10. Run `node scripts/smoke-test.mjs --url=http://localhost:3000`, then repeat against the deployed preview.
11. Configure Stripe test mode, forward webhooks with the Stripe CLI, and exercise the event list in §9. Verify the event ledger and earnings rows after each event.
12. Test refunds with a full refund and a partial refund. Test a dispute in the Stripe dashboard. Confirm the documented behavior (full refund updates; partial/dispute require reconciliation).
13. Delete the test users and fixture rows, or destroy the isolated project. Confirm no production resource was touched.
14. Rotate any key that was pasted into a shell, ticket, or chat.

### 13.3 Suggested Phase D environment names

Use distinct `PHASE_D_*` names for tests so a production URL can never be picked up accidentally:

```text
PHASE_D_CONFIRM_ISOLATED=yes
PHASE_D_SUPABASE_URL=
PHASE_D_SUPABASE_ANON_KEY=
PHASE_D_SUPABASE_SERVICE_ROLE_KEY=
PHASE_D_PROJECT_REF=
PHASE_D_USER_A_EMAIL=
PHASE_D_USER_A_PASSWORD=
PHASE_D_USER_B_EMAIL=
PHASE_D_USER_B_PASSWORD=
PHASE_D_MODERATOR_EMAIL=
PHASE_D_MODERATOR_PASSWORD=
PHASE_D_ADMIN_EMAIL=
PHASE_D_ADMIN_PASSWORD=
PHASE_D_ALLOW_WRITES=false
```

`npm run verify:integration` requires the explicit confirmation flag and a 20-character project ref that matches the URL hostname. It refuses to run when `PHASE_D_SUPABASE_URL` equals `NEXT_PUBLIC_SUPABASE_URL`, and it never writes, creates users, or applies SQL. The write matrix remains a manual runbook step.

## 14. Remaining security risks

Priority order:

1. **Core social RLS is not in version control and could not be inspected.** Cross-user isolation is unproven. This blocks any production-readiness claim.
2. **The profile privilege-escalation guard is only a proposal.** If production lacks the trigger and column revokes, a user may be able to alter `profiles.role` or `profiles.status` through direct PostgREST calls. Verify immediately with a read-only dump; do not assume the application-level field filtering is sufficient.
3. **No adversarial multi-account test evidence.** IDOR, notification leakage, report leakage, and billing-row leakage remain theoretical.
4. **In-process rate limiting when Upstash is absent.** Limits are per instance and reset on deploy; a multi-instance deployment needs shared Redis.
5. **Refund/dispute ledger gaps.** Partial refunds are not represented; disputes require manual reconciliation; the legacy `invoice` link on `Charge` needs API-version verification.
6. **CSP is report-only and permits inline/eval scripts.** This is pre-existing and outside Phase D, but it is not a hardened production posture.
7. **Placeholder-tolerant startup.** The app still boots with fake Supabase values; `verify:connectivity` mitigates but does not prevent a bad deployment.
8. **Report target coverage.** Users can report `PROFILE`, but the moderation action table handles only `POST`, `COMMENT`, `DISCUSSION`, and `REPLY`. A profile report can be resolved/dismissed but not actioned as content.
9. **Active-only reporting/feedback.** Pending-verification users cannot report abuse or send feedback; confirm this is the intended product policy.
10. **Webhook concurrency.** Two simultaneous deliveries of the same event can both pass the `received` check before either marks it `processed`. Current handlers are mostly idempotent through unique constraints, but this deserves a concurrency test.

## 15. Production readiness assessment

| Area | Assessment |
| --- | --- |
| Build and static quality | READY for local/preview |
| API layering and response contracts | READY at code level |
| Permanent light theme and responsive shell | READY (prior audit) |
| Unauthenticated boundaries | VERIFIED |
| Supabase connectivity | BLOCKED |
| Repository behavior | NOT VERIFIED |
| RLS and multi-account authorization | NOT VERIFIED; critical schema gap |
| Stripe test mode and Connect | NOT VERIFIED; local webhook logic only |
| End-to-end journeys | BLOCKED |
| Operational preflight | TOOLING READY (`verify:connectivity`) |

**Verdict: not production-ready.** The application is ready to be pointed at an isolated environment and tested, but the Phase D success condition cannot be signed off until the real database, RLS policies, four test accounts, and Stripe test-mode resources are available and the matrix above is executed.

## 17. Phase 4 update — 2026-11-27

Baseline for this update: `6aeca21`.

### What changed

- Comment edit and delete were added end-to-end in Phase 3: owner-scoped repository updates, service validation, `PATCH/DELETE /api/v1/comments/[id]`, legacy re-export, and owner-only Edit/Delete controls in the article discussion UI.
- The feature matrix was expanded into `docs/phase-4-completion-matrix.md` with explicit statuses: verified, implemented but not integration-verified, partial, not implemented, and blocked.
- Phase 4 re-ran the full local verification suite and the unauthenticated smoke suite.

### Phase 4 verification results

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — 0 errors, 17 warnings (existing `img`/prototype warnings) |
| `npm test` | PASS — 21 files, 130 tests |
| `npm run build` | PASS |
| `scripts/smoke-test.mjs` | PASS — 20/20 |
| `npm run verify:connectivity` | BLOCKED — Supabase/KV placeholders only |
| `npm run verify:integration` | BLOCKED — isolated `PHASE_D_*` resources absent |

### What remains blocked

The same infrastructure gaps remain: no reachable Supabase project, no four-account matrix, no version-controlled core social schema/RLS, no Stripe test credentials, and no isolated payment resources. No live repository, RLS, Stripe, or end-to-end claim is made.

### Security notes from the Phase 3/4 delta

- Comment update/delete are owner-scoped in both the query and the service. Cross-user modification relies on RLS in addition to the `author_id` filter.
- `comments.is_removed` is used for soft deletion. This column is assumed to exist in the production schema; it is not created by a tracked migration, so it must be confirmed in the isolated schema dump.
- The new routes follow the existing boundary invariant: v1 uses `toResponse`, legacy re-exports the v1 handler.
- No new secrets, production data, or destructive operations were introduced.

### Exact next steps

1. Provision the isolated Supabase project and apply the reviewed production-equivalent schema/RLS.
2. Create USER_A, USER_B, MODERATOR, and ADMIN; populate the fixtures listed in §13.2.
3. Export `PHASE_D_*` variables and run `npm run verify:integration`.
4. Execute the HTTP/RLS matrix in §6.3 and the user/admin/payment journeys.
5. Configure Stripe test mode and the CLI; replay the events in §9.
6. Update this report with actual status codes and row counts. Do not mark any feature verified until that evidence exists.

## 18. Sign-off

Phase D completed the diagnosis, the static security/contract audit, targeted hardening, and all verification possible without external infrastructure. It did **not** verify real Supabase repositories, RLS, authenticated authorization, Stripe test mode, or end-to-end journeys, and this report does not claim otherwise.

No commit, deployment, migration, production data change, or destructive git operation was performed. All changes remain uncommitted on `main`.
