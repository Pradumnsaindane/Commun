# Commun.dev private beta checklist

## Release gate

- Branch: `v0/private-beta-readiness`
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
| Build |  |  |  |
| Deployment |  |  |  |
| Authentication |  |  |  |
| Authorization/RLS |  |  |  |
| Moderation/Admin |  |  |  |
| Rate limiting |  |  |  |
| CSP/XSS |  |  |  |
| Database |  |  |  |
| Accessibility/Performance |  |  |  |
| SEO |  |  |  |
| Analytics/Observability |  |  |  |
| Mobile/Empty state |  |  |  |
