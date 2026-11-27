# Phase 11H/I — Public Testing & Security Checks

Date: 2026-11-27

## 1. Local security posture (verified)

- Public headers are configured in `next.config.mjs`: `nosniff`,
  `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`,
  `X-Frame-Options`, and a report-only Content-Security-Policy. The build
  contains zero `package-lock` workspace warnings after setting
  `outputFileTracingRoot` to the project root.
- Browser/server Supabase clients fail fast on missing or placeholder config;
  no fake host or mock auth is used.
- Service-role access is server-only: `createAdminClient()` returns `null`
  when unconfigured, and privileged call sites handle that explicitly.
- RLS isolation was verified locally with two real authenticated users:
  - Alice's private draft is invisible to Bob (0 cross-user rows).
  - Bob's cross-user update affected 0 rows.
  - Notifications are visible only to their recipient.
- Local CRUD writes persist and deletes remove rows, verified with real
  PostgREST calls (`npm run verify:local`: 7 PASS / 0 FAIL).
- The local CLI state is unlinked from any hosted project, so local commands
  cannot target a hosted project by accident.

## 2. Public staging checks (BLOCKED)

The following cannot be claimed without a dedicated public staging deployment
and verified credentials:

| Check | Status |
| --- | --- |
| HTTPS + HSTS on public staging host | BLOCKED |
| Header assertions against the deployed origin | BLOCKED |
| Signup → email confirmation → login → recovery lifecycle over real email | BLOCKED |
| Persistent CRUD after reload/new browser session | BLOCKED |
| Two-user RLS isolation on hosted staging | BLOCKED |
| Cross-user direct REST access attempts (deny) | BLOCKED |
| Stripe test-mode webhook signature verification | BLOCKED |
| Upstash KV rate-limit isolation | BLOCKED |

No hosted URL was probed and no hosted account was created. Local results must
not be presented as public staging verification.

## 3. Phase 11M public abuse/rate-limit posture

| Check | Current status | Safe alternative / blocker |
| --- | --- | --- |
| Signup abuse protection | **BLOCKED** on hosted staging | Configure Supabase Auth captcha (Turnstile/hCaptcha) and rate limits on the staging dashboard; verify with repeated signup attempts |
| Rate limiting | **BLOCKED** (no isolated Upstash instance) | Application degrades gracefully when KV is unconfigured; use Supabase Auth rate limits plus Vercel-level rate limiting until isolated Upstash credentials exist |
| Server-side authorization | **PASS locally / BLOCKED hosted** | `lib/auth.ts` + RLS are exercised locally; hosted harness prepared (`npm run verify:staging`) but not executed |
| Safe error responses | **PASS locally / BLOCKED hosted** | Strict env getters throw actionable errors without leaking keys; hosted error-body review pending |
| No service-role exposure | **PASS** | Service-role key is server-only; identity gate rejects keys equal to the anon key or with local CLI issuer |
| No production references in staging config | **PASS locally** | Identity gate blocks the previously linked production ref and production hosts; no hosted ref is configured yet |
| Safe health endpoints | **BLOCKED hosted** | No public staging origin exists to probe |

The hosted verification harness reports email verification, password recovery,
browser logout, and protected-route access as **BLOCKED** even after credentials
are supplied; those require observed real-email and browser flows.
