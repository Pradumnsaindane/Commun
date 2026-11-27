# Phase 11B — Environment Variable Contract

Date: 2026-11-27
Status: implemented (local values are in gitignored `.env.local`; no secrets in Git).

## 1. Required variables by environment

| Variable | local | staging | production | Notes |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_ENV` | `local` | `staging` | `production` | Explicit identity; no inference |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | proposed `https://staging.commun.dev` (verify DNS) | existing production URL | Auth redirects / canonical URLs |
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54331` | hosted `https://<ref>.supabase.co` | existing hosted URL | Loopback HTTP rejected outside local |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from `supabase start` | staging anon/publishable key | existing key | Prefer publishable key; `NEXT_PUBLIC_SUPABASE_ANON_KEY` still accepted |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional alias | optional alias | optional alias | Used when publishable key is absent |
| `SUPABASE_SERVICE_ROLE_KEY` | from `supabase start` (optional locally) | required, server-only | existing, server-only | Never expose to browser |
| `CRON_SECRET` | blank unless testing news ingest | isolated staging value | existing | — |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MEMBERSHIP_MONTHLY` | blank | isolated Stripe **test** values required | existing | Stripe is BLOCKED without isolated test credentials |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | blank | isolated Upstash instance required | existing | Upstash KV is BLOCKED without isolated credentials |

Templates: `.env.example` (all environments), `.env.local.example` (local),
`supabase/.env.example` (CLI stack only). All placeholder values are treated as
unconfigured.

## 2. Validation behavior

`lib/env.ts` provides:

- `isConfiguredValue()` — rejects blank values and known placeholder markers.
- `resolveEnvName()` — only `local | staging | production`; unknown values throw.
- `getSupabaseUrl()` — enforces loopback-only HTTP for `local`; HTTPS +
  `*.supabase.co` otherwise. Rejects the removed hard-coded fallback URL.
- `getSupabasePublishableKey()` — prefers
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; falls back to the deprecated
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` only when the new value is blank or a
  placeholder. Rejects missing/placeholder credentials and refuses any value
  that looks like a service-role/secret key (`sb_secret_*` or a JWT with
  `role: service_role`), so secrets can never reach browser bundles.
  `getSupabaseAnonKey()` is retained as a compatibility alias.
- `getServiceRoleKey()` — returns `null` when absent/placeholder so privileged
  paths can degrade explicitly.
- `validateEnv()` — non-throwing report with a `problems` array.
- `requireSupabaseConfiguration()` — fail-fast check; service-role required
  outside `local`.

The browser and server Supabase factories call the strict getters, so a
missing or placeholder environment fails with a clear error at first use.

## 3. Tests

`lib/env.test.ts` covers placeholder rejection, loopback rules, cross-environment
rejection (staging/production + loopback or non-Supabase host), publishable/anon
key precedence, service-role null behavior, and `validateEnv()` problem
reporting, publishable-key preference, legacy fallback, and secret-key
rejection. `npx vitest run lib/env.test.ts` — **PASS** (18 tests).

## 4. Safety notes

- `.env.local`, `.env.*.local`, `supabase/.env`, and `supabase/.temp/` are
  gitignored. Never paste hosted secrets into docs or commit them.
- The local stack keys printed by `supabase start` are disposable local-only
  credentials. They must not be reused in staging or production.

## 5. Staging provisioning gate variables (Phase 11M)

These are **operator-supplied environment variables for the verification
scripts only**. They are never read from `.env.local`, never committed, and
never printed by the scripts:

| Variable | Purpose |
| --- | --- |
| `PHASE11_STAGING_CONFIRMED` | must be `yes`; explicit authorization to act on staging |
| `PHASE11_STAGING_PROJECT_REF` | the confirmed staging ref (20 chars), blocked if it matches the previously linked production ref |
| `PHASE11_STAGING_VERCEL_PROJECT` | dedicated Vercel project name containing `staging` |
| `PHASE11_STAGING_USER_A_EMAIL` / `_PASSWORD` | first real staging test account |
| `PHASE11_STAGING_USER_B_EMAIL` / `_PASSWORD` | second real staging test account (distinct; no shared local seed password) |
| `PHASE11_STAGING_ALLOW_WRITES` | must be `1` before the hosted harness creates/deletes probe rows |

`npm run verify:staging:identity` prints PASS/BLOCKED for all checks without
network access. Current result: **0 PASS / 10 BLOCKED**. The hosted harness
aborts before any request until the gate passes.
