# Phase 10 — Frontend architecture audit

Date: 2026-11-27
Scope: `app/`, `components/`, `hooks/`, `features/`, `types/`, `lib/`, `server/`, `packages/shared/`, config, CI, tests
Method: read-only repository inspection before any Phase 10 code change. No files were modified by the audit.

## 0. Baseline

| Item | Observed |
| --- | --- |
| Framework | Next.js 16.3.8 App Router, React 19.2.0, TypeScript 6.0.3, Tailwind 3.4.17, Vitest 1.6.1, Zod 4.6.5 |
| Strict TypeScript | Already enabled (`tsconfig.json:11`); no `@ts-ignore` / `@ts-nocheck` in source |
| Routes | 44 `page.tsx`, 1 `layout.tsx`, 60 `route.ts` handlers (29 canonical `/api/v1/*`, 29 compatibility re-exports, 1 Stripe webhook, 1 auth callback) |
| Components | 70 `.ts/.tsx` files under `components/`; 54 `'use client'` directives |
| Tests | 27 files / 169 passing tests before Phase 10; all `.test.ts`, no DOM/component tests |
| CI | `.github/workflows/ci.yml` runs `npm ci`, test, typecheck, lint, build on Node 20 |

The application is already a Next.js App Router TypeScript application. This is a standardization effort, not a migration.

## 1. Correctness defects found

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| C1 | P0 | Root error boundary uses the obsolete `reset` prop. This installed Next.js supplies `retry`, so “Try again” would call `undefined()`. | `app/error.tsx:6,8`; `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md:25-31,117` |
| C2 | P0 | Browser API responses are trusted by an unsafe `payload as T` cast; no runtime schema validation exists on the success path. | `features/api-client.ts:42,60,62-71` |
| C3 | P0 | News search is interpolated into a PostgREST `.or()` filter without the existing sanitizer; query params are only sliced/coerced, not schema-validated. | `server/modules/news/service.ts:9-12`, `lib/news.ts:549-552`, `lib/search-query.ts:25-52`, `app/news/page.tsx:11-26` |
| C4 | P0 | A client component bypasses the centralized API client with raw `fetch` and unchecked response reads. | `components/publishing/editor.tsx:5-8` |
| C5 | P2 | Tailwind content globs omit `features/` and `packages/shared/`. | `tailwind.config.ts:4` |

## 2. Architecture and duplication

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| A1 | P0 | No route groups; one root layout places all routes in a client `AppShell` that branches on a hardcoded `usePathname()` whitelist. | `app/layout.tsx:44`, `components/layout/app-shell.tsx:148-218` |
| A2 | P0 | No route-scoped error/loading/not-found boundaries for four `notFound()` dynamic routes; generic root skeleton causes layout shift. | `app/post/[slug]/page.tsx:41`, `app/profile/[username]/page.tsx:34`, `app/discussions/[id]/page.tsx:5`, `app/moderation/reports/[id]/page.tsx:14` |
| A3 | P1 | Auth gate (`createClient` + `getUser` + `redirect`) is duplicated in 22 pages; role gate duplicated in 4 admin/moderation pages. | app page audit, e.g. `app/dashboard/page.tsx:9`, `app/admin/users/page.tsx:8-10` |
| A4 | P1 | Four overlapping auth surfaces with independent Supabase calls and validation. | `components/auth/auth-form.tsx`, `components/auth/auth-forms.tsx`, `components/ui/commun-3d-login.tsx`, `components/auth/commun-login-adapter.tsx` |
| A5 | P1 | Two independent notification implementations duplicate auth gating, fetching, realtime, and rendering. | `components/notifications/notification-center.tsx`, `components/workspace/notification-dropdown.tsx` |
| A6 | P1 | Two dashboard shells plus a third productivity dashboard duplicate chrome and header logic. | `components/layout/app-shell.tsx`, `components/dashboard/dashboard.tsx`, `components/dashboard/productivity-dashboard.tsx` |
| A7 | P2 | 29 legacy API routes are pure re-exports of the 29 canonical routes; kept deliberately for compatibility. | `server/http/boundaries.test.ts:31-47` |
| A8 | P1 | No `hooks/` or root `types/` directory; all state/effect logic is embedded in components. | component audit |

## 3. TypeScript and typing

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| T1 | P0 | `any` and unsafe casts remain: `search-interface.tsx:40`, `accordion.tsx:60`, `api-client.ts:60,63,71`. | component audit |
| T2 | P1 | Weak response contracts: `posts: unknown[]`, `OwnProfile = Record<string, unknown>`, caller-overridable search generic. | `features/posts/api.ts:40`, `features/profiles/api.ts:3`, `features/search/api.ts:7` |
| T3 | P1 | Duplicated boundary types instead of consuming `@shared/index` contracts. | `components/workspace/notification-dropdown.tsx:11-19`, `components/search/search-interface.tsx:8-14`, `components/publishing/article-interactions.tsx:8-10` |
| T4 | P1 | `any` hotspots in server-side utilities: `lib/news.ts` (9), `lib/interactions.ts` (3), `lib/monetization.ts` (3), `lib/posts.ts` (1). | lib/server audit |
| T5 | P2 | ESLint does not flag explicit `any`; dependencies use `latest` pins. | `eslint.config.mjs:1-5`, `package.json:21-45` |

## 4. Design system, accessibility, performance

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| D1 | P2 | No orange branding remains in `app/`; blue tokens are canonical and should be preserved. | `app/globals.css:6-31`, `lib/design-tokens.ts` |
| D2 | P2 | Duplicate local primitives (buttons, cards, empty states, wordmarks) instead of `components/ui`. | `components/social/landing-page.tsx:9-28`, `components/ui/primitives.tsx`, `components/auth/auth-forms.tsx:10-13` |
| D3 | P2 | Seven static marketing components declare unnecessary `'use client'`. | `components/landing/{capabilities-bento,cta-section,faq-section,features-section,footer,testimonials-section}.tsx`, `components/workspace/workspace-switcher.tsx` |
| D4 | P2 | Accessibility: inputs without labels, buttons without `type`, inert filter buttons, missing `aria-controls`, generic focus handling, non-keyboard FAQ row. | app/component audits |
| D5 | P2 | Single-line JSX up to ~4,200 characters in editor and ~2,400 in discover page; none of the 44 pages exceeds 300 lines. | `components/publishing/editor.tsx:8`, `app/discover/page.tsx:28` |

## 5. Tests and CI

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| Q1 | P1 | No `.test.tsx` files; `jsdom` is installed but unused. Component, hook, form, loading/error states and access control are untested at the UI layer. | `vitest.config.ts:11-14`, `package.json:41` |
| Q2 | P1 | Only 4 of 16 server service modules have direct tests; response-schema failures are untested. | `features/api-client.test.ts:21-87`, `server/modules/*/service.test.ts` |
| Q3 | P2 | CI Node is 20; local Node should be checked for consistency. CSP remains report-only by design. | `.github/workflows/ci.yml:32-36`, `next.config.mjs:5-14` |

## 6. Implementation order

1. **Phase B** — correctness + TypeScript standards: fix C1; add typed shared hooks/config; remove `any` at frontend boundary; add ESLint guard for new `any`; keep strict mode.
2. **Phase C** — shared primitives and design system: typed Button defaults, FieldError, route-state components, remove unnecessary client boundaries, accessibility fixes.
3. **Phase D** — API/service layer: Zod-validated response path in `api-client`, concrete response contracts, fix C3/C4.
4. **Phase E** — auth/layout: typed shell route config, shared auth action hook where safe.
5. **Phase F/G** — feature modules and hooks: shared notification presentation, repeated query/date helpers, empty states.
6. **Phase H** — tests and performance.
7. **Phase I** — CI/CD, documentation, final validation.

Each phase is validated with `npm run typecheck`, `npm run lint`, targeted tests, then the full suite and build before proceeding. No mock data or backend rewrites are introduced. Authorization and Supabase session behavior are preserved.

## 7. Out of scope / deliberately retained

- Legacy `.html`/`.js` prototype artifacts outside `app/` are not part of the Next.js application and are not converted in this phase.
- 29 legacy API re-export routes remain for backward compatibility.
- Genuine product gaps marked “coming soon” are left honest, not replaced with mock CRUD.
- Route-group directory moves are deferred: they add churn without changing behavior, and the current shell can be standardized with typed route configuration first.
