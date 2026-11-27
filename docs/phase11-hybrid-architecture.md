# Phase 11B — Hybrid Development / Staging Architecture

Date: 2026-11-27
Status: **implemented in repository** (hosted resources remain BLOCKED until
isolated projects and credentials are confirmed).

## 1. Goal

Support three isolated environments without changing the existing Next.js App
Router, Supabase Auth/Postgres/RLS/Storage/Realtime architecture:

| Environment | Supabase | Web app | Data | Purpose |
| --- | --- | --- | --- | --- |
| `local` | disposable CLI stack on loopback | `npm run dev` at `http://localhost:3000` | seeded, disposable | day-to-day development |
| `staging` | dedicated hosted Supabase project | dedicated Vercel project at proposed `https://staging.commun.dev` | isolated test data | public testing |
| `production` | existing hosted project | existing Vercel project at `https://commun.dev` | real data | untouched by Phase 11 |

`NEXT_PUBLIC_APP_ENV` is the explicit environment identity. It is validated by
`lib/env.ts` and is never inferred from a URL or hostname.

## 2. Isolation rules enforced in code

- `getSupabaseUrl()` requires a loopback HTTP URL **only** when
  `NEXT_PUBLIC_APP_ENV=local`. Any other environment must use HTTPS on a
  `*.supabase.co` host.
- `getSupabaseAnonKey()` and `getServiceRoleKey()` reject documented
  placeholder markers instead of constructing a client with fake credentials.
- `requireSupabaseConfiguration()` requires a service-role key outside `local`.
- `lib/supabase/client.ts` and `lib/supabase/server.ts` fail fast with an
  actionable error rather than falling back to `https://placeholder.supabase.co`.
- `createAdminClient()` in `lib/admin.ts` returns `SupabaseClient | null`; call
  sites degrade or throw explicitly. No non-null assertions or mock clients.
- `supabase/.temp/linked-project.json` was unlinked from the previously linked
  hosted project so local CLI commands cannot target it by accident.

## 3. What is not changed

- No migration to Vite, Express, FastAPI, or a second database.
- No rewrite of auth, services, API routes, or RLS policies.
- No weakening of RLS, no service-role key in browser code, no mock auth/CRUD.
- No production credentials, deployments, migrations, or data operations.
- No commit or push.

## 4. Staging design (repository-ready, hosted execution BLOCKED)

A dedicated Vercel project should be created with its own environment variables
(`NEXT_PUBLIC_APP_ENV=staging`, staging Supabase URL/keys, staging app URL). A
dedicated Supabase project should be created with an empty database and the
version-controlled migrations applied only there. The proposed hostname
`https://staging.commun.dev` is **not verified**; DNS, domain ownership and
Vercel project identity must be confirmed by an operator before any hosted step.

Until then, all hosted items in this phase are reported as **BLOCKED**, never
PASS. See `docs/phase11-staging-deployment.md` (to be populated after operator
confirmation) and `docs/phase11-infrastructure-audit.md`.
