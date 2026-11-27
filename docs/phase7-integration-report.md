# Phase 7 — Real authentication verification and reliability closeout

Date: 2026-11-27
Baseline: Phase 6 working tree (`580f48d` plus uncommitted blue-theme/animated-login work)
Status: **AUTH COMPLETE AND VERIFIED AGAINST AN ISOLATED SUPABASE STACK. External billing/KV/realtime work remains BLOCKED.**

## 1. Executive verdict

Real Supabase authentication was executed and passed against a disposable, isolated local stack. This is not a mock or a documentation-only claim: GoTrue returned real tokens, RLS rejected a cross-user write, the application redirected and persisted a real browser session, and the password-recovery/reset flow completed end to end through the UI with a real one-time link from the isolated Mailpit inbox.

The two `/api/v1/notifications` 401s were traced to an unconditional client fetch on a public route, not to an authorization defect. The server authorization path was left unchanged.

No credentials, keys, or test-user passwords were written to the repository. Nothing was committed.

## 2. Isolated target

| Item | Value / evidence |
| --- | --- |
| Stack | Supabase CLI v3.4.0 local stack on Docker Desktop |
| API | `http://127.0.0.1:54321` (loopback only, disposable) |
| Project directory | Temporary directory outside the repository |
| Database | Local Postgres `127.0.0.1:54322`, restored from the stack backup after a config restart |
| App under test | `npx next dev --webpack -p 3001` with isolated env injected only into that process |
| Accounts | Two confirmed fixture users via the admin API plus one browser-E2E signup user |
| Schema | Repository migrations applied after minimal staging-only base tables were created, because the core social schema/RLS is still not version-controlled (same finding as Phase 4/5) |
| Redirect allowlist | Isolated `config.jsonc` updated to allow `http://localhost:3001/**`; repository config untouched |

Configuration and reproduction steps are in `docs/phase7-isolated-staging.md`.

## 3. Task-by-task outcome

| Task | Outcome | Evidence |
| --- | --- | --- |
| Inspect env vars and identify placeholders | COMPLETE | `.env.local` still points at an unresolvable placeholder project; `.env.example` remains blank/non-working. No placeholder was treated as configured. |
| Prepare isolated staging config | COMPLETE | Local CLI stack + temp-only env file (mode 0600) outside git; see §2. |
| Verify connectivity | PASS | GoTrue `/auth/v1/health` returned HTTP 200. |
| Successful login | PASS | Real `signInWithPassword` issued an access token; browser login POST `/auth/v1/token?grant_type=password` returned 200. |
| Invalid credentials | PASS | Provider rejected a wrong password; app shows `Invalid email or password.` without leaking provider text. |
| Session persistence | PASS | Session cookie survived reload; sidebar showed `Signed in`; protected `/feed?tab=latest` stayed accessible. |
| Logout | PASS | Account menu `Log out` called `/auth/v1/logout` (204) and redirected to `/login`; a later `/feed` request redirected back to login. |
| Password recovery | PASS | UI `Forgot password?` returned `Check your inbox for a password reset link.`; `/auth/v1/recover` returned 200; real email arrived in isolated Mailpit. |
| Password reset | PASS | Recovery link opened `/reset-password?code=…`; `Update password` redirected to `/dashboard`; the old password was then rejected (HTTP 400) and the restored fixture password accepted (HTTP 200). Fixture returned to baseline. |
| Protected routes and redirect preservation | PASS | Unauthenticated `/feed?tab=latest` returned 307 to `/login?next=%2Ffeed%3Ftab%3Dlatest`; after login the browser landed on `/feed?tab=latest`. |
| Refresh and invalid/expired tokens | PASS | Refresh grant issued a new session; a forged token resolved no identity; logout revoked the refresh token. |
| Cross-user restrictions | PASS | Two distinct real user IDs; a user-B write of a row owned by user A was rejected by RLS. |
| Notification 401 investigation | FIXED | Cause was a client-side fetch on public `/explore`, not server auth. Fetch is now gated on a real Supabase session; server authorization unchanged. |
| Accessibility | VERIFIED (browser) | Labels bound to inputs, expected tab order, 2px blue focus rings, `role="alert"` validation, Lighthouse accessibility/best-practices/SEO all 1.0 with no failures. Reduced motion verified statically; browser tool could not emulate the media query or resize the viewport. |
| E2E registration | PASS | `/register` signup returned `/auth/v1/signup` 200 and redirected to `/onboarding`. |
| Notifications after auth | PASS | Notification dropdown showed the seeded fixture on `/feed` with no console errors and no 401s. |
| Full regression | PASS | `typecheck`, `lint`, `test`, `build` all pass; see §5. |

## 4. Automated real-auth run

`npm run verify:auth` was executed twice: first without `PHASE7_APP_URL` (13 provider checks), then with the staging app URL (15/15 checks). Final result:

```
PASS  Supabase connectivity — HTTP 200
PASS  Invalid credentials rejected
PASS  Successful login
PASS  Session token resolves identity
PASS  Refresh token grants new session
PASS  Invalid token rejected
PASS  Logout revokes refresh token
PASS  Password recovery request
PASS  Password reset updates credential
PASS  Login with reset password
PASS  Original password restored
PASS  Cross-user identities distinct
PASS  Cross-user row write denied by RLS
PASS  Unauthenticated notifications API denied — HTTP 401
PASS  Protected route redirect preserves next — HTTP 307
verdict: passed, checked: 15, failed: []
```

The harness (`scripts/phase7-auth-verification.mjs`) never reads `.env.local`, requires `PHASE7_CONFIRM_ISOLATED=yes`, refuses placeholders, masks all output, and requires an explicit `PHASE7_ALLOW_WRITES=true` for mutating checks.

## 5. Exact validation results

| Command | Result | Detail |
| --- | --- | --- |
| `npm run typecheck` | PASS | No TypeScript errors |
| `npm run lint` | PASS | 0 errors, 17 pre-existing warnings |
| `npm test` | PASS | 22 files, 142 tests (12 new auth/env/redirect tests over the Phase 6 baseline of 130) |
| `npm run build` | PASS | Production build completed; non-fatal SWC/WASM and package-lock warnings |

## 6. Reliability fixes made in this phase

| File | Change | Why |
| --- | --- | --- |
| `components/workspace/notification-dropdown.tsx` | Gate fetch on a real session via `getUser()` / `onAuthStateChange`; handle `SessionExpiredError`; signed-out dialog | Removed the two 401s on public pages without touching server authorization |
| `components/layout/app-shell.tsx` | Resolve real session state; clear stale profile; show `Not signed in` / `Checking session…` and `Log in` when signed out | Removed hardcoded `Signed in` / `Log out` on public routes |
| `lib/env.ts` | Allow plain HTTP only for loopback Supabase URLs | A valid isolated stack was previously treated as unconfigured and failed closed at the proxy |
| `lib/env.test.ts` | Loopback-HTTP configuration test | Locks in the fix while keeping remote plain HTTP rejected |
| `lib/auth/validation.test.ts` | Login/recovery/reset validation and redirect-hardening tests | Covers the pure rules used by the real adapter |

## 7. Still BLOCKED — not claimed as verified

| Area | Status | Reason |
| --- | --- | --- |
| Hosted isolated Supabase project | NOT USED | No hosted credentials were supplied; verification was performed on a disposable local stack with staging-only base tables |
| Stripe test mode, webhooks, Connect | BLOCKED | No test keys or CLI |
| Shared KV rate limiting | BLOCKED | No test namespace |
| Realtime notification delivery | BLOCKED | Not exercised against a configured publication |
| MODERATOR / ADMIN role flows | BLOCKED | Only USER accounts were created in the isolated stack |
| Reduced-motion emulation and device-resize accessibility | PARTIAL | Statically verified in CSS; browser tooling could not emulate the media query or viewport |
| Generated artifacts / screenshots | UNTRACKED | Three Phase 6 QA JPEGs remain untracked; intentionally not committed |

## 8. Security and closeout

- No secret or credential was added to any tracked or untracked file in the repository; isolated keys and passwords live only in a mode-0600 temp file outside git.
- `git diff --check` passes; a diff/untracked scan found no JWTs, service-role keys, webhook secrets, or real test credentials.
- No guard was weakened to force a pass: verify scripts still require explicit isolated confirmation and real non-placeholder values.
- No commit was made. All Phase 6 and Phase 7 changes remain in the working tree.
