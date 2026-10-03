# Private beta environment

## Required variables

Client-safe variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the legacy anon-key fallback), and `NEXT_PUBLIC_SITE_URL`.

Server-only variables: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, and database connection variables. Never prefix server-only values with `NEXT_PUBLIC_`, print them, or commit them.

## Environment separation

- Local development loads `.env.development.local` with disposable data only.
- Preview/staging must use a separate Supabase project and separate KV namespace/database. Set variables in the Vercel Preview environment, not in committed files.
- Production uses only Vercel Production variables and the production Supabase project. Never point local development at production.
- Keep `.env.example` as names and safe placeholders only; use the Vercel project Vars UI or a password manager for real values.

## Supabase and Auth

Configure the Supabase Site URL and redirect allowlist for each environment. Include the exact deployed origin plus the local development origin where appropriate. Verify email confirmation, password-reset, and OAuth/redirect callback URLs before testing. Trusted origins must be exact HTTPS origins in staging and production; do not use wildcards.

## Upstash rate limiting

The app accepts `KV_REST_API_URL`/`KV_REST_API_TOKEN` injected by the Vercel integration and canonical `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` names. Report submissions use a sliding window of 5 requests per authenticated user/IP per minute. Keep staging and production namespaces separate. A rejected request returns HTTP 429 with `Retry-After` where the route enforces it.

## Deployment and secret handling

Require a successful build, migration review, backup/PITR confirmation, and staging smoke test before inviting beta users. Do not include credentials in logs, screenshots, issues, docs, or test output. Rotate compromised secrets immediately and roll back the Vercel deployment to the last known-good build rather than resetting production data.

## Required staging gates

Use separate `USER_A`, `USER_B`, `MODERATOR`, and `ADMIN` accounts created manually in staging. Test authentication, RLS, authorization, feedback, rate limits, mobile routes, and rollback on staging before production access is granted.
