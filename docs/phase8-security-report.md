# Phase 8 — security report

Date: 2026-11-27
Scope: RLS/authorization, notifications, Realtime, admin/moderation, Stripe/KV exposure
Verification basis: `npm run verify:phase8` — 49 PASS, 0 FAIL, 2 BLOCKED against a disposable local Supabase stack

## Status legend

- **VERIFIED** — exercised against real infrastructure in this environment.
- **IMPLEMENTED, NOT INTEGRATION-VERIFIED** — code exists; no real provider/DB proof.
- **PARTIAL** — some cases missing.
- **NOT IMPLEMENTED** — no real implementation.
- **BLOCKED** — cannot be verified without external configuration.

## Findings and disposition

| # | Finding | Severity | Disposition | Status |
| --- | --- | --- | --- | --- |
| 1 | Core social schema/RLS was unversioned; policies existed only in unapplied proposal files | High | Added version-controlled baseline migration plus product-events owner policy; verified against isolated stack | VERIFIED (isolated schema only) |
| 2 | `SECURITY DEFINER` privilege trigger used `current_user`, which is the function owner, so PostgREST callers could self-assign `ADMIN` | Critical | Switched to `session_user` and JWT service-role claim; isolated harness now confirms role stays `USER` | VERIFIED |
| 3 | Privileged guards checked role but not account status | High | `canModerate`/`canAdminister` require `status = 'ACTIVE'`; harness confirms suspended moderator receives 403 | VERIFIED |
| 4 | Failed audit writes were logged and swallowed | High | `writeAudit` returns success/failure; privileged mutations return 500 when the audit entry cannot be written | VERIFIED (unit + isolated happy path) |
| 5 | A change with both role and status produced only one audit entry | Medium | Each security-relevant action now writes its own audit entry; empty changes rejected | VERIFIED |
| 6 | Moderation `REMOVE` could act on an already closed report, and `RESTORE` could act on non-RESOLVED reports | Medium | Terminal-state checks added; repeat actions return 409 | VERIFIED |
| 7 | Report detail/action accepted arbitrary strings as IDs | Medium | UUID validation added; invalid IDs return 422 | VERIFIED |
| 8 | Repeated RESTORE notifications failed with duplicate-key error | Low | Moderation notices use the same upsert conflict target as notification service | VERIFIED (no duplicate error in final run) |
| 9 | Notification list was unpaginated and returned no unread count | Medium | Paginated contract with exact unread count and private no-store headers | VERIFIED |
| 10 | Notification API allowed client-supplied creates | Medium | POST rejected with 403; types derived from trusted producer allowlist | VERIFIED |
| 11 | Realtime publication/replica identity was unversioned/unverified | Medium | Baseline adds notifications to `supabase_realtime` with `REPLICA IDENTITY FULL`; real websocket INSERT delivered | VERIFIED (isolated only) |
| 12 | `product_events` owner had no SELECT policy | Low | Owner SELECT policy added and verified cross-user denial | VERIFIED |
| 13 | Members-only post visibility was app-enforced only | Medium | RLS policy requires an active membership; verified with/without membership and as anon | VERIFIED (isolated only) |
| 14 | Auth provider metadata was trusted verbatim in admin user list | Low | Role/status validated against known enums before exposure | VERIFIED (unit) |
| 15 | Stripe test-mode/webhook/Connect flows | High | No test credentials supplied; no provider call made | BLOCKED |
| 16 | Shared KV rate limiting | Medium | No isolated KV namespace; in-process fallback only | BLOCKED |
| 17 | Production schema equivalence | High | No read-only production catalog dump or applied-migration ledger | NOT VERIFIED |

## Authorization boundaries confirmed by real requests

- Non-recipient and anonymous clients see no private notifications.
- Forged notification UPDATE/DELETE by a non-recipient changes no rows.
- A user cannot escalate their own profile role/status through PostgREST.
- A promoted moderator can reach moderation APIs only while ACTIVE.
- Normal users receive 403 from moderation and admin APIs; moderators receive 403 from admin APIs.
- Admin cannot change their own role.
- Unauthorized API access is enforced server-side; client gating was added only to avoid 401 noise on public routes.

## Secret handling

- The Phase 8 harness never reads `.env.local`; it requires explicitly exported, non-placeholder, loopback-only values.
- All keys, JWTs, passwords and emails are redacted from output.
- Temporary env/status files and verification logs live outside the repository.
- No secret was added to a tracked file; `git diff --check` passes.
- No real Stripe charge was attempted.

## Residual risk

The strongest remaining risk is schema drift: the baseline migration was reconstructed from code and proposals, not from a production dump. Until a production catalog comparison is performed, the RLS evidence applies only to the reconstructed isolated schema. Stripe and KV remain unproven; production configuration must be supplied and tested separately.
