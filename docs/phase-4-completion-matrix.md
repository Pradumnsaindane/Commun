# Phase 4 — Integration and production readiness matrix

Date: 2026-11-27
Branch: `main`
Baseline: `6aeca21` (Phase 3)
Verification mode (Phase 4 original): local code, tests, build, and unauthenticated smoke. No live Supabase/Stripe/E2E verification was possible at that time; see the Phase 5/7/8 update notes below for later evidence.

> **Phase 5 update:** staging tooling and runbooks were added after this matrix. The statuses below remain accurate; no row has been promoted to `VERIFIED` without real infrastructure. See `docs/phase-5-infrastructure-readiness.md` and `docs/phase-5-integration-report.md`.

> **Phase 7 update:** real authentication was verified against a disposable local Supabase stack, including browser E2E. Rows for authentication, sessions, redirect handling, and cross-user RLS were promoted only where real evidence exists. Stripe, KV, realtime, and role-gated admin flows remain blocked. See `docs/phase7-integration-report.md` and `docs/phase7-isolated-staging.md`.

> **Phase 8 update:** RLS, notifications, Realtime, admin and moderation were verified against a disposable local Supabase stack with a version-controlled reconstructed core schema (`npm run verify:phase8`: 49 PASS, 0 FAIL, 2 BLOCKED). Stripe and KV remain BLOCKED; production schema equivalence is NOT VERIFIED. See `docs/phase8-integration-report.md`, `docs/phase8-isolated-staging.md` and `docs/phase8-security-report.md`.

> **Phase 10 update:** frontend architecture standardization was applied incrementally without changing the App Router, backend services, or verified Phase 7/8 behavior. All rows below remain at the same integration status; only the local quality gates were strengthened. See `docs/phase10-frontend-architecture-audit.md` and `docs/phase10-completion-report.md`. No new provider or hosted-infrastructure verification was performed.

## Status legend

- **VERIFIED** — executed successfully against real infrastructure in this environment.
- **IMPLEMENTED, NOT INTEGRATION-VERIFIED** — code paths, validation, auth, and local tests exist; real DB/provider behavior is unproven.
- **PARTIAL** — some operations or states are missing.
- **NOT IMPLEMENTED** — no real implementation.
- **BLOCKED** — cannot be verified without external configuration.

## Feature matrix

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Build, typecheck, lint, unit tests | VERIFIED | `typecheck`, `lint` 0 errors / 16 pre-existing warnings, 28 files / 176 tests, production build (Phase 10 quality gates) |
| Unauthenticated route and API boundaries | VERIFIED | 20/20 smoke checks; protected routes redirect, APIs return 401; real isolated run re-confirmed 401 + 307 |
| Authentication (Supabase Auth) | VERIFIED | Real login, invalid credentials, recovery, reset, registration, logout, and redirect preservation against isolated Supabase (Phase 7) |
| Sessions / expired sessions | VERIFIED | Real token identity resolution, refresh grant, forged-token rejection, browser persistence across reload, logout revocation |
| Profiles read/update/finalize | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Server-authorized; no live DB |
| Profile picture upload | PARTIAL | Depends on an unverified storage bucket/policy |
| Account deletion / deactivation | PARTIAL | Admin status changes exist; user self-deletion is not exposed |
| Posts create/read/update/delete | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Owner-scoped service + repo; no live DB |
| Publish / unpublish / drafts | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Status transitions in service |
| Comments create/list | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Real insert/list; no live DB |
| Comment edit/delete | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Owner-scoped repository + API + UI added in Phase 3 |
| Like / unlike / save / unsave | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Real rows + counters; no live DB |
| Follow / unfollow | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Duplicate/self checks; notification on follow |
| Notifications list/read/clear | VERIFIED | Paginated list, exact unread count, private no-store headers, mark one/all, per-item delete and clear-all verified on isolated stack |
| Realtime notifications | VERIFIED (isolated) | Real websocket INSERT delivery; publication/replica identity added to version-controlled baseline. Production publication NOT VERIFIED |
| Search / discovery | IMPLEMENTED, NOT INTEGRATION-VERIFIED | DB-backed search; no live dataset |
| Reports submit/list own | VERIFIED | Real report creation and own-report listing via application API |
| Moderation queue/actions | VERIFIED | MODERATOR account: list/detail, UUID validation, resolve/remove/restore, closed-report 409, audit and notice |
| Admin users/audit logs | VERIFIED | ADMIN account: user/audit listing, self-change 422, role/status changes with audit entries |
| RLS and cross-user isolation | VERIFIED (reconstructed schema) | Private notification rows, privilege escalation, members-only posts and product-event ownership verified on isolated stack; production equivalence NOT VERIFIED |
| Profile privilege-escalation guard | VERIFIED | Version-controlled trigger with `session_user` check; PostgREST self-promotion rejected |
| Billing checkout/portal/Connect | BLOCKED | Implementation and config guards exist; isolated Stripe test credentials absent, so the harness reports BLOCKED without provider calls |
| Stripe webhook signature/idempotency/refunds | BLOCKED | In-memory handler tests pass; no Stripe test-mode delivery. Harness reports BLOCKED |
| Subscription lifecycle / failed payments | BLOCKED | Handlers exist; no Stripe test clock. Harness reports BLOCKED |
| Payout eligibility gating | BLOCKED | Unit-tested; no Connect test account. Harness reports BLOCKED |
| Discussions / replies | IMPLEMENTED, NOT INTEGRATION-VERIFIED | Real DB operations; no live DB |
| News read / ingest | PARTIAL | Read path returns live external data; ingestion requires `CRON_SECRET`/cron |
| Analytics / feedback | IMPLEMENTED, NOT INTEGRATION-VERIFIED | RLS-gated; no live DB |
| Saved reading list | IMPLEMENTED, NOT INTEGRATION-VERIFIED | DB-backed; no live session |
| Communities/projects/tasks/meetings/notes/learning/calendar | NOT IMPLEMENTED | Explicit in-development states; no invented schema |
| Rate limiting | PARTIAL (KV BLOCKED) | In-process fallback only; shared KV live verification BLOCKED without isolated Upstash credentials |
| Security headers / CSP | PARTIAL | Headers present; CSP is report-only |
| End-to-end user/admin/payment journeys | PARTIAL | Auth/registration/logout/recovery/reset and admin/moderation journeys verified on isolated Supabase; Stripe payment journeys BLOCKED |
| Frontend App Router structure | VERIFIED (local) | 44 pages, 60 routes, root + 4 route-scoped error/loading/not-found boundaries using Next 16 `retry` contract |
| Frontend type safety | VERIFIED (local) | Strict TS preserved; `any` removed at search/accordion boundary; ESLint `no-explicit-any` enforced on `app/`, `components/`, `features/`, `hooks/` |
| Shared notification client logic | VERIFIED (local) | `useNotificationSession` + `useNotificationRealtime` + shared label/href helpers; 3 helper tests; no change to API contract |
| News query input validation | VERIFIED (local) | Shared Zod schema and safe PostgREST filter; 3 new tests; no live news DB verification |
| API error-envelope parsing | VERIFIED (local) | Runtime Zod guard replaces an unchecked cast; malformed envelopes fall back safely; 1 new test |

## Phase 4 checks executed

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — 0 errors, 16 pre-existing warnings |
| `npm test` | PASS — 28 files, 176 tests (142 baseline + 27 Phase 5–8 + 7 Phase 10) |
| `npm run build` | PASS |
| `node scripts/smoke-test.mjs` | PASS — 20/20 |
| `npm run verify:connectivity` | BLOCKED — placeholders only |
| `npm run verify:integration` | BLOCKED — requires isolated `PHASE_D_*` resources |
| `npm run verify:auth` (isolated `PHASE7_*`) | PASS — 15/15 real Supabase checks |
| `npm run verify:phase8` (isolated `PHASE8_*`) | PASS — 49 PASS, 0 FAIL, 2 BLOCKED (Stripe, KV) |

## Required external resources

1. Isolated Supabase project with the production-equivalent schema and RLS applied.
2. Four confirmed accounts: USER_A, USER_B, MODERATOR, ADMIN.
3. Fixtures: draft post, notification, report, earning, audit log.
4. Stripe test secret, webhook secret, monthly price, Connect test account, and Stripe CLI.
5. A test KV/Upstash namespace for shared rate limiting.

Phase 7 supplied an isolated Supabase stack with two USER accounts and a notification fixture, enough to verify authentication and cross-user RLS. Phase 8 extended that to four accounts (USER_A, USER_B, MODERATOR, ADMIN) and a version-controlled **reconstructed** core schema, allowing RLS, notifications, Realtime, admin and moderation flows to be verified on the isolated stack. It did not supply a production-equivalent catalog dump or applied-migration ledger, Stripe test mode, or KV. Those rows remain BLOCKED or NOT VERIFIED, not production-ready.
