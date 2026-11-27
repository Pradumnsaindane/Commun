# Phase 7 — isolated authentication staging configuration

Phase 7 requires real authentication verification. This document describes the
isolated, disposable Supabase configuration used for that verification and how
to reproduce it. It contains no credentials.

## Isolation rules

1. The target must be a disposable local or staging Supabase project, never the
   application project.
2. Verification scripts require explicit confirmation via
   `PHASE7_CONFIRM_ISOLATED=yes` (or the existing `PHASE5_CONFIRM_ISOLATED=yes`
   alias).
3. Mutating checks such as password reset require `PHASE7_ALLOW_WRITES=true`.
4. Credentials are exported only in the shell environment. They are never
   written to `.env.local`, `docs/`, or any committed file.
5. Output is masked; tokens, JWTs, and email addresses are never printed.

## Local isolated stack (reproduction)

The CLI and Docker are required. The stack is created outside the repository so
generated config and keys cannot be committed:

```bash
STAGING_DIR="$(mktemp -d)"
cd "$STAGING_DIR"
npx --yes supabase@latest init --force
npx --yes supabase@latest start
```

`supabase start` prints the local API URL, anon key, and service-role key. Export
them as `PHASE7_SUPABASE_URL`, `PHASE7_SUPABASE_ANON_KEY`, and
`PHASE7_SUPABASE_SERVICE_ROLE_KEY`. Apply repository migrations from the repo
before testing authenticated API behavior:

```bash
cp -R <repo>/supabase/migrations "$STAGING_DIR/supabase/"
cd "$STAGING_DIR" && npx --yes supabase@latest migration up
```

Create two confirmed test users in the isolated stack (for example with the
service-role admin API or Studio). Export them as:

```bash
export PHASE7_USER_A_EMAIL=...
export PHASE7_USER_A_PASSWORD=...
export PHASE7_USER_B_EMAIL=...
export PHASE7_USER_B_PASSWORD=...
```

To exercise the application itself, start a separate dev server against the
isolated stack on a different port:

```bash
NEXT_PUBLIC_SUPABASE_URL="$PHASE7_SUPABASE_URL" \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$PHASE7_SUPABASE_ANON_KEY" \
SUPABASE_SERVICE_ROLE_KEY="$PHASE7_SUPABASE_SERVICE_ROLE_KEY" \
NEXT_PUBLIC_SITE_URL=http://localhost:3001 \
npx next dev --webpack -p 3001
```

Export `PHASE7_APP_URL=http://localhost:3001` so the verification harness also
checks application API authorization and protected-route redirects.

## Verification commands

```bash
npm run verify:connectivity   # read-only provider preflight (guarded)
npm run verify:auth           # real login/invalid/session/logout/recovery/reset/RLS
npm run verify:integration    # existing cross-account RLS workflow (guarded)
npm run verify:workflows      # existing authenticated workflows (guarded)
```

`verify:auth` refuses to run without isolation confirmation and real, non-
placeholder credentials. It validates:

- provider connectivity;
- invalid credential rejection;
- successful login and access-token identity resolution;
- refresh grant and invalid-token rejection;
- logout refresh-token revocation;
- real password recovery request;
- real password reset and restoration (with explicit write consent);
- distinct cross-user identities and RLS ownership enforcement;
- unauthenticated application API denial;
- protected-route redirect with `?next=` preservation.

## Cleanup

After verification, delete the isolated project or run `supabase stop` for a
local stack, remove exported credentials from the shell, and confirm no secret
was added to git (`git diff --check` plus a secret scan of the diff).
