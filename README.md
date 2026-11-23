# Commun.dev

Commun.dev is a developer social network built with the Next.js App Router, React, TypeScript, Tailwind CSS, and Supabase. It combines technical publishing, short social posts, code snippets, discussions, developer profiles, follows, notifications, search, moderation, and creator memberships in one white-themed application.

The deployed application is the root Next.js project. Legacy static HTML/Vite prototypes remain in the repository as reference material, but they are not part of the Next.js deployment.

## Product surface

Implemented and connected to persisted data:

- Email/password authentication, verification, reset flows, and onboarding.
- Developer profiles with username availability checks and profile completion state.
- Article feed, article reader, short posts, link posts, and syntax-highlighted snippets.
- Follows, likes, saves, comments, notifications, and real-time notification updates.
- Global discussions and replies.
- Developer/search discovery and developer news.
- Reports, moderator queue actions, admin user management, and audit logs.
- Stripe memberships, gated article access, Connect payouts, earnings ledger, and signed webhook fulfillment.

Explicit placeholders (they render honest empty/unavailable states rather than fake data): communities, projects, jobs, tasks, meetings, notes, knowledge documents, learning plans, calendar events, and parts of the workspace dashboard.

## Technology

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 App Router, React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 with CSS custom-property design tokens |
| Identity/data | Supabase Auth, Postgres, RLS, Realtime |
| Validation | Zod at API boundaries |
| Payments | Stripe Checkout, Billing Portal, Connect, signed webhooks |
| Rate limiting | Upstash Redis with an in-process fallback when unconfigured |
| Tests | Vitest |
| Deployment | Vercel-compatible root Next.js app |

## Design system

The application is permanently light-themed. `app/globals.css` declares `color-scheme: light`, `tailwind.config.ts` exposes semantic HSL tokens, and `lib/design-tokens.ts` documents the same palette in TypeScript. There is no theme provider, theme toggle, or `prefers-color-scheme` behavior in the live Next.js app.

The dark styles in root `style.css`, `main.js`, `index.html`, `dist/`, and `commun.dev/` belong to non-deployed prototypes and are preserved only as historical references.

## Request architecture

```mermaid
flowchart LR
  UI[React features and components] --> Client[features/api-client.ts]
  Client --> V1[/api/v1/* route adapters]
  V1 --> Services[server/modules/* business services]
  Services --> Repos[server/repositories/*]
  Repos --> Supabase[(Supabase Postgres)]
  Legacy[/api/* legacy routes] --> V1
```

- `features/*/api.ts` is the only frontend layer that builds API calls.
- `app/api/v1/*` is the canonical HTTP boundary.
- `server/modules/*` contains domain business rules and authorization-aware service results.
- `server/repositories/*` owns Supabase query construction.
- `packages/shared/*` contains API types, schemas, constants, and shared utilities imported through `@shared/*`.
- Legacy `/api/*` paths are thin compatibility re-exports of `/api/v1/*` handlers.

See `ARCHITECTURE.md` and `docs/api-contracts.md` for details.

## Getting started

Requirements:

- Node.js 20 or newer
- npm
- Access to a Supabase project with the application schema and Auth configured

```bash
npm install
cp .env.example .env.local
npm run dev
```

The development server runs at <http://localhost:3000>. Fill `.env.local` with Supabase values before testing data-backed journeys. Do not put service-role or Stripe secret keys in client-side variables.

## Scripts

```bash
npm run typecheck   # TypeScript strict check
npm run lint        # ESLint
npm test            # Vitest suite
npm run build       # Production Next.js build
npm run test:smoke  # HTTP smoke script against a running deployment
```

## Documentation

- `ARCHITECTURE.md` — application boundaries and request lifecycle
- `docs/api-contracts.md` — canonical endpoints and frontend API conventions
- `docs/deployment.md` — environment, preflight, deployment, and rollback notes
- `docs/engineering-report.md` — completed/partial/not implemented/blocked status
- `PRODUCTION.md` — production security and payment notes
- `docs/phase-0-audit-and-transformation-plan.md` — original transformation plan

## Important constraints

- No database migrations, production data changes, commits, or deployments are performed by this repository work unless explicitly requested and reviewed.
- Billing, admin, and moderator capabilities require additional environment variables and provisioned accounts.
- Data-backed journeys cannot be verified without reachable Supabase credentials and a test account.
