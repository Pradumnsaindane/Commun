# Phase 8 — isolated staging configuration

Phase 8 verifies RLS, notifications, realtime, admin and moderation behavior. This document describes the disposable local Supabase configuration used for that verification and how to reproduce it. It contains no credentials.

## Isolation rules

1. The target must be a disposable local or staging Supabase project, never the application project.
2. `npm run verify:phase8` requires `PHASE8_CONFIRM_ISOLATED=yes` and `PHASE8_ALLOW_WRITES=true`.
3. Only loopback Supabase and application URLs are accepted; the harness exits 1 otherwise.
4. Credentials are exported only into the verification shell. They are never written to `.env.local`, `docs/`, or any file inside the repository.
5. Output is masked/redacted; tokens, JWTs, service-role keys and passwords are never printed.
6. Missing Stripe/KV credentials are reported as BLOCKED; the harness makes no provider calls.

## Local isolated stack

Docker and the Supabase CLI are required. Create the project outside the repository:

```bash
STAGING_DIR="$(mktemp -d)"
cd "$STAGING_DIR"
npx --yes supabase@latest init --force
npx --yes supabase@latest start
```

`supabase start` prints the local API URL, anon key and service-role key. Export them as `PHASE8_SUPABASE_URL`, `PHASE8_SUPABASE_ANON_KEY` and `PHASE8_SUPABASE_SERVICE_ROLE_KEY`.

## Apply the version-controlled schema

Phase 8 added a reconstructed core social baseline dated before the existing additive migrations. Copy **all** migrations into the staging project and reset:

```bash
cp <repo>/supabase/migrations/*.sql "$STAGING_DIR/supabase/migrations/"
cd "$STAGING_DIR" && npx --yes supabase@latest db reset
```

The reset applies, in order:

1. `20261001000000_phase8_core_social_baseline.sql` — core tables, RLS, grants, privilege guard, notification realtime publication.
2. `20261004120000_private_beta_observability.sql` — existing observability tables.
3. `20261004130000_phase8_product_events_own.sql` — owner SELECT policy for `product_events`.
4. The remaining existing developer-news, monetization and relationship migrations.

The baseline is reconstructed from application usage, not from a production catalog dump. It is suitable for isolated verification only.

## Fixture accounts

Create four confirmed accounts in the isolated stack, for example through the service-role admin API or Studio:

| Key | Example email | Role in `raw_app_meta_data` | Status |
| --- | --- | --- | --- |
| USER_A | `usera@phase8.test` | `USER` | `ACTIVE` |
| USER_B | `userb@phase8.test` | `USER` | `ACTIVE` |
| MODERATOR | `mod@phase8.test` | `MODERATOR` | `ACTIVE` |
| ADMIN | `admin@phase8.test` | `ADMIN` | `ACTIVE` |

Create a matching public profile row for each account with `status = 'ACTIVE'`. Export:

```bash
export PHASE8_USER_A_EMAIL=usera@phase8.test
export PHASE8_USER_A_PASSWORD='...'
export PHASE8_USER_B_EMAIL=userb@phase8.test
export PHASE8_USER_B_PASSWORD='...'
export PHASE8_MODERATOR_EMAIL=mod@phase8.test
export PHASE8_MODERATOR_PASSWORD='...'
export PHASE8_ADMIN_EMAIL=admin@phase8.test
export PHASE8_ADMIN_PASSWORD='...'
```

## Application under test

Attach a separate dev server to the isolated stack on a different port:

```bash
NEXT_PUBLIC_SUPABASE_URL="$PHASE8_SUPABASE_URL" \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$PHASE8_SUPABASE_ANON_KEY" \
SUPABASE_SERVICE_ROLE_KEY="$PHASE8_SUPABASE_SERVICE_ROLE_KEY" \
NEXT_PUBLIC_SITE_URL=http://localhost:3001 \
npx next dev --webpack -p 3001
```

Export `PHASE8_APP_URL=http://localhost:3001`. Restart the dev server after changing source files; stale dev chunks can produce transient 500/404 responses that are not authorization failures.

## Verification

```bash
export PHASE8_CONFIRM_ISOLATED=yes
export PHASE8_ALLOW_WRITES=true
npm run verify:phase8
```

The harness performs real GoTrue sign-in, PostgREST RLS probes, a Realtime websocket subscription, and application API calls with real session cookies. It creates posts, notifications, product events, memberships and reports, then deletes them and restores mutated account metadata at the end.

Expected final result in this environment:

```
"verdict": "verified-with-blocked",
"counts": { "pass": 49, "fail": 0, "blocked": 2 }
```

The two BLOCKED checks are Stripe and Upstash KV. To verify them, supply isolated test credentials and an approved provider harness; do not reuse production credentials or execute real charges.

## Cleanup

After verification, remove the exported credentials from the shell and either delete the isolated project or run `npx supabase stop`. Confirm no secret was added to git with `git diff --check` and a secret scan of the diff.
