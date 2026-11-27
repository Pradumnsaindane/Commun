# Phase 11M — Hosted Staging Provisioning

Date: 2026-11-27
Status: **repository preparation COMPLETE; hosted provisioning BLOCKED**.
No hosted project was linked, migrated, deployed, queried, or written to.

## 1. Resource identity checklist (must be completed before any hosted action)

| # | Check | Required value / proof | Status |
|---|---|---|---|
| 1 | Explicit operator confirmation | `PHASE11_STAGING_CONFIRMED=yes` | **BLOCKED** |
| 2 | Environment identity | `NEXT_PUBLIC_APP_ENV=staging` | **BLOCKED** |
| 3 | Staging project ref | new 20-char ref, != `gmhhvrbyjidfhdxakkkm` (previously linked; treated as production) | **BLOCKED** |
| 4 | Staging Supabase URL | `https://<staging-ref>.supabase.co`, host must match #3 | **BLOCKED** |
| 5 | Publishable/anon key | from staging project; not placeholder, not local CLI `supabase-demo` issuer | **BLOCKED** |
| 6 | Service-role key | from staging project, server-only, distinct from anon key | **BLOCKED** |
| 7 | Public app URL | HTTPS, not `commun.dev` / `www.commun.dev`; DNS and ownership confirmed | **BLOCKED** |
| 8 | Dedicated Vercel project | name contains `staging`, distinct from production project | **BLOCKED** |
| 9 | Two staging test accounts | distinct emails, passwords != local seed `LocalTest123!` | **BLOCKED** |
| 10 | Auth redirect allowlist | exact staging callback URLs configured on staging Auth | **BLOCKED** |
| 11 | Email delivery | staging SMTP/provider configured and inbox accessible | **BLOCKED** |
| 12 | Migration ledger inspection | staging DB inspected read-only before `supabase db push` | **BLOCKED** |
| 13 | Stripe test mode / Upstash isolation | isolated credentials, or explicitly accepted BLOCKED | **BLOCKED** |

The gate is executable and currently reports **0 PASS / 10 BLOCKED**:

```bash
npm run verify:staging:identity
```

`scripts/phase11-staging-verification.mjs` calls the same gate and **aborts
before any network request** when it fails. No value is ever read from
`.env.local` for hosted verification.

## 2. Exact manual Supabase dashboard instructions

Perform these in the Supabase dashboard while signed into an account that owns
a **new** project. Do not reuse the project referenced in
`supabase/.temp/linked-project.json` (that metadata was unlinked locally; the
ref is treated as production until proven otherwise).

1. **Create project** → New project → name e.g. `commun-staging`, choose a region,
   set a strong database password, and record the generated **project ref**.
   Confirm it is not the production ref and that this is a separate PostgreSQL
   database with empty public schema.
2. **Project Settings → API** → copy the project URL, publishable/anon key, and
   service-role key into the Vercel staging secret store only (never into Git,
   chat, docs, or browser env).
3. **Authentication → Providers → Email** → enable email provider; enable
   email confirmations; set site URL to the verified staging HTTPS URL; add
   redirect URLs for the exact staging host and its `**` wildcard paths.
4. **Authentication → URL Configuration** → set Site URL and redirect allowlist
   to include `https://<verified-staging-host>/**`. Do not include production URLs.
5. **Authentication → Rate Limits / Captcha** → enable signup/token rate limits;
   add Turnstile or hCaptcha if abuse protection is required.
6. **Authentication → Emails → SMTP** → configure staging SMTP credentials with
   a real sender and quota; send one confirmation email and one recovery email
   to a controlled inbox and retain evidence (message IDs/timestamps).
7. **Storage** → create buckets `avatars` (public) and `post-media` (private).
   The policies are created by migrations; confirm after migration that
   `avatar_storage_select_public`, `avatar_storage_write_own`,
   `post_media_storage_select_own`, and `post_media_storage_write_own` exist.
8. **Database → migrations/SQL editor** → inspect `public` tables and
   `supabase_migrations.schema_migrations` before applying anything. Apply only
   `supabase/migrations/*.sql` from this repository, in filename order.
   **Never run `supabase/seed.sql`** against public staging — it contains shared
   development passwords.
9. **Database → Policies** → verify RLS is enabled on all `public` tables listed
   in `scripts/phase11-staging-identity.mjs` (`REQUIRED_TABLES`). Do not disable
   RLS or add permissive policies to make tests pass.

## 3. Safe CLI sequence (only after #1–#13 pass)

```bash
export PHASE11_STAGING_CONFIRMED=yes
export PHASE11_STAGING_PROJECT_REF=<staging-ref>          # from step 1
export NEXT_PUBLIC_APP_ENV=staging
export NEXT_PUBLIC_SUPABASE_URL=https://<staging-ref>.supabase.co
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<staging-anon-key>
export SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
export NEXT_PUBLIC_SITE_URL=https://<verified-staging-host>
export PHASE11_STAGING_VERCEL_PROJECT=<dedicated-staging-project>
export PHASE11_STAGING_USER_A_EMAIL=...  PHASE11_STAGING_USER_A_PASSWORD=...
export PHASE11_STAGING_USER_B_EMAIL=...  PHASE11_STAGING_USER_B_PASSWORD=...

npm run verify:staging:identity       # must be 10 PASS / 0 BLOCKED

supabase link --project-ref "$PHASE11_STAGING_PROJECT_REF"
supabase migration list               # read-only ledger inspection
supabase db push                      # applies version-controlled migrations only
```

`supabase db push` must never run until the ref printed by `supabase migration
list` and the identity gate agree. Do not use `supabase db reset` or `db push
--include-seed` on hosted staging.

## 4. Vercel staging deployment

`vercel.json` currently contains only `{"framework":"nextjs"}` and there is no
local `.vercel` project link. GitHub Actions contain CI validation and a manual
smoke-test workflow only — no automatic staging deploy exists.

1. Create a **new Vercel project** (do not reuse production) and connect the repo.
2. Set environment variables: `NEXT_PUBLIC_APP_ENV=staging`,
   `NEXT_PUBLIC_SITE_URL=<verified staging URL>`, staging Supabase URL and
   publishable key (browser-exposed), and `SUPABASE_SERVICE_ROLE_KEY` only in
   server-side encrypted env. Add Stripe **test** and isolated Upstash values if
   available; otherwise leave blank and report BLOCKED.
3. Add/confirm DNS for `staging.commun.dev` (proposed, **not verified**) and
   attach it to the staging project. Do not change production deployment protection.
4. Deploy the staging project and verify public HTTPS access. Run the manual
   smoke-test workflow against the staging URL only.

## 5. Hosted verification harness (prepared, not executed)

```bash
PHASE11_STAGING_ALLOW_WRITES=1 npm run verify:staging
```

It verifies: connectivity, migrated table presence, two-user login, CRUD for
both users, cross-user read/update denial, anonymous denial, session token
reuse, and probe cleanup. Registration, email verification, password
recovery/reset, browser logout, and protected-route access remain **BLOCKED**
and require observed manual testing with real emails.

## 6. Current hosted status

All hosted items are **BLOCKED**; no hosted URL was probed, no cloud write was
performed, and no staging credentials were supplied. Local verification must not
be presented as hosted verification.
