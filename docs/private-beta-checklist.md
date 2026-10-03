# Commun.dev private beta checklist

## Release gate

- Branch: `v0/private-beta-launch-validation`
- Target: 20–50 invited developers
- Staging must use a separate Supabase project. If unavailable, do not run destructive tests against the current project; use a clearly labeled staging deployment, separate test accounts, and a written rollback window.
- Never commit `.env*`, credentials, access tokens, cookies, or service-role values.

## Environment

| Environment | Runtime | Data policy |
|---|---|---|
| Local | `.env.development.local` | disposable developer data only |
| Staging | Vercel Preview/Staging | isolated Supabase project preferred; seeded test accounts only |
| Production | Vercel Production | invite-only beta; no destructive QA |

Required runtime configuration: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or anon fallback), `SUPABASE_SERVICE_ROLE_KEY` server-only, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `NEXT_PUBLIC_SITE_URL`. Confirm Supabase Site URL, trusted origins, email verification, password reset redirects, HTTPS, and Vercel environment scope in the dashboard.

## Database and security

- Apply migrations in order, including `20261004120000_private_beta_observability.sql`.
- Verify every exposed public table has RLS enabled, policies have ownership checks, and the report lookup index exists.
- Run Supabase security/performance advisors after migration.
- Verify service-role imports remain server-only.
- Run USER_A/USER_B IDOR checks for posts, comments, discussions, replies, saves, follows, notifications, reports, moderation, and admin routes.
- Verify report rate limiting: 5 reports per authenticated user/IP window returns `429` with `Retry-After`.
- Keep CSP report-only until staging violations are classified; enforce only after required origins are documented.

## Account matrix

Create separate, verified staging accounts: `USER_A` (active), `USER_B` (active), `MODERATOR` (active moderator), `ADMIN` (active admin). Store credentials only in the password manager. Test suspended and unverified states separately.

## Workflow evidence

- USER_A: registration → verification → onboarding → feed/discover → profile → follow → read → like/save → comment → discussion/reply → notification → report → logout/login.
- MODERATOR: queue → report detail → inspect → remove/resolve → audit event → affected content as USER_A.
- ADMIN: users → search → permitted role/status action → audit log; repeat admin route checks as USER_A and MODERATOR.
- Run each flow on deployed staging, not only localhost. Record route, timestamp, account role, expected result, actual result, and issue link.

## Observability and analytics

Structured server logs include event, level, timestamp, and safe error code only. Never log passwords, tokens, cookies, service keys, or raw private content. Product events are allowlisted and privacy-conscious: signup, onboarding, view, publish, like, save, comment, discussion, reply, follow, notification, and report. Review activation: landing → signup → onboarding → discover → read → follow → create → discuss → return.

## Accessibility, performance, and mobile

Run automated accessibility checks on `/`, `/feed`, `/explore`, `/community`, article, `/discussions`, `/profile`, `/saved`, `/notifications`, `/settings`, `/moderation`, and `/admin/users`. Verify keyboard focus, headings, forms, dialogs, menus, contrast, and 390×844 layouts. Use realistic staging data to check pagination, N+1 behavior, loading states, large articles, and mobile scrolling. Do not load-test production.

## SEO and deployment smoke

Verify `robots.txt`, `sitemap.xml`, canonical URLs, Open Graph/Twitter metadata, and that private/admin routes are not indexed. On the deployed staging URL, smoke test `/`, `/login`, `/register`, `/feed`, `/explore`, `/community`, `/discussions`, `/saved`, `/notifications`, `/settings`, `/moderation`, and `/admin/users`, including protected redirects.

## Rollback and backups

Confirm Supabase backups/PITR and a named rollback owner before inviting beta users. Roll back the Vercel deployment to the previous known-good build; revert application migrations only with a reviewed, forward-safe migration. Do not reset production databases.

## Known issues

- Existing lint warnings: editor hook dependency, image optimization, and config/deprecation warnings; non-blocking pending review.
- `middleware.ts` uses the deprecated Next.js convention; migrate to `proxy.ts` before a future Next.js upgrade.
- Legacy static HTML/JS contains `innerHTML`; review before exposing those pages to untrusted content.
- Full multi-account, deployed staging, accessibility, performance, and rate-limit threshold evidence must be collected before a READY decision.

## Beta success metrics

Primary: signup-to-onboarding completion. Engagement: article reads, follows, comments, discussions, replies. Contribution: articles and discussions created. Retention: returning users and repeat contributors. Review weekly; do not optimize raw page views alone.

## Final decision template

| Area | Status | Evidence | Blocker |
|---|---|---|---|
| Build | PASS | Tests, typecheck, lint, production build, and diff check passed locally | None for local validation |
| Deployment | BLOCKED | No staging URL or isolated deployment present; `VERCEL_URL` unavailable | Create isolated Vercel preview/staging |
| Authentication | PARTIAL | Protected routes redirect and feedback endpoint returns 401 unauthenticated | Real verified account matrix unavailable |
| Authorization/RLS | PARTIAL | Live public-table RLS coverage was previously verified; server role guards present | USER_A/USER_B adversarial tests unavailable |
| Moderation/Admin | NOT VERIFIED | Protected route surfaces exist | Moderator/admin accounts and deployed workflow unavailable |
| Rate limiting | PARTIAL | Feedback endpoint is authenticated and returns `Retry-After` on limit path; no session available to exercise threshold | Authenticated 5/min normal/429/recovery test |
| CSP/XSS | PARTIAL | Security headers present; CSP remains report-only; legacy `innerHTML` review outstanding | Staging violation review and legacy page audit |
| Database | PARTIAL | Supabase public-table RLS coverage previously verified; beta migration is present in repo | Migration/application/index evidence on isolated staging |
| Accessibility/Performance | PARTIAL | Accessibility snapshots completed for public/auth routes; no automated axe or staging performance run | Full route axe scan and realistic data/performance test |
| SEO | PASS | `/robots.txt` and `/sitemap.xml` returned 200; public metadata rendered | Deployed staging verification |
| Analytics/Observability | PARTIAL | Structured logger, allowlisted analytics endpoint, and safe error boundary present | Production sink and event delivery review |
| Mobile/Empty state | PARTIAL | Responsive shell, route empty states, and mobile screenshots verified | Full 390/375/768 route matrix remains |
| Publishing | PARTIAL | Existing editor and article flows build; rendering preserved | Authenticated staging publish flow |
| Social interactions | PARTIAL | API routes and RLS exist | USER_A/USER_B live matrix |
| Discussions | PARTIAL | Routes and reply constraints exist | End-to-end staging workflow |
| Notifications | PARTIAL | Notification route/component exist | Live mark-read and delivery test |
| Observability | PARTIAL | Structured safe logger and error boundary exist | Production log sink/alerting |
| Feedback | PARTIAL | Authenticated validated form, separate table, admin RLS, and 5/min limiter | Apply migration and review as admin |
| Staging deployment | BLOCKED | No separate staging URL/project available in this context | Deploy isolated Vercel/Supabase/KV environment |

A `PASS` requires recorded evidence from isolated staging; localhost build success is not sufficient.

## Remaining beta blockers

- No isolated staging deployment, separate Supabase project, or deployed staging URL is available in the current environment.
- No real verified USER_A, USER_B, MODERATOR, or ADMIN accounts are available for cross-account IDOR, RLS, moderation, admin, logout, and realtime tests.
- Feedback rate-limit threshold and recovery cannot be exercised without an authenticated session; only the unauthenticated 401 boundary was verified.
- Automated accessibility scanning, realistic staging-data performance checks, CSP violation review, and production analytics/log sink review remain outstanding.
- The beta observability migration must be applied and verified on the intended isolated staging project before inviting users.
