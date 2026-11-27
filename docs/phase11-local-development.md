# Phase 11C — Reproducible Local Supabase

Date: 2026-11-27
Status: **implemented and verified locally**.

## 1. Toolchain

- CLI pinned as an exact devDependency: `supabase@3.4.0` (`node_modules/.bin/supabase`).
- Canonical config: `supabase/config.jsonc`. The legacy `config.toml` was removed
  because CLI 3.4.0 explicitly ignores it when `config.jsonc` is present.
- Docker engine available (v29.7.2). No hosted project is linked
  (`supabase status` reports `linked_project: null`).

Ports deliberately avoid the existing Phase 8 local stack (`54321–54327`), which
was **not stopped or modified**:

| Service | Port |
| --- | --- |
| API gateway (REST/Auth/Storage) | 54331 |
| Postgres | 54332 |
| Studio | 54333 |
| Mailpit (local email inbox) | 54334 |
| Pooler (disabled) | 54335 |
| Shadow DB (db diff/reset) | 54330 |
| Analytics/Logflare | disabled (default port 54327 is occupied) |

## 2. Setup

```bash
npm install                      # installs the pinned Supabase CLI
cp supabase/.env.example supabase/.env   # optional; local-only passwords
cp .env.local.example .env.local
npm run supabase:start           # applies all migrations + supabase/seed.sql
```

Copy the `ANON_KEY` and `SERVICE_ROLE_KEY` printed by `supabase start` into
`.env.local` (or run the values helper described in the audit), then:

```bash
npm run dev                      # http://localhost:3000
```

`NEXT_PUBLIC_APP_ENV=local` and the loopback URL are required; any other value
makes the strict env getters throw. See `docs/phase11-environment-variables.md`.

## 3. Seed data

`supabase/seed.sql` is deterministic and local-only. It creates two confirmed
password users, profiles, a public post and a private draft for Alice, a public
post and a comment for Bob, and one notification to Alice.

| User | Email | Password (local only) |
| --- | --- | --- |
| Alice | `alice@local.commun.test` | `LocalTest123!` |
| Bob | `bob@local.commun.test` | `LocalTest123!` |

Never run this seed against staging or production.

## 4. Scripts

| Command | Purpose |
| --- | --- |
| `npm run supabase:start` | start the local stack, apply migrations and seed |
| `npm run supabase:status` | show local services and generated keys |
| `npm run supabase:stop` | stop the local stack (does not delete volumes) |
| `npm run db:reset` | recreate local DB from migrations + seed |
| `PHASE11_ALLOW_WRITES=1 npm run verify:local` | real auth/RLS/CRUD verification |

## 5. Verification result (2026-11-27)

`supabase start`: **PASS** — 7 migrations applied, seed loaded, all containers
healthy on the ports above.

`PHASE11_ALLOW_WRITES=1 npm run verify:local`: **PASS** — 7 PASS / 0 FAIL:

1. Both seeded users sign in with real passwords (GoTrue).
2. Seeded profiles persisted.
3. Two-user RLS: Alice sees her own draft (3 posts) and Bob does not (2 posts).
4. Cross-user update by Bob on Alice's post affected 0 rows.
5. Authenticated insert persisted.
6. Authenticated delete persisted.
7. Notifications are recipient-scoped (Alice 1, Bob 0).

The harness refuses to run unless `.env.local` has `NEXT_PUBLIC_APP_ENV=local`,
a loopback HTTP Supabase URL, and a non-placeholder anon key. Missing config is
reported as BLOCKED, never PASS. Writes require the explicit
`PHASE11_ALLOW_WRITES=1` opt-in.

## 6. Not yet implemented / BLOCKED

- Hosted staging Supabase project: **BLOCKED** (no confirmed isolated project).
- Hosted Vercel staging deployment: **BLOCKED** (no confirmed project/domain).
- Email verification and password recovery on staging: **BLOCKED** (no hosted
  email provider configuration or real callback test).
- Stripe test mode and Upstash KV: **BLOCKED** (no isolated credentials).
- Production schema equivalence: **NOT VERIFIED**; no production read/write was
  performed.
