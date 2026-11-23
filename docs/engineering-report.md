# Engineering transformation report

Date: 2026-11-23
Scope: production-oriented restructuring of the live Commun.dev Next.js application

This report distinguishes work that is **completed**, **partial**, **not implemented**, **blocked**, and **requires external configuration**. No commits, deployments, migrations, or production data changes were made. All changes are uncommitted in the working tree.

## Verification summary

| Check | Result | Notes |
| --- | --- | --- |
| `npm run typecheck` | Pass | Re-run after build so generated `.next/types` were stable |
| `npm run lint` | Pass | 0 errors; 7 pre-existing warnings (prototypes, `main.js`, load-test script, and three live component hints) |
| `npm test` | Pass | 21 files, 130 tests (includes API boundary guards, env/Stripe config guards, and webhook refund/idempotency tests) |
| `npm run build` | Pass | Known local `@next/swc-darwin-arm64` dlopen warning; WASM fallback used. 92 static pages generated, all routes compiled |
| Responsive/theme browser audit | Pass | 56/56 route × width combinations (8 routes × 1920/1440/1280/1024/768/390/375): white body, `color-scheme: light`, no horizontal overflow, no dark blocks |
| Cinematic hero CTAs | Pass | Now honest links to `/register` and `/feed`; no dead app-store placeholders |
| `scripts/smoke-test.mjs` | Pass | 20/20 checks: public routes, nine protected redirects, unauthenticated API guards, security headers |
| `npm run verify:connectivity` | Expected failure | Correctly reports `blocked`: `.env.local` still contains Supabase/KV placeholders |
| Console smoke | Benign | `favicon.ico` 404 and expected unauthenticated `/api/v1/notifications` 401 on public pages |

Note: running `typecheck` and `build` concurrently produces transient `TS6053` errors because both touch `.next/types`; the checks pass when run sequentially.

## Completed

### Permanent light theme
- Semantic light design tokens in `app/globals.css`, `tailwind.config.ts`, and `lib/design-tokens.ts` (tested).
- `color-scheme: light` and `themeColor: #FFFFFF`; no `ThemeProvider`, `next-themes`, `dark:` utilities, or `prefers-color-scheme` inversion in the live app.
- Dark scrims/shadows in shell, modal, auth forms, and onboarding replaced with tokenized light utilities.
- `/cinematic-hero` and `components/ui/cinematic-landing-hero.tsx` fully re-themed with Commun copy and light product surfaces.

### Architecture and API boundaries
- Root Next.js app retained as the single deployment; logical boundaries introduced without a risky folder-only monorepo conversion.
- `server/http/*` (response, auth, result helpers), `server/modules/*` (business services), `server/repositories/*` (Supabase access).
- 26 canonical `/api/v1` route files; every implemented legacy `/api/*` path is now a thin compatibility re-export of its v1 handler.
- All 26 v1 routes are single-line adapters to `toResponse(await service(...))`. Services own business rules, repositories own Supabase queries, and Zod validates request boundaries. This now covers admin, moderation, billing, reports, feedback, analytics, and news as well as the social core.
- `server/http/boundaries.test.ts` guards those invariants and `ServiceFailure` now carries optional response headers so rate-limit `Retry-After` values survive the refactor.
- `packages/shared/*` for API types, Zod schemas, constants, and utilities via `@shared/*` (mapped in `tsconfig.json` and `vitest.config.ts`).
- Webhooks and auth callbacks intentionally remain unversioned because they are provider-driven contracts.

### Frontend API layer
- `features/api-client.ts` centralizes all `fetch` calls with `/api/v1` prefixing, typed errors (`ApiError`, `SessionExpiredError`, `NetworkError`), structured validation payloads, safe 204 parsing, and `Retry-After` preservation.
- Feature services under `features/*/api.ts` cover posts, profiles, comments, interactions, notifications, search, discussions, moderation, billing, feedback, admin, and analytics; components no longer construct API URLs.
- Tests added for client error behavior and feature services.

### Correctness and safety fixes in this pass
- Moderation action enum restricted to implemented actions (`RESOLVE`, `DISMISS`, `REMOVE`, `RESTORE`); report update errors checked; reports closed when content is removed.
- Moderation query uses `safeParse` with a 422 response; admin pagination uses integer parsing.
- Checkout now fails loudly when the Stripe customer cannot be persisted.
- Feedback and reports require an active account; reports use the shared auth context.
- News query inputs bounded; in-process rate-limit fallback added so abuse-sensitive routes do not fail 500 when Upstash is unconfigured (tested).
- Search interface state fix removed a `set-state-in-effect` lint error without regressing loading behavior.

### Phase D reliability hardening
- `lib/env.ts` detects `.env.example` placeholder values so placeholders no longer masquerade as configuration (tested).
- Rate limiting ignores placeholder KV values and falls back to the in-process window instead of calling `your-kv.upstash.io` (tested).
- Stripe helpers reject placeholder secrets and price IDs, so billing returns 503 rather than attempting fake API calls (tested).
- Creator checkout requires `payouts_enabled`; a creator who cannot receive payouts can no longer be subscribed (tested).
- Stripe webhook now marks fully refunded earnings `refunded`, acknowledges duplicate refunds idempotently, and explicitly logs partial refunds and disputes for manual reconciliation (tested).
- `proxy.ts` fails closed for protected routes when Supabase is unconfigured or the auth check throws, instead of continuing to the protected page.
- `npm run verify:connectivity` adds a secret-safe preflight that prints masked hosts and exits non-zero on placeholders.
- Full Phase D evidence and the isolated-environment runbook are in `docs/phase-d-integration-report.md`.

### Documentation
- `README.md` rewritten for the real product and architecture.
- `ARCHITECTURE.md`, `docs/api-contracts.md`, and `docs/deployment.md` added; `PRODUCTION.md` updated.

## Partial

- **Legacy compatibility.** Unversioned `/api/*` routes are retained as re-exports. This preserves existing clients but means two URL paths remain in the routing table. New code is directed to `/api/v1` only.
- **Provider callbacks.** The Stripe webhook and Supabase auth callback remain unversioned and outside the layered service path because their contracts are defined by the providers; they still use shared logging/result helpers where applicable.
- **Stripe webhook coverage.** Signature verification, event claiming (`stripe_webhook_events`), membership sync, checkout completion, subscription lifecycle, invoice events, and `account.updated` are implemented. Full refunds update earnings to `refunded`; partial refunds and disputes are acknowledged for idempotency and logged because the ledger has no partial/disputed state. There is no explicit application-level request body size limit (platform/WAF limits apply).
- **Creator payout readiness.** `payouts_enabled` is persisted and now gates checkout together with `details_submitted && charges_enabled`, so destination charges cannot target a creator who cannot receive payouts. A later `payouts_enabled` change does not retroactively cancel an existing membership; that remains a provider-level lifecycle concern.
- **Privileged route hardening.** Admin/moderation role checks and several rate limits are present, but not every privileged endpoint has a dedicated limit, and some query-parameter validation is still endpoint-local rather than schema-driven.
- **Rate limiting fallback is per instance.** Without Upstash/Vercel KV, limits are enforced in process and reset on deploy. Multi-instance deployments require shared Redis.

## Not implemented

- Physical monorepo split or second deployment; deliberately out of scope.
- Theme switching/dark mode; deliberately removed from the live app.
- Persisted communities, projects/showcase, jobs, tasks, meetings, notes, knowledge documents, learning plans, calendar events, and parts of the workspace dashboard. These render explicit unavailable/in-development states rather than fake data.
- Moderator "suspend user" actions that were advertised by an old enum; removed from the API contract. Use `/api/v1/admin/users` for status changes.
- New chat/messaging features beyond discussions and replies.

## Blocked

- **Supabase connectivity.** Phase D diagnosed the earlier `TypeError: fetch failed` as configuration, not network: `.env.local` is a copy of `.env.example` (`https://your-project.supabase.co`, placeholder keys), so DNS fails with `ENOTFOUND` before any request reaches Supabase. `/api/posts` and `/api/v1/posts` return HTTP 500 `{"error":"Unable to load articles."}`. General network/DNS to Supabase, Stripe, and npm works.
- **Core schema and RLS are not version-controlled.** `profiles`, `posts`, `comments`, `post_likes`, `post_saves`, `follows`, `notifications`, `reports`, `discussions`, `replies`, `post_topics`, and `audit_logs` are referenced by the app but created outside tracked migrations. The files that add their policies are marked `PROPOSED — NOT APPLIED`, so cross-user isolation and the profile privilege-escalation guard cannot be audited or verified.
- **Authenticated end-to-end journeys.** Without reachable Supabase credentials and a test account, register/login, onboarding, publishing, interactions, and notifications cannot be verified end to end. Unauthenticated requests correctly redirect or return 401.
- **Role and payment journeys.** Moderator/admin flows and Stripe checkout/portal/Connect flows require provisioned accounts and provider configuration that are not available here.
- The root `style.css`, `main.js`, `index.html`, `dist/`, `commun.dev/`, and `components/landing/*` artifacts remain dark/static prototypes. They are not imported by the Next.js app and were intentionally preserved rather than deleted.

Phase D's required verification matrix, root-cause evidence, and the exact isolated-project procedure are recorded in `docs/phase-d-integration-report.md`. No live repository, RLS, Stripe test-mode, or end-to-end result is claimed.

## Requires external configuration

| Capability | Requirement |
| --- | --- |
| Auth, data, RLS, Realtime | Reachable Supabase project, correct schema/policies, configured redirect allowlist and email templates |
| Shared rate limiting across instances | Upstash/Vercel KV REST credentials (otherwise in-process fallback only) |
| Memberships and payouts | Stripe secret key, webhook secret, monthly price id, webhook endpoint, Connect settings |
| Scheduled news ingestion | `CRON_SECRET` and a cron/manual trigger |
| Admin/moderation smoke tests | Accounts with matching `app_metadata.role` and `status` |
| Canonical URLs | `NEXT_PUBLIC_SITE_URL` set per environment |

See `.env.example`, `docs/deployment.md`, `docs/private-beta-environment.md`, and `PRODUCTION.md` for the variable inventory and environment rules.

## Deferred findings (accepted with rationale)

- **Admin metadata changes and token revocation.** Changing a user's role/status in `app_metadata` may not take effect in an already-issued JWT until it expires or the user re-authenticates. Documented; forcing session revocation would require a broader auth design change.
- **Session consistency and structured logging.** Services resolve auth once and return `ServiceResult` values, but direct `createClient()` calls remain inside repositories and a few helper integrations (`lib/news`, `lib/stripe`). Consolidating those is a future cleanup, not a boundary violation.
- **Cron secret comparison.** The news-ingest route uses a strict string comparison rather than a constant-time one; the secret is high-entropy and sent over TLS, and the route also accepts an admin session.
- **Public news filtering/rate limits.** Query inputs are bounded, but category filtering and anonymous rate limiting are not yet enforced at this endpoint.
- **Application-level request size limits.** Body reads are bounded in `server/http/response.ts` for layered routes; webhook and auxiliary routes rely on platform limits.

## Sign-off

The transformation achieved its primary goals: a permanent white theme, a canonical versioned API with typed frontend communication, layered boundaries across every application domain, honest empty states, passing automated checks, and complete engineering documentation.

Phase D added configuration guards, fail-closed routing, payout gating, refund handling, and a connectivity preflight, and it materially improved the safety of the code. It also established that production readiness **cannot be certified from this environment**: the real Supabase schema/RLS, four-account authorization matrix, Stripe test mode, and ten end-to-end journeys remain unverified. The next gate is an isolated Supabase project plus Stripe test resources, executed against the procedure in `docs/phase-d-integration-report.md`.
