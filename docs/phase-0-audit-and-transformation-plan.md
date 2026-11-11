# Commun.dev — Phase 0 Audit and Transformation Plan

**Status:** Phase 0 complete. No product code, database migration, or deployment was changed by this phase.
**Date:** 2026-11-11
**Scope:** The developer social network / opportunity platform defined in the master transformation brief.
**Related:** `supabase/proposed_social_core.sql` (proposal only, not applied), `MEMORY.md`, `PRODUCTION.md`, `PHASE-1-TECHNICAL-AUDIT.md`.

---

## 1. Executive summary

1. The repository is a **Next.js 16 App Router + Supabase** application with a working article/feed/follow/comment core, a working Stripe creator-membership module, moderation tooling, and news ingestion. It is not a greenfield project.
2. The current product identity is still **work management** (`lib/design-tokens.ts`, `/dashboard`, `/tasks`, `/meetings`, `/notes`, `/knowledge`, `/learning`, `/calendar`, `/analytics`). That identity directly conflicts with the new direction and must be retired deliberately, not silently forked.
3. The public homepage is currently the temporary maintenance page built in the previous phase (`components/site/maintenance-page.tsx`). The preserved work-management landing page is **not reusable** for the new brand.
4. **Communities, messaging, project showcases, jobs, services/freelance, and external account linking do not exist** — neither in routes nor in checked-in schema. Only articles, global discussions, follows, reactions, bookmarks, comments, notifications, reports, and memberships are implemented.
5. The checked-in migration history **does not define the base social tables** (`profiles`, `posts`, `comments`, `discussions`, `replies`, `follows`, `post_likes`, `post_saves`, `topics`, `notifications`, `reports`, `audit_logs`). Their live shape and RLS policies must be read from the linked Supabase project before any migration is written against them.
6. Two security issues require attention before expanding the social surface: client-side self-activation of `profiles.status` during onboarding, and PostgREST filter construction in search/discovery.

No feature below should be described as complete until it reads and writes real persisted data with authorization and RLS.

---

## 2. Verified stack and runtime

| Area | Verified state |
|---|---|
| Framework | Next.js `16.3.8`, App Router, React `19.2.0`, `--webpack` build |
| Language | TypeScript strict (`tsc --noEmit` passes) |
| Styling | Tailwind `3.4.17` + CSS custom properties in `app/globals.css` |
| Typography | Geist Sans + Geist Mono via `next/font`, added in the previous phase |
| Auth | Supabase Auth, **email + password only**; no OAuth provider is implemented |
| Data access | `@supabase/ssr` server client; service-role path for admin/moderation after role checks |
| Payments | Stripe memberships, paid articles, Connect payouts, earnings ledger, idempotent webhook ledger |
| Rate limiting | Upstash REST sliding window (optional; degrades without credentials) |
| Realtime | One `postgres_changes` subscription on `notifications`; no chat/presence infrastructure |
| Validation | Zod on API inputs; Vitest (9 files / 60 tests) |
| Middleware | `proxy.ts` (Next 16) guards a list of authenticated paths |
| Deployment | Not deployed in this phase; production notes exist in `PRODUCTION.md` |

---

## 3. Existing functionality inventory

Legend: **Live** = route + API + persistence; **Partial** = real data but missing the specified capability; **Placeholder** = static UI; **Missing**; **Blocked** = requires schema/provider approval.

### 3.1 Identity, auth, onboarding

| Capability | Status | Evidence / gap |
|---|---|---|
| Email/password sign-up, login, reset, verify | Live | `components/auth/auth-forms.tsx`, `app/forgot-password`, `app/reset-password` |
| Google / GitHub OAuth | **Missing** | No `signInWithOAuth` call; no provider configuration |
| Session + route protection | Live | `proxy.ts`, `lib/auth.ts`; `/dashboard` returns 307 to `/login` |
| Developer profile | Partial | `profiles`: display name, username, bio, avatar, website, github, `interests[]`, `status`, `role`, `onboarding_completed` |
| Experience, education, skills, cover image, location, headline | **Missing** | No columns, no tables |
| Onboarding | Partial | 4 steps (`components/onboarding/onboarding-form.tsx`); no role, languages, communities, follow suggestions, GitHub connect, or feed personalization |
| Profile visibility controls | **Missing** | No visibility model or per-field privacy |
| Account deletion / data export | **Missing** | No route or API |

### 3.2 Feed and social graph

| Capability | Status | Evidence / gap |
|---|---|---|
| Published article stream | Live | `app/feed/page.tsx` queries `posts` with author embed |
| Following feed | Partial | Only followed authors + self; no ranking, no recency weighting, no community signal |
| Latest feed | Live | Chronological articles only |
| For You / Trending / Communities / Bookmarks tabs | **Missing** | Only two tabs exist |
| Short posts, code snippets, images, video, repo links | **Missing** | `posts` is article-shaped; `post_type` does not exist |
| Likes / saves | Live | `post_likes`, `post_saves`, `/api/interactions/*` |
| Comments + one-level replies | Live | `comments`, `/api/comments`; pins and removal flags exist |
| Repost / quote repost | **Missing** | No table or UI |
| Follow / unfollow | Live | `follows`, `components/discovery/developer-card.tsx` |
| Bookmarks library | Live | `/saved` (articles only) |
| Cursor pagination | **Missing** | `.limit(30)` / `.range()` offsets; no cursor |
| Hide / mute / block | **Missing** | No `user_blocks` / mute model |
| Report content | Live | `reports`, `/api/reports`, `ReportForm` |
| Feed ranking | **Missing** | Ordering is `published_at desc` only |

### 3.3 Publishing and reading

| Capability | Status | Evidence / gap |
|---|---|---|
| Long-form article publishing | Live | `/write`, `components/publishing/editor.tsx`, `POST /api/posts` |
| Markdown subset renderer | Live | `renderMarkdown()` in `lib/posts.ts`; escapes HTML first |
| Syntax highlighting + language selection | **Missing** | Code is plain `<pre><code>`; no highlighter |
| Image uploads / cover upload | **Missing** | `cover_image_path` exists; no upload flow or storage bucket |
| Auto-save / draft list / preview | Partial | Draft status supported by API; editor autosave is client-side only; no drafts index |
| Tags | Partial | `topics`/`post_topics` exist; tag input availability unverified |
| Reading time | Live | `readingTime()` in `lib/posts.ts` |
| Article layout with left reaction rail + right author/related rail | Partial | `app/post/[slug]/page.tsx` has author + interactions + one sidebar card; no rail, related articles, communities, or suggested developers |
| Paid articles | Live | `access_level = 'MEMBERS'`, paywall, entitlement checked server-side |
| Newsletters / courses / downloads | **Missing** | Not modelled |

### 3.4 Communities

| Capability | Status | Evidence / gap |
|---|---|---|
| Community directory | **Placeholder** | `/community` is static UI; `/communities` does not exist |
| Community entity, membership, roles | **Missing** | No `communities`, `community_members` tables |
| Community feed / channels / announcements | **Missing** | —
| Community-scoped discussions | **Missing** | `discussions` is global; no `community_id` |
| Join requests, invites, moderation | **Missing** | —
| Community creation | **Missing** | —

### 3.5 Discussions and questions

| Capability | Status | Evidence / gap |
|---|---|---|
| Global discussion list/detail/reply | Live | `discussions`, `replies`, `/api/discussions`, `ReplyComposer` |
| Accepted answer | Partial | `replies.is_solution` exists; no accept workflow/UI |
| Voting | **Missing** | No vote table |
| Filters (Trending/Unanswered/Solved) | **Placeholder** | Buttons render without behavior in `/discussions` |
| Thread-derived styling | Partial | `app/discussions/[id]/page.tsx` hardcodes dark colors (`border-white/10`, `text-slate-300`) against the white-first system |

### 3.6 Messaging and notifications

| Capability | Status | Evidence / gap |
|---|---|---|
| Notifications | Live | `notifications`, dropdown, `/notifications`, realtime INSERT subscription |
| Notification types | Partial | `LIKE, COMMENT, REPLY, FOLLOW, NEW_POST` only |
| Preferences / grouping | **Missing** | No preference table/UI |
| Direct messages, group conversations | **Missing** | No tables or routes |
| Typing/presence/read receipts | **Missing** | Only an author-presence display component, no transport |
| Message requests, blocking | **Missing** | —

### 3.7 Projects, careers, monetization

| Capability | Status | Evidence / gap |
|---|---|---|
| Project showcase | **Missing** | `/projects` is work-management UI; no showcase entity |
| Jobs / companies / recruiter portal | **Missing** | No routes/tables |
| Applications workflow | **Missing** | —
| Freelance / services marketplace | **Missing** | —
| Creator memberships | Live | `memberships`, Stripe Checkout, destination charges |
| Paid article access | Live | `lib/monetization.ts`, webhook fulfillment |
| Creator payouts | Partial | Connect onboarding + earnings ledger; no payout requests, fees UI, refunds, or disputes |
| Tips, one-time purchases, courses, sponsorships | **Missing** | Not modelled |
| Taxes / KYC | **Blocked** | Provider and legal decisions required |

### 3.8 Discovery, search, trust, integrations

| Capability | Status | Evidence / gap |
|---|---|---|
| Explore | Partial | Articles, discussions, topics, developers; no communities/projects/jobs/events |
| Developer directory | Live | `/discover` with ILIKE search and follow counts |
| Global search | Partial | `/api/search` over profiles/posts/discussions/topics; no communities/projects/jobs; no FTS/trigram index |
| Recommendations | **Missing** | No scoring, impressions, or preference feedback |
| Moderation queue + audit | Live | `/moderation`, `/admin/audit-logs`, reports API, audit logs |
| Appeals, spam detection, impersonation checks | **Missing** | —
| Upload scanning | **Blocked** | No uploads yet |
| Developer news ingestion | Live | `developer_news`, `saved_news`, `lib/news.ts`; external links only |
| GitHub OAuth / repo import | **Missing** | No `external_accounts` or import pipeline |
| DEV.to import | **Missing** | No import tables; news feed only |
| Integration consent/revocation | **Missing** | —

### 3.9 Current non-social product surface (must be retired)

`/dashboard`, `/tasks`, `/calendar`, `/meetings`, `/notes`, `/knowledge`, `/learning`, `/analytics`, and the current `/projects` are work-management screens. Project memory records that **no work-management tables exist**; the screens render honest empty/unavailable states. They conflict with the new product definition and consume navigation, tokens, tests, and maintenance effort.

---

## 4. Route map

### 4.1 Existing routes (inventory)

| Route | Current purpose | Disposition |
|---|---|---|
| `/` | Temporary maintenance page | **Replace** with social landing (Phase 1) |
| `/login`, `/register`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`, `/auth/callback` | Auth | Keep; add OAuth entry points |
| `/onboarding` | 4-step profile setup | Rewrite as 9-step, resumable, skippable |
| `/feed` | Article feed | Expand to social feed |
| `/explore` | Mixed discovery | Expand |
| `/discover` | Developer directory | Keep as `/people` alias or fold into Explore |
| `/search` | Search UI | Keep; extend types |
| `/profile/[username]`, `/profile/me`, `/profile` | Profiles | Redirect to `/people/...` canonical |
| `/post/[slug]` | Article reader | Redirect to `/articles/[slug]` |
| `/write` | Article editor | Expand to universal composer |
| `/saved` | Saved articles | Expand to bookmarks |
| `/discussions`, `/discussions/[id]`, `/discussions/new` | Global forum | Redirect to `/questions` |
| `/community` | Static placeholder | Replace with `/communities` |
| `/news` | External developer news | Keep as discovery surface |
| `/notifications` | Notifications | Keep; extend |
| `/memberships`, `/earnings` | Creator billing | Keep; extend |
| `/settings` | Account settings | Expand |
| `/moderation`, `/moderation/reports/[id]`, `/admin/*` | Trust & safety | Keep; extend |
| `/dashboard` | Work-management dashboard | Retire after approval |
| `/tasks`, `/calendar`, `/meetings`, `/notes`, `/knowledge`, `/learning`, `/analytics` | Work management | Retire after approval |
| `/projects` | Work-management projects | **Conflict**: release for showcase after retiring current UI |

### 4.2 Canonical target routes

```text
/                         social landing (public)
/feed                     home feed
/explore                  discovery hub
/people                   developer directory
/people/[username]        developer profile
/articles                 article index
/articles/[slug]          article reader
/write                    composer / editor (posts + articles)
/questions                Q&A index
/questions/[id]           question thread
/communities              community directory
/communities/[slug]       community home (feed, discussions, members, resources)
/projects                 project showcase index
/projects/[slug]          project showcase
/jobs                     job board
/jobs/[slug]              job detail
/jobs/applications        developer applications
/services                 developer services marketplace
/services/[slug]          service detail
/freelance                freelance opportunities
/messages                 conversations
/messages/[id]            conversation
/notifications            notifications
/integrations             external accounts & imports
/settings                 account, privacy, preferences
/moderation               moderator queue
/admin                    platform administration
```

Redirects (after approval, via `next.config.mjs` or route handlers):
`/profile/:username → /people/:username`, `/profile/me → /people/me`, `/post/:slug → /articles/:slug`,
`/discussions → /questions`, `/community → /communities`, `/discover → /people`.
Work-management routes redirect to `/feed` only at retirement; until then they remain reachable but unlinked from the new navigation.

**Duplicate-route rule:** one canonical URL per entity. Legacy paths are 308 redirects, never parallel implementations.

---

## 5. Data model assessment

### 5.1 What is verifiable from the repository

Checked-in migrations (`supabase/migrations/`) create or alter:

- `creator_accounts`, `billing_customers`, `memberships`, `earnings`, `stripe_webhook_events`
- `posts.access_level` + check constraint
- `developer_news`, `saved_news`
- `product_events`, `beta_feedback`
- Foreign keys: `posts.author_id → profiles.id`, `comments.author_id → profiles.id`, `post_saves.post_id → posts.id`
- RLS for those tables only

### 5.2 What is **not** verifiable here

The base social tables are referenced heavily but **not defined in any checked-in migration**:

`profiles`, `posts`, `comments`, `discussions`, `replies`, `follows`, `topics`, `post_topics`, `post_likes`, `post_saves`, `notifications`, `reports`, `audit_logs`.

`MEMORY.md` records them as existing in the live project, but that cannot be confirmed from this environment. The `.env.local` Supabase URL is a placeholder and the publishable key returned 401 previously; no live catalog dump was obtained. **This is the single largest delivery risk**: a migration written against assumed columns can fail or, worse, weaken RLS.

### 5.3 Missing entities for the target product

Communities and membership/roles, community channels, project showcases, project contributors, jobs/companies/recruiter profiles/applications, conversations/messages/read receipts, services/freelance listings/orders, one-time purchases, payouts/refunds/disputes, external accounts/imports, blocks/mutes, notification preferences, moderation appeals, post media/reposts/short-post types, skills/experience/education, recommendation signals.

### 5.4 Index and query risks

- Feed: no verified composite index on `posts(status, published_at desc)` or `(author_id, status, published_at desc)`.
- Comments: fetch by `post_id` with `created_at` ordering; index unverified.
- Search: `ILIKE '%term%'` across four tables; no `pg_trgm`/`tsvector`. Will not scale.
- Discovery: `profiles.interests` array containment without GIN index.
- Offset pagination (`.range()`) duplicates/skips rows under concurrent inserts; feeds need keyset pagination.

---

## 6. Feature replacement map

| Brief module | Current asset | Action | Phase |
|---|---|---|---|
| Social landing | maintenance page; preserved work-management landing | New landing; do not restore old one | 1 |
| Feed | `/feed` articles only | Extend with post types, tabs, ranking, cursor paging | 1 |
| Composer | article editor | Universal composer (text/code/image/repo/article) | 1–2 |
| Profiles | basic `profiles` | Add headline, location, cover, skills, experience, education; visibility later | 1 / 5 |
| Auth | email/password | Add Google + GitHub OAuth; server-side onboarding finalize | 1 |
| Onboarding | 4 steps | 9 steps, skippable, interest-driven | 1 |
| Articles | working reader + paywall | New three-column layout, highlighting, related content | 2 |
| Projects | work-management UI | Archive; build showcase entity (not tasks) | 2 |
| Search | ILIKE API | Full-text + trigram, extend entity types | 2 |
| Communities | static `/community` | New schema, directory, home, roles, channels | 3 |
| Discussions | global forum | Re-home as `/questions` + community threads | 1 / 3 |
| Messaging | none | New schema + realtime transport + persistence | 4 |
| Notifications | live realtime | Extend types, grouping, preferences | 4 |
| Jobs/careers | none | New companies/recruiter/jobs/applications | 5 |
| Services/freelance | none | New listings/orders/requests | 5 |
| Monetization | Stripe memberships | Extend purchases, tips, fees, payouts, disputes | 5 |
| Integrations | news ingestion | Add GitHub OAuth/repo link, imports with attribution | 6 |
| Moderation | reports/audit | Add appeals, blocks, spam signals, upload validation | 7 |
| Work management | `/dashboard`, tasks, meetings, notes, knowledge, learning, analytics | Retire routes; retain tables if any; no data drops | 1 (approval) |

---

## 7. Social architecture proposal

### 7.1 Authorization model

- Every read of private data is scoped by `auth.uid()` in RLS and repeated in the server query.
- Ownership always derives from the session, never from a request body.
- Role (`USER`, `MODERATOR`, `ADMIN`) is read from `app_metadata`, never client payloads (already the pattern in `lib/auth.ts`).
- Community roles (`OWNER`, `ADMIN`, `MODERATOR`, `MEMBER`) are stored in `community_members` and checked server-side for every mutation.
- Recruiters receive candidates only through an explicit visibility grant; no bulk profile exposure.
- All mutations validate with Zod, then check entitlement, then write. Realtime payloads are never trusted as authority.

### 7.2 Feed read model

Phase 1 uses SQL over `posts` + `follows` + `post_saves` with keyset pagination (`published_at, id`). Phase 2 adds a ranked read model:

```text
score = w1·recency + w2·followed_author + w3·shared_community
      + w4·topic_affinity + w5·meaningful_engagement − w6·spam_signals
```

Signals must exclude raw like counts as the dominant term. Store impression and dwell proxies only if consent and retention rules exist. Provide a visible "Latest" switch that bypasses ranking.

### 7.3 Realtime

Use Supabase Realtime channels scoped by conversation/community membership, with RLS-backed authorization. Messages persist in `messages` first, then broadcast; acknowledge with server-generated ids. Handle duplicate delivery via client idempotency keys and reconnect with `last_seen_at` backfill. Presence is ephemeral and never stored as truth.

### 7.4 Search

Introduce `pg_trgm` for prefix/name search and `tsvector` generated columns for article/question/community/job text. Query through SQL functions (`search_*`) so filters cannot be constructed from user strings. Never interpolate raw input into PostgREST `.or()` filters.

### 7.5 Verification and honesty

- No seeded testimonials, follower counts, repository counts, jobs, or earnings.
- Empty states remain explicit.
- Anything requiring provider approval (payouts, OAuth, email) is labelled blocked until configured.

---

## 8. Design system plan

The previous phase introduced white-first `site` tokens and Geist type. Phase 1 must:

1. Rewrite `lib/design-tokens.ts` to the new brand: positioning, mission, typography, light **and** an intentional dark palette (not an inversion).
2. Keep the existing semantic app tokens (`background`, `surface`, `border`, `accent`, …) and add social primitives: feed column widths, article rail, reaction rail, tag chips, author byline, presence dot, composer surface.
3. Build shell components: desktop three-column feed, mobile bottom navigation, article reading layout, community header, conversation list.
4. Fix inconsistent surfaces (e.g. the dark hardcoded discussion thread) by moving them onto tokens.
5. Motion limited to functional feedback: reaction state, composer transitions, new-item insertion; respect `prefers-reduced-motion`.

The current maintenance page is not the design baseline for the social product; it is a holding experience.

---

## 9. Security and privacy findings

| # | Finding | Severity | Required action |
|---|---|---|---|
| 1 | `components/onboarding/onboarding-form.tsx` writes `status: 'ACTIVE'` from the browser | High if RLS allows the column write | Move activation to a server RPC/route; policies must forbid user updates to `status`/`role`; verify with two accounts |
| 2 | Base-table RLS is not in the repository | High | Read-only live policy dump; do not assume policies exist |
| 3 | `app/discover/page.tsx` and `/api/search` interpolate input into PostgREST `.or()` after escaping only `%_\` | Medium–High | Replace with SQL search functions/RPC; validate length and characters |
| 4 | `isUsernameAvailable` / `isEmailAvailable` in `lib/auth.ts` are stubs | Medium | Implement real uniqueness checks and a DB unique constraint; handle 23505 |
| 5 | No block/mute model | Medium | Add `user_blocks`; filter feeds, profiles, comments, messages |
| 6 | No upload validation pipeline | Blocked | Validate MIME, size, extension; random paths; scan before public serving |
| 7 | Notification types are fixed strings | Low | Extend with a checked type set; add per-user preferences |
| 8 | CSP is report-only | Accepted risk | Enable after enumerating script/connect origins (OAuth, Realtime, Stripe) |
| 9 | Discussions thread styling hardcodes dark colors | Low (a11y/consistency) | Token migration |
| 10 | No data export/deletion | Medium (privacy) | Implement with retention policy |

Positive controls already present: server-side publish authorization, HTML escaping before markdown rendering, signature-verified Stripe webhooks with idempotency, service-role isolation after role checks, rate-limited report submission.

---

## 10. Database impact assessment and migration strategy

### 10.1 Preconditions (blocking)

1. Read-only introspection of the linked Supabase project: tables, columns, constraints, indexes, policies, grants, triggers, migration ledger.
2. Diff against the four checked-in migrations and `MEMORY.md`.
3. Reconcile the missing base-schema migrations into the repository **without replaying them on production**.
4. Confirm which columns are non-null/defaulted before adding constraints or backfilling.

### 10.2 Proposed Phase 1 migration

`supabase/proposed_social_core.sql` (proposal, not applied) adds only what Phase 1 needs:

- `posts`: `post_type`, `language`, `link_url`, `repo_url`, `edited_at` + guarded checks
- `post_media`, `post_reposts`
- `profiles`: `headline`, `location`, `cover_image_path`
- `user_skills`, `user_experience`, `user_education`
- Feed/search-supporting indexes (guarded, `if not exists`)
- RLS for every new table, ownership derived from `auth.uid()`
- A private-by-default media bucket proposal with per-user path policies

It contains no table drops, no row deletes, and no policy weakening. It must be rehearsed on a preview project and reviewed before application.

### 10.3 Later migrations (design only)

Phase 2: `projects`, `project_contributors`, `project_media`, `project_tags`, full-text search objects.
Phase 3: `communities`, `community_members`, `community_invites`, `community_channels`, `community_rules`, scoped discussions, `pinned_items`.
Phase 4: `conversations`, `conversation_members`, `messages`, `message_receipts`, `user_blocks`, notification preferences.
Phase 5: `companies`, `recruiter_profiles`, `jobs`, `job_applications`, `services`, `service_orders`, `freelance_listings`, `transactions`, `payouts`, `refunds`, `creator_purchases`.
Phase 6: `external_accounts`, `imported_content`, `import_jobs`.

No financial table is created until the provider model, fees, refunds, and legal/tax requirements are approved.

### 10.4 Deletion and retention

- Social content: soft removal first (`status`/`is_removed`), then scheduled hard delete where policy allows.
- Account deletion: anonymize content or delete by policy; never cascade-delete financial ledgers.
- Financial records: retained independently of social deletion.
- Imports: retain source URL, author, platform, timestamp; delete on revocation.

---

## 11. Implementation plan

### Phase 1 — Core social platform (next)

| Slice | Deliverable | Exit criteria |
|---|---|---|
| 1A Identity & shell | New landing, social navigation, route map + redirects, design tokens | No work-management links; signed-out and signed-in shells render; no overflow at 375–1440 |
| 1B Data foundation | Live schema reconciliation; review + apply `proposed_social_core.sql` on preview; storage bucket | Migration rehearsed; RLS tested with two accounts |
| 1C Profiles & onboarding | Profile fields, skills/experience/education, 9-step onboarding, server-side finalize, OAuth entry points | Profile persists; activation cannot be self-granted; onboarding resumes/skips |
| 1D Feed & composer | Post types (text/code/image/repo), feed tabs with cursor paging, reactions, reposts, bookmarks, comments | Two-account test: post → follow → feed → react → comment → save; no fabricated data |
| 1E Work-management retirement | Remove nav; redirect legacy routes; archive UI code after approval | No task/kanban/meeting routes reachable; no table drops |

### Phases 2–7

2. Articles, editor upgrades, projects showcase, search/tags.
3. Communities, roles, channels, community moderation.
4. Messaging, presence, notification preferences.
5. Careers, recruiter portal, services/freelance, expanded monetization.
6. GitHub/DEV.to integrations with consent and attribution.
7. Security review, RLS verification, performance, accessibility, observability, deployment readiness.

Each phase ends with the required report: changes, routes, components, DB changes, APIs, authz behavior, security, tests, build, screenshots, limitations, remaining work.

---

## 12. Approvals and inputs required

1. **Read-only Supabase introspection** of the linked project (no writes) to reconcile base schema and RLS.
2. **Approval of the Phase 1 migration** after review and preview rehearsal.
3. **Decision on work-management retirement**: route redirects, source archiving, and whether any existing tables/data must be preserved (no drops proposed).
4. **OAuth credentials** for Google and GitHub (project owner configures providers; values never committed).
5. **Monetization scope approval** before adding purchases, payouts, refunds, or tax handling.
6. **Deployment approval** for any preview/production release.

Until 1–3 are resolved, Phase 1 UI work can proceed only against existing capabilities, and no community/messaging/job claims can be made.

---

## 13. Known limitations of this audit

- The live database was not inspected; all statements about base tables are inferences from code and project memory.
- No reference product was scraped; the pattern synthesis in section 7 is product-level and original, with no code, copy, or assets copied.
- The preserved landing page and its GSAP motion remain in the repository but are not part of the new product direction.
- No browser run was performed in this phase because no product UI changed.
- Test counts and build results refer to the pre-existing application state, unchanged by this phase.

---

## 14. Validation performed

- Route and table inventory via repository search (`app/`, `components/`, `lib/`, `supabase/`).
- Read of auth, onboarding, feed, article, profile, search, discussions, notifications, monetization, and moderation code paths.
- Migration inventory and RLS review of all checked-in SQL.
- No typecheck/build rerun was required: this phase adds documentation and a non-executed SQL proposal only. `git diff --check` was run.
