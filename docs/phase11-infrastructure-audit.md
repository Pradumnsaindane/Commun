# Phase 11A — Infrastructure Audit

Date: 2026-11-27
Repository: `/Users/pradumnbharatsaindane/Documents/Commun.com`
HEAD: `580f48d` (uncommitted Phase 6–10 work in working tree)
Method: read-only repository inspection. No source code modified.

## 1. Current architecture

| Layer | Technology | Notes |
| --- | --- | --- |
| Framework | Next.js 16.3.8 App Router | `next dev/build/start --webpack` |
| UI | React 19.2.0, Tailwind 3.4.17 | Strict TypeScript 6.0.3 |
| Auth | Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`) | Browser + server client factories |
| Database | Supabase PostgreSQL | 7 additive, idempotent migrations |
| Authorization | PostgreSQL RLS | Policies on profiles, posts, comments, notifications, reports, discussions, replies, saved news, product events, creator accounts, storage |
| Realtime | Supabase Realtime | `notifications` table in `supabase_realtime` publication |
| Storage | Supabase Storage | `avatars` (public) and `post-media` (private) buckets |
| API routes | 59 `route.ts` handlers | 29 canonical `/api/v1/*`, 29 legacy re-exports, 1 Stripe webhook |
| Auth pages | `/login`, `/register`, `/auth/callback` | No middleware; auth gating per page in server components |
| Deployment | Vercel | Single project, `vercel.json: { "framework": "nextjs" }` |
| CI | GitHub Actions | Node 20, typecheck/lint/test/build |
| Tests | Vitest 1.6.1 | 28 files / 176 tests, node environment, no DOM tests |

## 2. Existing infrastructure

### Supabase migrations (source-controlled)

All under `supabase/migrations/`, applied oldest-first by filename timestamp. All use `create table if not exists`, `drop policy if exists` / `create policy`, so they are idempotent and reproducible.

| Migration | Purpose |
| --- | --- |
| `20261001000000_phase8_core_social_baseline.sql` | Core social schema: profiles, posts, topics, comments, likes/saves/follows, notifications, reports, audit_logs, discussions/replies, social extensions, RLS policies, grants, indexes, storage buckets, realtime publication, privilege-escalation guard |
| `20261004120000_private_beta_observability.sql` | `product_events`, `beta_feedback` tables |
| `20261004130000_phase8_product_events_own.sql` | Adds missing owner SELECT policy for `product_events` |
| `20261011190000_developer_news.sql` | `developer_news`, `saved_news` tables |
| `20261011191000_fix_observability_admin_rls.sql` | Aligns observability read policies to `app_metadata.role` |
| `20261017120000_creator_monetization.sql` | `creator_accounts` and monetization tables (Stripe-related schema, BLOCKED without Stripe credentials) |
| `20261018030000_embedded_relationship_fks.sql` | NOT VALID foreign keys for PostgREST embeds (posts→profiles, comments→profiles, post_saves→posts) |

No seed data files exist. No `supabase/config.toml` exists, so the Supabase CLI is not configured locally.

### Client / server Supabase factories

- `lib/supabase/client.ts` — browser client; silently falls back to `https://placeholder.supabase.co` / `placeholder-anon-key` when env is absent.
- `lib/supabase/server.ts` — server client; same silent placeholder fallback.
- `lib/supabase/admin.ts` — service-role client; returns `null` gracefully when `SUPABASE_SERVICE_ROLE_KEY` is absent. Callers degrade explicitly.
- `lib/admin.ts` — duplicate admin client wrapper; uses `process.env.X!` non-null assertions, so it does NOT degrade gracefully. Duplicates `lib/supabase/admin.ts`.

### Environment files

- `.env.example` — all values blank/placeholder; committed, secret-safe.
- `.env.local` — exists locally (gitignored), 6 keys present, but placeholder analysis shows **only 1 configured value; 5 are placeholders** (Supabase URL, publishable key, service role key, KV URL/token all placeholder/empty). Local Supabase is therefore **not configured**.
- `.env` / `.env.*.local` are gitignored.

### Scripts

`scripts/`: `smoke-test.mjs` (needs `--url`/`TARGET_URL`), `phase-d-connectivity.mjs` (read-only Supabase preflight), `phase5-infra.mjs`, `phase5-workflows.mjs`, `phase7-auth-verification.mjs`, `phase8-integration-verification.mjs`, `phase-d-integration.mjs`, `load-test-k6.js`.

No `supabase:start`, `db:reset`, `db:seed`, `verify:local`, or `verify:staging` npm scripts exist.

### Tooling

- Docker 29.7.2 available (required for local Supabase).
- `@supabase/cli` NOT installed in `node_modules`; no `supabase` binary in `node_modules/.bin`.
- No `supabase/config.toml`.

## 3. Missing configuration

| Item | Status |
| --- | --- |
| `supabase/config.toml` | MISSING — Supabase CLI not initialized |
| Local Supabase env vars | NOT configured (placeholders in `.env.local`) |
| Staging Supabase project env vars | MISSING |
| Production env vars | NOT touched (documented only) |
| Seed data | MISSING — no seed files |
| Local startup/shutdown scripts | MISSING — no npm scripts |
| Environment separation (local vs staging vs production) | MISSING — `lib/env.ts` detects placeholders but does not name environments |
| Auth redirect allowlists for localhost/staging | NOT documented |
| Rate limiting (Upstash KV) | NOT operational — credentials absent |
| Email provider (verify/reset) | NOT configured |

## 4. Security risks (to address in Phase 11)

| Risk | Severity | Detail |
| --- | --- | --- |
| Silent placeholder fallback in browser/server clients | P0 | `client.ts`/`server.ts` build a client with `placeholder.supabase.co` when env is absent; the app would attempt real connections to a fake host instead of failing fast. |
| Non-null assertion in `lib/admin.ts` | P1 | `createAdminClient()` uses `process.env.URL!` and `process.env.KEY!`; throws at runtime when env is missing instead of degrading. |
| Duplicate admin client | P1 | `lib/admin.ts` and `lib/supabase/admin.ts` implement the same concern with different degradation semantics. |
| CSP report-only | P2 | `Content-Security-Policy-Report-Only` with `unsafe-inline` and `unsafe-eval`; not enforced. |
| No operational rate limiting | P1 | Upstash KV credentials absent; public registration/login endpoints have no shared backstop. |
| `.env.local` with real values gitignored | OK | Already correct; secrets are not committed. |

## 5. Environment status

| Environment | Status | Evidence |
| --- | --- | --- |
| Local development | NOT READY | No CLI config, env placeholders, no seed, no startup scripts |
| Public staging | NOT READY | No dedicated Supabase project, no Vercel staging project, no env vars, email provider unconfirmed |
| Production | ISOLATED / UNTOUCHED | No production changes; `.env.local` is local only; `vercel.json` single project |

## 6. Production isolation status

Production is completely isolated by default in this repository:

- `vercel.json` declares a single Next.js project; no staging/production environment blocks.
- `.env.local` is gitignored and local only.
- No production credentials, project refs, or URLs are in tracked files (verified by Phase 8 secret scan: only placeholders/redaction examples).
- Phase 11 must not push migrations, change production env vars, or trigger production deployment.

## 7. Blockers

1. **Supabase CLI not installed** — Docker is available, but `@supabase/cli` / `supabase` binary is absent. Required before local Supabase can start.
2. **Local Supabase env not configured** — `.env.local` contains placeholders for Supabase URL, anon key, and service role key.
3. **No seed data** — local database would start empty; deterministic seed needed for reproducible developer onboarding.
4. **Email provider not confirmed** — registration email verification and password recovery cannot be claimed functional without an SMTP/email provider on staging.
5. **Stripe and Upstash KV credentials absent** — remain BLOCKED per Phase 8 constraints; no provider calls.
6. **No staging Supabase project or Vercel staging project identified** — cannot apply hosted migrations or deploy without external dashboard access.

## 8. Implementation plan (Phases 11B–11L)

1. **11B Environment configuration** — Add `supabase/config.toml`, update `.env.example`/`.env.local.example`, strengthen `lib/env.ts` with explicit environment naming (local/staging/production), reject placeholders, fail fast on missing required vars, never fall back to production URLs, keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
2. **11C Local Supabase environment** — Install Supabase CLI, initialize local stack, apply all migrations, create deterministic seed, add `supabase:start/stop/status`, `db:reset`, `db:seed`, `verify:local` scripts.
3. **11D Cloud staging Supabase** — Document creation of a dedicated staging Supabase project, migration application, Auth site URL/redirect allowlist, email verification, password recovery URLs, Storage buckets/policies, staging readiness check. BLOCKED until credentials/project confirmed.
4. **11E Public Vercel staging** — Document separate Vercel staging project (safer than reusing production project), isolated env vars, public URL (proposed `https://staging.commun.dev`, subject to domain confirmation), deployment protection, auth callback URLs. Do not invent a deployment.
5. **11F Public user authentication** — Real Supabase registration/login/verification/recovery flow on staging. BLOCKED without email provider.
6. **11G Data persistence and user isolation** — Cross-user RLS tests with two accounts (User A/B). BLOCKED until staging DB reachable.
7. **11H Public staging security** — Rate limiting (or documented blocker), RLS verification, CSP, safe errors, no secrets leaked.
8. **11I Health checks** — Safe readiness/liveness endpoints and `verify:local`/`verify:staging` scripts returning PASS/FAIL/BLOCKED/NOT RUN.
9. **11J CI/CD and deployment safety** — Preserve CI checks, protect staging secrets, no production migration, rollback docs.
10. **11K Phase 10 debt gate** — Confirm API response-validation gap is not a staging blocker; record remaining debt as follow-up.
11. **11L Testing and verification** — Run typecheck/lint/test/build, local Supabase smoke, staging verification (only when credentials confirmed), regression checks.

No source code will be modified until this audit is reviewed and Phase 11B begins.
