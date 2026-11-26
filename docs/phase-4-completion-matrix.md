# Phase 4 — Integration and production readiness matrix

Date: 2026-11-27
Branch: `main`
Baseline: `6aeca21` (Phase 3)
Verification mode: local code, tests, build, and unauthenticated smoke. No live Supabase/Stripe/E2E verification was possible.

## Status legend

- **VERIFIED** — executed successfully against real infrastructure in this environment.
- **IMPLEMENTED, NOT INTEGRATION-VERIFIED** — code paths, validation, auth, and local tests exist; real DB/provider behavior is unproven.
- **PARTIAL** — some operations or states are missing.
- **NOT IMPLEMENTED** — no real implementation.
- **BLOCKED** — cannot be verified without external configuration.

## Feature matrix

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Build, typecheck, lint, unit tests | VERIFIED | `typecheck`, `lint` 0 errors, 21 files / 130 tests, production build |
| Unauthenticated route and API boundaries | VERIFIED | 20/20 smoke checks; protected routes redirect, APIs return 401 |
| Authentication (Supabase Auth) | BLOCKED | No reachable project or test accounts; code path exists |
| Sessions / expired sessions | BLOCKED | Cannot create or expire a real session |
| Profiles read/update/finalize | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Server-authorized; no live DB |
| Profile picture upload | PARTIAL | Depends on an unverified storage bucket/policy |
| Account deletion / deactivation | PARTIAL | Admin status changes exist; user self-deletion is not exposed |
| Posts create/read/update/delete | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Owner-scoped service + repo; no live DB |
| Publish / unpublish / drafts | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Status transitions in service |
| Comments create/list | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Real insert/list; no live DB |
| Comment edit/delete | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Owner-scoped repository + API + UI added in Phase 3 |
| Like / unlike / save / unsave | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Real rows + counters; no live DB |
| Follow / unfollow | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Duplicate/self checks; notification on follow |
| Notifications list/read/clear | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Real DB operations; realtime delivery unverified |
| Realtime notifications | BLOCKED | Requires configured Supabase Realtime publication |
| Search / discovery | IMPLEMENTED, NOT INTEGRATION-VERIFIED | DB-backed search; no live dataset |
| Reports submit/list own | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Target validation; no live DB |
| Moderation queue/actions | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Role-gated; no MODERATOR account |
| Admin users/audit logs | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Role-gated; no ADMIN account |
| RLS and cross-user isolation | BLOCKED | Core social schema/RLS is not version-controlled; no live project |
| Profile privilege-escalation guard | BLOCKED | Only in `proposed_phase_1b_social.sql`, marked NOT APPLIED |
| Billing checkout/portal/Connect | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Stripe config guards; no test key |
| Stripe webhook signature/idempotency/refunds | IMPLEMENTED, NOT INTEGRATION-VERIFIED | In-memory handler tests pass; no Stripe test-mode delivery |
| Subscription lifecycle / failed payments | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Handlers exist; no Stripe test clock |
| Payout eligibility gating | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Unit-tested; no Connect account |
| Discussions / replies | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Real DB operations; no live DB |
| News read / ingest | PARTIAL | Read path returns live external data; ingestion requires `CRON_SECRET`/cron |
| Analytics / feedback | IMPLEMENTED, NOT INTEGRATION-VERIFIED | RLS-gated; no live DB |
| Saved reading list | IMPLEMENTED, NOT INTEGRATION-VERIFIED | DB-backed; no live session |
| Communities/projects/tasks/meetings/notes/learning/calendar | NOT IMPLEMENTED | Explicit in-development states; no invented schema |
| Rate limiting | PARTIAL | In-process fallback without KV; per-instance only |
| Security headers / CSP | PARTIAL | Headers present; CSP is report-only |
| End-to-end user/admin/payment journeys | BLOCKED | No isolated Supabase, Stripe test mode, or test accounts |

## Phase 4 checks executed

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — 0 errors, 17 warnings (existing `img`/prototype warnings) |
| `npm test` | PASS — 21 files, 130 tests |
| `npm run build` | PASS |
| `node scripts/smoke-test.mjs` | PASS — 20/20 |
| `npm run verify:connectivity` | BLOCKED — placeholders only |
| `npm run verify:integration` | BLOCKED — requires isolated `PHASE_D_*` resources |

## Required external resources

1. Isolated Supabase project with the production-equivalent schema and RLS applied.
2. Four confirmed accounts: USER_A, USER_B, MODERATOR, ADMIN.
3. Fixtures: draft post, notification, report, earning, audit log.
4. Stripe test secret, webhook secret, monthly price, Connect test account, and Stripe CLI.
5. A test KV/Upstash namespace for shared rate limiting.

Until these exist, the correct status is **implemented but not integration-verified**, not production-ready.
