# Phase 3 — Functional completeness audit

Date: 2026-11-27
Branch: `main`

## Fully implemented (real persistence)

| Feature | CRUD / behavior | Notes |
| --- | --- | --- |
| Authentication (Supabase Auth) | Sign up, sign in, sign out, password reset, email verification | Cookie-based sessions |
| Profiles | Read own, update own, finalize onboarding | Server-authorized |
| Posts / articles | Create, read, update, delete, publish/unpublish, drafts | Owner-scoped |
| Social posts | Create, update, delete | Separate module |
| Comments | Create, list, **edit (owner)**, **delete (owner)** | Added Phase 3 |
| Interactions | Like/unlike, save/unsave with counts | Real DB rows |
| Follows | Follow/unfollow, target validation, duplicate handling | Notifications generated |
| Notifications | List, mark read, clear all | Realtime where supported |
| Reports (user) | Submit, list own | Target validation |
| Moderation | List/filter reports, view, resolve/dismiss/remove/restore | Role-gated |
| Admin | List users, update role/status, audit logs | Admin-gated |
| Billing | Connect status/start, checkout, portal | Stripe test-mode gated |
| Discussions / replies | Create discussion, list, create reply | Real DB |
| News | Read (live sources), ingest (cron/admin) | External fetch |
| Search | Full-text-ish search | DB-backed |
| Analytics / feedback | Record events, submit feedback | RLS-gated |
| Saved reading list | Read | DB-backed |

## Partially implemented

| Feature | Gap |
| --- | --- |
| Comment edit/delete UI | Backend + API complete; UI buttons added for owners |
| Realtime | Notifications use existing capabilities; fallback polling not everywhere |
| Profile media upload | Profile picture update depends on storage bucket (not verified) |
| Account deletion | Not exposed; status changes available to admins |
| Pagination | Present on several lists; not uniformly applied |

## Not implemented / intentionally unavailable

Communities, projects, tasks, meetings, notes, knowledge documents, learning tracks, calendar events, and parts of the workspace dashboard render explicit in-development states rather than fake data.

## Blocked

All data-backed verification requires a reachable, isolated Supabase project and Stripe test resources. See `docs/phase-d-integration-report.md`.