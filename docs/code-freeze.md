# Commun code freeze

- Branch: `v0/final-ux-polish`
- Baseline: `a06292e` (`v0/creator-growth-loop`)
- Purpose: establish the final application baseline before isolated staging and private-beta validation.

## Completed core functionality

- Public landing, authentication, onboarding, profiles, published articles, feed, saved articles, discovery/search, discussions, notifications, author follow, article interactions, comments, and publishing flows.
- Real Supabase-backed data access, server-side validation, RLS-aware reads/writes, safe error boundaries, and privacy-conscious analytics/feedback instrumentation.
- Consistent loading, error, empty, success, mobile navigation, focus, and action-feedback patterns for the primary user routes.

## Known limitations

- No seeded runtime data is included; empty states are intentional when the database has no content.
- Search uses bounded PostgreSQL `ilike` queries rather than ranked full-text search.
- Authenticated multi-user interaction and realtime behavior cannot be proven locally without isolated staging accounts.

## Staging blockers and required beta validation

Before inviting beta users, provision isolated Vercel, Supabase/Auth, and KV resources; apply and verify migrations; and create verified USER_A, USER_B, MODERATOR, and ADMIN accounts. Run the full deployed route matrix, cross-account IDOR/RLS checks, moderation/admin checks, realtime two-session checks, authenticated rate-limit normal/429/recovery checks, accessibility scans, performance checks, CSP review, and rollback verification.

Multi-account behavior, RLS workflow, realtime, authenticated rate-limit thresholds, and deployed staging behavior still require isolated staging verification. Do not use existing project resources as a substitute for staging.

## Intentionally deferred

AI, jobs, marketplace, chat, DMs, payments, subscriptions, recommendations, topic-follow contracts, ranked search, and other new product modules are explicitly deferred. They are outside this freeze and must not be added before private-beta validation.

## Freeze rule

New feature work stops after this baseline. Only release-blocking bug fixes, security fixes, accessibility fixes, deployment configuration, staging validation, and evidence/documentation updates should be made before private beta.

## Evidence of completion

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`. Browser QA must cover desktop and 390x844 for `/`, `/explore`, `/search`, `/feed`, `/community`, `/discussions`, `/login`, `/register`, `/write`, `/notifications`, `/saved`, `/settings`, a public profile, and a public article. Unauthenticated protected routes must continue redirecting to login.
