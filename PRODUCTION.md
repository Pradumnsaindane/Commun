# Commun production notes

## Architecture

Commun is a Next.js 16 App Router application. Supabase Auth and RLS provide identity and baseline row authorization. Server routes use the authenticated session from `lib/auth.ts`; moderation and admin reads/writes use the server-only service-role helper after explicit role checks in `lib/admin.ts`.

## Authorization

`USER`, `MODERATOR`, and `ADMIN` are stored in Supabase app metadata and never accepted from browser payloads. `PENDING_VERIFICATION`, `SUSPENDED`, `DEACTIVATED`, and `DELETED` users are blocked from restricted writes by route checks and database policies. Ownership is derived from the session, not request fields.

## Database and RLS

Social, discussion, notification, reporting, and audit tables are protected by RLS. Client-visible mutations use user-scoped policies. Moderation audit logs are append-only to normal clients and are written through the server-only privileged path. Schema changes are applied through the connected Supabase migration workflow; production data is not reset or seeded.

## Environment

Public browser variables are limited to `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the compatibility anon key), and the auth redirect URL. `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be prefixed with `NEXT_PUBLIC_` or imported by a client component. Set `NEXT_PUBLIC_SITE_URL` for canonical URLs, sitemap, and robots output.

## Validation and deployment

Use `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` before deployment. Verify Supabase Auth redirect configuration, email confirmation, RLS policies, Realtime publication membership, and production HTTPS. Protected route and public route smoke checks should be run against the deployed preview with at least one real account per role.

## Known limitations

Rate limiting is not currently backed by a distributed limiter, so abuse-sensitive endpoints should be placed behind platform/WAF limits before high-volume launch. Full multi-account moderator/admin smoke testing requires provisioned accounts for each role. CSP is report-only until deployed traffic has been observed and all legitimate script/connect origins are confirmed; this avoids breaking Supabase auth and preview tooling during rollout.
