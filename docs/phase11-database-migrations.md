# Phase 11 — Database Migrations

Date: 2026-11-27

## 1. Inventory

All schema changes are version-controlled in `supabase/migrations/`:

| Migration | Purpose |
| --- | --- |
| `20261001000000_phase8_core_social_baseline.sql` | profiles, posts, topics, likes/saves/follows, comments, notifications, reports, audit logs, discussions/replies, RLS |
| `20261004120000_private_beta_observability.sql` | product events, beta feedback, RLS |
| `20261004130000_phase8_product_events_own.sql` | owner read policy for product events |
| `20261011190000_developer_news.sql` | developer news, saved news, RLS |
| `20261011191000_fix_observability_admin_rls.sql` | admin read policy correction |
| `20261017120000_creator_monetization.sql` | creator accounts, billing customers, memberships, earnings, webhook events, RLS |
| `20261018030000_embedded_relationship_fks.sql` | embedded relationship foreign keys |

These are additive and idempotent where practical. The baseline was
reconstructed from application queries and proposals, not from a production
catalog dump.

## 2. Local application: PASS

`npm run supabase:start` applied all 7 migrations in order and then loaded
`supabase/seed.sql`. `supabase_migrations.schema_migrations` contains 7 rows.
Seeded counts: 2 profiles, 3 posts, 1 comment, 1 notification.

`npm run db:reset` recreates the same state deterministically.

## 3. Staging application: BLOCKED

Applying migrations to a hosted staging project requires a confirmed isolated
Supabase project and a linked project ref. No hosted project was created,
linked, pushed to, or migrated in Phase 11. The previously linked
`supabase-blue-jacket` reference was **unlinked** to prevent accidental writes.

## 4. Production: NOT VERIFIED / untouched

No production migration, catalog dump, credential read, or data operation was
performed. Production schema equivalence remains **NOT VERIFIED** and must be
checked read-only by an operator before any claim of parity is made.
