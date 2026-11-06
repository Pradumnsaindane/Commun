# Commun work-management data model (proposal)

**Status:** Architecture proposal only. No database changes have been applied. This model remains provisional until the linked Supabase project's live catalog, migration history, and RLS policies can be inspected and compared for overlap.

## Audit findings and limits

- Supabase Auth is the identity source. Existing application code calls `auth.getUser()` and uses `auth.uid()`; `profiles.id` is the user's public profile key. Work-management identities should reference `auth.users(id)`, not a client-provided profile or organization ID.
- The repository has five checked-in migrations: private beta observability, developer news, observability admin RLS, creator monetization, and relationship foreign keys. The local migration inventory is detailed below. None of these files creates workspaces, projects, or tasks.
- `supabase/proposed_work_management_schema.sql` is an older incomplete draft, not a migration. It omits project memberships, milestones, task comments, and activity events; it lacks complete RLS/grants and workspace-consistent foreign keys. It also combines `NOT NULL` columns with `ON DELETE SET NULL` for project owners and knowledge authors. It must not be applied as written.
- The linked project metadata identifies `supabase-blue-jacket` (`gmhhvrbyjidfhdxakkkm`). The public URL in `.env.local` is the placeholder host `your-project.supabase.co`; it does not identify the linked project. A read-only OpenAPI request to that placeholder failed DNS resolution. A request to `https://gmhhvrbyjidfhdxakkkm.supabase.co/rest/v1/` with the configured publishable key returned HTTP 401. The Supabase CLI was fetched through `npx`, but `supabase projects list --output json` produced no response and hung; the exact CLI processes were stopped. No schema dump or remote migration history was obtained.
- **Live schema conclusion:** tables, relationships, constraints, indexes, triggers, functions, grants and effective RLS policies on the linked database are unverified. The checked-in migration list is not proof of applied migration history. No environment values, credential values, or user rows were printed. Do not infer that the live database is empty from the repository migration list.

## Local migration inventory (verified from checked-in SQL only)

This section describes the local files, not the remote catalog or applied migration ledger.

| Local migration | Tables / relationships | Constraints, indexes, RLS, triggers and functions |
| --- | --- | --- |
| `20261004120000_private_beta_observability.sql` | `product_events` with nullable `user_id -> auth.users ON DELETE SET NULL`; `beta_feedback` with `user_id -> auth.users ON DELETE CASCADE` | `product_events_name_created_idx`, `product_events_user_created_idx`, `beta_feedback_created_idx`; RLS enabled; own-event insert and initial admin-read policy; feedback own insert and initial admin-read policy; authenticated grants (events select/insert; feedback insert); anon revoked. No trigger/function in this file. |
| `20261011190000_developer_news.sql` | `developer_news`; `saved_news` composite PK `(user_id,news_id)` and FKs to auth users and news, both cascading | Unique canonical URL; published/category indexes; `saved_news_user_idx`; public news select; own saved-news policy; anon revoked from saved-news. No trigger/function in this file. |
| `20261011191000_fix_observability_admin_rls.sql` | Alters policies on `product_events` and `beta_feedback` | Replaces admin-read rules with JWT `app_metadata.role = 'ADMIN'`. This is the final policy definition represented by these checked-in migrations. No trigger/function. |
| `20261017120000_creator_monetization.sql` | `creator_accounts`, `billing_customers`, `memberships`, `earnings`, `stripe_webhook_events`; adds `posts.access_level` | Unique Stripe IDs; membership status and uniqueness checks; amount/status checks; indexes on creator/status, subscriber/time, earnings creator/time; RLS and read-only authenticated policies for billing records; service-role-only webhook ledger; adds `posts_access_level_check`. No trigger/function. |
| `20261018030000_embedded_relationship_fks.sql` | Adds `posts.author_id -> profiles.id ON DELETE CASCADE`, `comments.author_id -> profiles.id ON DELETE CASCADE`, `post_saves.post_id -> posts.id ON DELETE CASCADE` | Adds foreign keys idempotently as `NOT VALID`, then attempts validation; no indexes, RLS, triggers, or functions. |

**Catalog coverage from these files:** no checked-in `CREATE TRIGGER`, `CREATE FUNCTION`, or `CREATE INDEX` on the newly linked relationships beyond the indexes listed above. Baseline objects (including `profiles`, posts/content tables, policies, functions, triggers, extensions, and Supabase-managed objects) are not fully defined by these five files and remain unverified remotely.

## Live-schema versus proposed-schema comparison

| Proposed object / concern | Local repository evidence | Linked database finding | Gap / required next step |
| --- | --- | --- | --- |
| `workspaces` | No create statement in checked-in migrations; the old draft proposes it | Unverified | Confirm exact names/columns/policies before adding anything |
| `workspace_members` | No create statement; old draft has role rows but no safe mutation policies or last-owner handling | Unverified | Check for existing org/team/membership tables and membership claims in auth metadata |
| `projects` / `project_members` / `project_milestones` | No create statements; old draft has projects only | Unverified | Check for existing project models and uniqueness conventions; require workspace-consistent composite FKs |
| `tasks` | No create statement; old draft uses `DONE` and `BLOCKED`, while product workflow requires `COMPLETED` and four statuses | Unverified | Check existing task model/consumers; agree canonical status mapping before migration |
| `task_comments` | No create statement | Unverified | Check overlap with generic `comments` and its `post_id`/`author_id` contract; do not repurpose editorial comments |
| `activity_events` | Existing `product_events` is account-level telemetry and has a fixed event allowlist; not a transactional work activity log | Unverified | Confirm no domain event/audit table exists; preserve append-only transactional events separately unless live schema demonstrates a suitable reusable structure |
| Membership boundary | Draft lacks composite tenant FKs | Unverified | Ensure all child references carry `workspace_id`; test policies and FKs with two workspaces and cross-tenant IDs |
| Deletion behavior | Draft has cascading workspace/user deletion and contradictory non-null/set-null fields | Local migrations already include content cascades from profile deletion | Review actual FKs and auth deletion behavior; proposed shared work data uses restricted hard deletes and archive/soft delete |
| RLS / functions / triggers / indexes | Local migrations include RLS for existing features but no work-management policies | Unverified | Obtain catalog dump including policies, functions, triggers, indexes and grants; do not replace existing policies |
| Migration history | Five local SQL files | Remote applied ledger unverified | Obtain remote migration list and reconcile filename/content before writing a migration |

## Workspace-isolation assessment

The proposal can enforce isolation at both database layers, subject to the live catalog comparison:

1. Add unique `(id,workspace_id)` parent keys where children reference a parent; every child row carries `workspace_id`, and composite foreign keys prevent linking a task, milestone, comment, or project membership to a parent in a different workspace.
2. Enforce assignee and project-member membership with composite FKs to `(workspace_id,user_id)` in `workspace_members`. Member removal is a controlled transaction that clears assignees and removes dependent project-member rows before deleting the membership.
3. RLS predicates derive user identity only from `auth.uid()`. Membership/role checks must be implemented with narrowly-owned fixed-search-path helper functions (or non-recursive policy structure) to avoid membership-policy recursion. Tests must prove no cross-tenant reads/writes for every table and role.
4. Project/task activity triggers must derive the actor from `auth.uid()` and validate target workspace. The `activity_events.entity_id` polymorphic reference alone cannot provide referential workspace integrity; triggers must use workspace-scoped lookups. Clients receive no insert/update/delete privileges on this table.
5. Create workspace + initial owner, transfer owner, and remove member are atomic database operations. Enforce at least one owner and block last-owner removal/demotion. Do not allow direct client writes that can violate these invariants.

This is an architecture-level assessment, not a proof of the live database's current isolation. It must be validated with the actual effective policies and two-user integration tests after an approved migration.

## Application dependency and compatibility review

- Existing authenticated identity is obtained from Supabase Auth via `auth.getUser()` / `getAuthContext()`; public profile data is read from `profiles`. New work records should use `auth.users.id` for user references and should not change profile identity, profile RLS, or editorial foreign keys.
- Existing product event reads/writes use `product_events` (`event_name`, `user_id`, `path`, `metadata`). Keep that analytics contract unchanged. Work activity should not be inserted into it unless a future explicit compatibility design maps activity to the current enum without sacrificing transactionality.
- Existing editorial `comments` are post comments with `post_id` and an author profile relationship. Task comments must be separate to avoid breaking `/api/comments`, feed/article embeds, notification logic, or moderation.
- Current `/projects`, `/tasks`, `/meetings`, `/notes`, `/knowledge`, and `/learning` views are marked as unavailable previews; no work-management CRUD API routes were found in `app/api`. The pages can be connected incrementally after schema approval.
- Existing service-role usage is for admin/moderation and billing paths. Work-management APIs should use the caller's cookie/session Supabase client and RLS, never `createAdminClient()` for member CRUD.
- The current UI has task statuses TODO, IN_PROGRESS, IN_REVIEW, COMPLETED. The older SQL draft's `DONE`/`BLOCKED` would break direct status mapping and is not carried into this proposal.

## Proposed migration plan (not executable SQL)

1. **Read-only reconciliation:** obtain a schema-only dump and remote migration ledger for the actual target; inventory every relevant object, existing policies, grants, constraints, extensions and dependencies. Resolve naming conflicts before authoring DDL.
2. **Local test migration:** create a new additive, versioned migration only after comparison and user approval. Keep workspace tables separate from content/profile tables. Add owner/member invariants, composite tenant FKs, indexes, update timestamps and activity triggers. No `DROP`, destructive `ALTER`, broad `CASCADE`, data rewrite, or history repair.
3. **RLS validation:** test authenticated and anonymous roles; verify select/insert/update/delete and RPC grants for OWNER, ADMIN, MEMBER, VIEWER, nonmember and removed member. Verify no direct client write to activity history and no self-promotion/self-enrollment.
4. **Application integration:** use caller-scoped server clients and validated routes; add workspace/project/task CRUD; only then enable UI controls and persistent success feedback. No invites until secure invite acceptance is implemented.
5. **Targeted staging rollout:** after separate explicit approval for the named environment, back up/schema-snapshot first, apply only the approved additive migration, inspect resulting catalog, run integration tests with isolated users/workspaces, then monitor application queries. Production requires its own explicit approval.

### Rollback considerations

- Before any user data exists, a reviewed down migration may remove only newly-created objects in reverse dependency order, after verifying no other application version references them.
- After user data exists, dropping tables is destructive and is not an acceptable routine rollback. Prefer forward-fix migrations or restore from a verified backup/PITR plan. Archive state and immutable activity history need explicit retention handling.
- Do not use `CASCADE` for rollback. Do not alter Supabase migration history or delete existing records. A migration must be transactional where supported and must have a reviewed recovery path for partially applied operations.
- Do not assume a migration filename was applied just because it is checked in; compare the remote ledger and actual catalog first.

### Required test scenarios after approval

- Two users in separate private workspaces cannot read each other's workspace, membership, projects, milestones, tasks, comments or activity.
- A nonmember and a removed member are denied; a viewer can read but cannot mutate; member/admin/owner permissions match the approved matrix.
- Cross-workspace `project_id`, `assignee_id`, milestone, project-member and comment relationships fail at the database constraint boundary.
- Unauthorized task status/priority/assignee changes and project archive/edits fail; a client cannot spoof actor/owner identity or forge activity records.
- Last-owner deletion/demotion is rejected; transfer plus removal succeeds atomically; workspace switcher lists only memberships.
- Task and project mutations create matching activity rows transactionally, with server-derived actor and workspace, and activity is immutable to clients.
- Workspace/project/task archive and hard-delete restrictions preserve comments and history; auth-user deletion behavior matches the approved retention rule.
- Restart/refresh reads persisted values; API errors leave UI state unchanged; no optimistic update is retained without rollback.
- Existing sign-in, profiles, feed, post/article comments, notifications, moderation and analytics flows continue to pass regression tests.

## Unresolved questions requiring access or approval

1. Provide an authorized **read-only schema-only dump and remote migration history** (or enable a Supabase CLI profile with read-only catalog access). Current `.env.local` URL is a placeholder and its key gets HTTP 401 on the linked host; the CLI project-list call did not complete. This is required to complete the actual live-vs-proposed comparison.
2. Confirm the intended migration target and environment (local, staging/preview, or production). Production remains off limits without explicit approval for that environment.
3. Confirm membership policy: who may create workspaces, whether creators automatically become OWNER, and how ownership transfer/last-owner protection should work.
4. Confirm invitations remain disabled until a secure invite/acceptance flow is delivered, since none was found in current API routes.
5. Confirm project/task retention requirements: archive/soft-delete defaults are proposed; permanent workspace deletion and account-deletion retention need a policy.
6. Confirm whether project milestones and task comments are in the first migration scope, and whether the existing editorial `comments` table must remain entirely separate (recommended).
7. Confirm activity retention and allowed metadata. Proposed events are append-only and should exclude secrets and unnecessary personal data.

**Stop point:** no DDL/DML, database object changes, executable migration, deployment, or application backend implementation has been performed. Wait for live schema evidence and explicit approval before proceeding to a migration.

## Proposed entities

All IDs are UUIDs. `created_at`/`updated_at` are `timestamptz`; update timestamps are maintained by a database trigger. Use `auth.uid()` as the actor, never an identity field supplied by the client. Use soft archive/delete for workspaces and projects; do not cascade deletion of business records on account deletion.

| Table | Primary key and ownership | Foreign keys and important constraints | Indexes | Deletion behavior |
| --- | --- | --- | --- | --- |
| `workspaces` | `id`; `created_by` is nullable provenance, not current owner | `name` 2–100 chars; `slug` normalized and unique (global uniqueness only if product requires it); `archived_at`; owner authority represented by an `OWNER` membership | unique lower-case slug; `(archived_at, updated_at desc)` as useful | archive through RPC; hard delete restricted while dependent projects/activity exist; deleting a user sets `created_by` null |
| `workspace_members` | composite PK `(workspace_id,user_id)`; role is `OWNER`, `ADMIN`, `MEMBER`, or `VIEWER` | `workspace_id -> workspaces`; `user_id -> auth.users ON DELETE RESTRICT`; `joined_at`; one or more owners must be maintained transactionally | `(user_id,workspace_id)` for workspace switcher; `(workspace_id,role)` | explicit member-removal RPC first clears task assignees and removes project membership; account deletion is blocked until memberships are transferred/removed |
| `projects` | `id`; `created_by` nullable | `(id,workspace_id)` unique for composite child FKs; title 3–200; status `PLANNING/ACTIVE/PAUSED/COMPLETED/ARCHIVED`; priority; `target_date`; `archived_at` | `(workspace_id,status,updated_at desc)`; `(workspace_id,target_date)` | archive by update. Hard delete restricted while tasks/comments/activity exist. Creator deletion sets provenance null |
| `project_members` | PK `(project_id,user_id)` | `workspace_id`; composite FK `(project_id,workspace_id) -> projects`; composite FK `(workspace_id,user_id) -> workspace_members`; role can be `LEAD` or `CONTRIBUTOR` | `(workspace_id,user_id,project_id)` | removed by project/member management; no cross-workspace assignment possible |
| `project_milestones` | `id`; nullable `created_by` | `(project_id,workspace_id) -> projects`; title 2–200; target date; status `OPEN/COMPLETED`; completed timestamp | `(project_id,target_date)` | project hard delete restricted; archive project instead; creator deletion sets provenance null |
| `tasks` | `id`; nullable `created_by` | `workspace_id` required; optional composite `(project_id,workspace_id) -> projects`; optional composite `(workspace_id,assignee_id) -> workspace_members`; status `TODO/IN_PROGRESS/IN_REVIEW/COMPLETED`; priority `LOW/MEDIUM/HIGH/URGENT`; title 2–240; due date; completed timestamp | `(workspace_id,status,due_at)`; `(workspace_id,assignee_id,status)`; `(project_id,status)` | task hard delete restricted while comments/activity exist; use `deleted_at` for normal removal. Project deletion is restricted until tasks are explicitly unlinked or removed |
| `task_comments` | `id`; author nullable provenance | `(task_id,workspace_id) -> tasks`; body 1–5000; `deleted_at`; immutable creation time | `(task_id,created_at)` | soft-delete comments; task hard deletion restricted; account deletion nulls `author_id` |
| `activity_events` | `id`; append-only, nullable actor | `workspace_id -> workspaces`; `entity_type` + `entity_id` (polymorphic, intentionally no hard FK); action enum/string allowlist; bounded JSON metadata without secrets | `(workspace_id,created_at desc)`; `(entity_type,entity_id,created_at)`; `(actor_id,created_at desc)` | immutable history; actor FK uses `ON DELETE SET NULL`; workspace hard delete restricted, archive preferred |

Use `ON DELETE RESTRICT` for durable workspace/project/task relationships. `SET NULL` only applies to nullable provenance/assignee fields. Normal product deletion is soft deletion or archival. Member removal is a single server-side transaction/RPC: prohibit removing/demoting the last owner; transfer ownership first; clear matching task assignees; delete project-membership rows; then remove the workspace membership. Account deletion must not erase shared project/task history.

## RLS and mutation boundary

Enable RLS on every table and explicitly revoke `anon` access. Grant authenticated only the operations needed for policies. Policies use small `SECURITY DEFINER` membership predicates (fixed `search_path`, owned by a trusted database role, execute revoked from `public` and granted only to `authenticated`) to avoid recursive RLS checks on `workspace_members`:

- `is_workspace_member(workspace_id)` checks a row for `auth.uid()`; use on workspace/project/task/comment/activity reads.
- `has_workspace_role(workspace_id, roles[])` checks `OWNER`/`ADMIN`/member capabilities; use on workspace updates, member administration, and project/task write policies.
- workspace membership rows are visible to current members; insert, role change, owner transfer, and removal go through validated RPCs. A user cannot self-enroll or promote themselves by writing a membership row.
- project reads require workspace membership; writes require `OWNER`/`ADMIN`/`MEMBER` (viewer cannot write). Project-member assignment additionally requires the target is already a workspace member.
- task reads require workspace membership; create/edit/delete policies require a write-capable role. Assignees must be workspace members. A project link must belong to the same workspace via composite FK.
- comments are readable to workspace members and insertable only by authenticated members; edits/deletion are limited to the author or workspace admin and preferably soft-delete only.
- `activity_events` are member-readable and not directly insertable, updateable, or deletable by clients. Triggers append project/task/comment/member events in the same database transaction as each successful write.
- Service-role access is unnecessary for ordinary work-management requests. Next.js route handlers use the caller's Supabase session client so RLS evaluates the caller; actor IDs come from `auth.getUser()`/`auth.uid()`. Invitations are disabled until a secure invite and acceptance flow exists.

Workspace creation should be a transaction/RPC that inserts the workspace and initial `OWNER` membership atomically. Ownership transfer is also one RPC. Any API mutations must validate Zod input, same-origin requests, authenticated user status, membership/role, and the full workspace/project/task relationship; never query by a caller-supplied user ID as authority.

## Existing structures to reuse

- Reuse Supabase Auth `auth.users` and the existing `profiles` one-to-one user profile. Do not add a second organization or identity table.
- Reuse existing `product_events` for product telemetry only. It is not a work-management activity ledger: it allows a fixed analytics event enum and is not workspace-scoped or transactionally coupled to project/task updates. Keep domain activity separate and append-only.
- Reuse the current authenticated Supabase server client and the existing API-route conventions (`getAuthContext`, Zod validation, JSON errors). Do not use the admin client/service role for member-facing CRUD.

## Migration and implementation gate

Before writing an executable migration, obtain live catalog and applied-migration evidence for the linked project using an authorized Supabase CLI/SQL connection. Compare tables, columns, FKs, indexes, grants, and policies; revise this model to avoid collisions and preserve existing data. Then create an additive, versioned migration and test it against a disposable/local Supabase database with two users and two workspaces. No migration has been applied and no feature writes have been implemented in this audit phase.
