# Phase 8 — RLS, notifications, realtime, admin and moderation verification

Date: 2026-11-27
Baseline: Phase 5 commit `580f48d`, with uncommitted Phase 6, Phase 7 and Phase 8 work in the working tree
Status: **VERIFIED against a disposable local Supabase stack. Stripe and Upstash KV remain BLOCKED. Production-equivalence of the reconstructed schema is NOT VERIFIED.**

## 1. Executive verdict

`npm run verify:phase8` completed with **49 PASS, 0 FAIL, 2 BLOCKED**. Every PASS is a real request against an isolated local Supabase stack or the application server attached to it: GoTrue sign-in, PostgREST row-level-security probes, a Realtime websocket subscription, and application API calls with real session cookies. No mock provider, fake token, or canned response was used.

The two BLOCKED checks are Stripe and Upstash KV. Neither had isolated test credentials in this environment, so no provider request was made and no success was claimed.

The core social schema and RLS were previously unversioned. A version-controlled baseline migration was reconstructed from application usage and the existing unapplied proposals, then applied successfully to the isolated stack. This proves the reconstructed schema behaves as intended **on that stack**; it does **not** prove the production database matches it. A read-only production catalog dump and applied-migration ledger are still required before that claim can be made.

No credentials, keys, or test-user passwords were written to the repository. Nothing was committed.

## 2. Isolated target

| Item | Value / evidence |
| --- | --- |
| Stack | Supabase CLI local stack on Docker Desktop, project `phase8-staging` |
| Location | Temporary directory outside the git repository |
| API / DB | `http://127.0.0.1:54321` / Postgres `127.0.0.1:54322` (loopback only, disposable) |
| App under test | `npx next dev --webpack -p 3001` with isolated env injected only into that process |
| Accounts | Four confirmed fixtures: USER_A, USER_B, MODERATOR, ADMIN (all `@phase8.test`) |
| Schema | Version-controlled baseline plus all existing repository migrations, applied by `supabase db reset` |
| Realtime | `supabase_realtime` publication includes `public.notifications`; replica identity set to `FULL` |
| Cleanup | Harness deletes its own fixtures and restores mutated account metadata |

The reproduction runbook is in `docs/phase8-isolated-staging.md`.

## 3. Implementation changes

### Database / RLS

| File | Change |
| --- | --- |
| `supabase/migrations/20261001000000_phase8_core_social_baseline.sql` | Version-controlled reconstruction of profiles, posts, topics, comments, likes/saves/follows, notifications, reports, audit logs, discussions/replies and proposed social extensions; RLS policies, grants, indexes, storage path policies, privilege guard, members-only post policy, realtime publication |
| `supabase/migrations/20261004130000_phase8_product_events_own.sql` | Adds the missing owner SELECT policy for `product_events` |

During verification the baseline guard initially used `current_user` inside a `SECURITY DEFINER` function, which is always the function owner and therefore bypassed the check. It now uses `session_user`, so direct Postgres maintenance remains allowed while PostgREST sessions cannot self-promote. The notification dedup index also had to use plain columns so Supabase's `onConflict` target is accepted.

### Notifications

- Paginated `GET /api/v1/notifications` with `notifications`, `page`, `limit`, `total`, `hasNextPage`, `unreadCount`, and `cache-control: private, no-store`.
- `PATCH` for one/all notifications, `DELETE /api/v1/notifications` for clear-all, `DELETE /api/v1/notifications/[id]` for per-item deletion (legacy re-export retained).
- Client-side creation remains rejected with 403; types are derived from the trusted producer allowlist.
- Session-gated center and dropdown, `SessionExpiredError` parity, load-more, realtime `*` subscription, labels for all trusted types.
- Moderation notices use the same upsert conflict target, avoiding duplicate-key failures on repeat REMOVE/RESTORE.

### Admin / moderation

- Privileged access requires an **ACTIVE** role, not just a role claim; suspended or deactivated moderators/admins now receive 403.
- Report IDs are UUID-validated; already-closed reports cannot be resolved or removed again; RESTORE is limited to RESOLVED reports.
- Failed audit writes are surfaced as HTTP 500 instead of reporting a privileged action as fully successful; a change carrying both role and status writes both audit entries.
- Auth-provider metadata returned by the admin list is validated against the known role/status enums.
- Removed unused duplicate `canModerate` helper from `lib/interactions.ts`.

## 4. What was actually verified

| Check | Result | Evidence |
| --- | --- | --- |
| Supabase connectivity | PASS | GoTrue health HTTP 200 |
| Four isolated identities | PASS | Real sign-in returned expected role and ACTIVE status |
| Recipient notification SELECT | PASS | Owner client read exactly one row |
| Non-recipient / anonymous notification SELECT | PASS | Both saw zero rows |
| Forged notification UPDATE/DELETE | PASS | Rows remained unchanged for the non-recipient |
| Self-service role escalation | PASS | PostgREST update rejected; profile role remained `USER` |
| Members-only post visibility | PASS | Hidden without membership, visible with active membership, invisible to anon |
| Product event owner read | PASS | Owner saw the row, other user did not |
| Notification API auth/pagination/headers | PASS | 401 unauthenticated; exact `total`/`unread`/`hasNextPage`; private no-store headers |
| Mark one / mark all / per-item delete / clear-all | PASS | Unread counts and row presence verified after each call |
| Cross-recipient delete via API | PASS | HTTP 200 but the other user's row remained |
| Client notification POST | PASS | HTTP 403 |
| Realtime INSERT delivery | PASS | Websocket subscription received the exact inserted notification id |
| User denied admin/moderation APIs | PASS | HTTP 403 |
| Report submit / list own | PASS | HTTP 201 and report ids returned |
| Moderator list/detail/invalid-id | PASS | 200 / 200 / 422 |
| Resolve, remove, restore | PASS | Status transitions and content status verified in the DB |
| Repeat closed/removed actions | PASS | HTTP 409 |
| Moderation audit + notice | PASS | Audit row and reporter notification present |
| Moderator denied admin API | PASS | HTTP 403 |
| Admin list users/audit logs | PASS | HTTP 200 |
| Admin self-role change | PASS | HTTP 422 |
| Promoted ACTIVE moderator access | PASS | HTTP 200 |
| Suspended moderator claim | PASS | HTTP 403 after status change |
| Admin audit entries | PASS | `ROLE_CHANGED`, `USER_SUSPENDED`, `USER_RESTORED` all present |
| Fixture cleanup | PASS | Created rows deleted and mutated metadata restored |

The full machine-readable result is retained outside the repository at `phase8-verification-final.log` in the temporary opencode directory.

### Automated harness

`npm run verify:phase8` is guarded by:

- `PHASE8_CONFIRM_ISOLATED=yes`
- `PHASE8_ALLOW_WRITES=true`
- loopback-only Supabase and app URLs
- real, non-placeholder URL, keys, and four sets of account credentials

Without those values it exits 1 with `verdict: blocked`. It never reads `.env.local`, masks/redacts output, and reports missing Stripe/KV credentials as BLOCKED without contacting those providers.

## 5. Regression results

| Command | Result | Detail |
| --- | --- | --- |
| `npm run typecheck` | PASS | No TypeScript errors |
| `npm run lint` | PASS | 0 errors, 16 pre-existing warnings |
| `npm test` | PASS | 27 files, 169 tests (142 Phase 7 baseline + 27 new) |
| `npm run build` | PASS | Production build completed; non-fatal SWC/WASM and package-lock warnings |
| `npm run verify:phase8` | PASS with blocked providers | 49 PASS, 0 FAIL, 2 BLOCKED |
| `git diff --check` | PASS | No whitespace errors |

Two transient HTTP 500/404 responses during an earlier run were traced to stale Next.js dev chunks after editing source files while the dev server was running, not to authorization defects. The dev server was restarted and the final run had zero FAILs.

## 6. Still BLOCKED or NOT VERIFIED

| Area | Status | Reason |
| --- | --- | --- |
| Stripe checkout/portal/Connect/webhooks | BLOCKED | No test-mode keys, webhook secret, price ID, Connect account or Stripe CLI; no real charge executed |
| Upstash KV shared rate limiting | BLOCKED | No isolated REST URL/token; only the in-process fallback exists |
| Hosted isolated Supabase project | NOT USED | No hosted credentials supplied; only a disposable local stack was available |
| Production schema equivalence | NOT VERIFIED | Baseline is reconstructed from app usage and proposals; no production catalog dump or applied-migration ledger |
| `.env.local` / `.env.example` | BLOCKED | Still placeholder/blank; no real configuration added |
| Generated QA screenshots | UNTRACKED | Three Phase 6 JPEGs remain intentionally uncommitted |
| Commit | NOT DONE | All Phase 6/7/8 changes remain in the working tree |

## 7. Security and closeout

- No authorization guard was weakened. The changes tighten privileged access, reject invalid identifiers, and make failed audit writes visible.
- The harness requires explicit isolation and write consent, refuses non-loopback targets, and performs cleanup.
- No secret, JWT, service-role key, webhook secret, or test password was added to a tracked file.
- No commit was made.
