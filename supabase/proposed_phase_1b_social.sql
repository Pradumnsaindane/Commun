-- ============================================================================
-- PROPOSED MIGRATION — NOT APPLIED
-- Commun.dev Phase 1B: secure social core
-- ============================================================================
--
-- DO NOT RUN until all of the following are true:
--
--   1. A read-only dump of the linked Supabase project has been reviewed:
--      tables, columns, constraints, indexes, policies, grants, triggers and
--      the migration ledger.
--   2. Duplicate usernames have been reconciled (the unique index below will
--      fail if any exist).
--   3. The notification type constraint has been identified (this file rebuilds
--      any check constraint on public.notifications whose definition mentions
--      "type"; review that before applying).
--   4. The migration has been rehearsed on a disposable preview project and
--      authorization has been tested with two independent accounts.
--   5. The owner has approved applying it to a named environment.
--
-- Safety properties:
--   * Only additive columns, guarded constraints, indexes and new functions.
--   * No table, column, row, or user record is deleted.
--   * No existing policy is dropped or weakened. Only the notification type
--     check constraint is recreated (documented above).
--   * All statements are idempotent so an interrupted apply can be re-run.
--
-- What this does NOT create (deliberately out of scope): communities,
-- messaging, jobs, services, projects showcase, payouts, imports, blocks,
-- notification preferences. Reposts are already proposed in
-- supabase/proposed_social_core.sql.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Developer profile fields
-- ----------------------------------------------------------------------------

alter table public.profiles add column if not exists headline text;
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists cover_image_path text;
alter table public.profiles add column if not exists portfolio_url text;
alter table public.profiles add column if not exists skills text[] not null default '{}';
alter table public.profiles add column if not exists technologies text[] not null default '{}';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_headline_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_headline_check
      check (headline is null or char_length(headline) <= 120);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_location_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_location_check
      check (location is null or char_length(location) <= 120);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_skills_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_skills_check
      check (cardinality(skills) <= 20);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_technologies_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_technologies_check
      check (cardinality(technologies) <= 20);
  end if;
end $$;

-- Case-insensitive uniqueness. This is the database guarantee that closes the
-- username race between the availability check and the write. Review for
-- duplicates before applying.
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username))
  where username is not null;

create index if not exists profiles_skills_gin on public.profiles using gin (skills);
create index if not exists profiles_technologies_gin on public.profiles using gin (technologies);


-- ----------------------------------------------------------------------------
-- 2. Post types
-- ----------------------------------------------------------------------------

alter table public.posts add column if not exists post_type text not null default 'ARTICLE';
alter table public.posts add column if not exists language text;
alter table public.posts add column if not exists link_url text;
alter table public.posts add column if not exists edited_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_post_type_check' and conrelid = 'public.posts'::regclass) then
    alter table public.posts add constraint posts_post_type_check
      check (post_type in ('ARTICLE', 'POST', 'SNIPPET', 'LINK'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'posts_link_url_check' and conrelid = 'public.posts'::regclass) then
    alter table public.posts add constraint posts_link_url_check
      check (link_url is null or link_url ~* '^https?://');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'posts_language_check' and conrelid = 'public.posts'::regclass) then
    alter table public.posts add constraint posts_language_check
      check (language is null or char_length(language) <= 40);
  end if;
end $$;

-- Keyset feed indexes: (published_at, id) is the pagination key.
create index if not exists posts_feed_keyset_idx
  on public.posts (status, published_at desc, id desc);

create index if not exists posts_author_keyset_idx
  on public.posts (author_id, status, published_at desc, id desc);

create index if not exists post_topics_post_idx on public.post_topics (post_id);


-- ----------------------------------------------------------------------------
-- 3. Protect account status and role from browser writes
-- ----------------------------------------------------------------------------
-- RLS cannot restrict individual columns. A trigger is the reliable guard:
-- user-session updates may change profile facts but not privilege columns.
-- Service-role requests (JWT role = service_role) are allowed, which is what the
-- server finalize route uses when SUPABASE_SERVICE_ROLE_KEY is configured.
--
-- Also revoke column privileges as defence in depth. PostgREST checks table
-- privileges, so the trigger remains the authoritative control.

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text;
begin
  jwt_role := coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', null);
  if jwt_role = 'service_role' then
    return new;
  end if;

  if new.status is distinct from old.status or new.role is distinct from old.role then
    raise exception 'profile status and role are server-managed'
      using errcode = '42501';
  end if;

  return new;
end $$;

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();

revoke update (status, role) on public.profiles from anon, authenticated;


-- ----------------------------------------------------------------------------
-- 4. Notification types for mentions and reposts
-- ----------------------------------------------------------------------------
-- Review the existing constraint name/definition before applying. This block
-- recreates any check constraint on the type column and preserves the existing
-- trusted values.

do $$
declare
  existing record;
begin
  for existing in
    select conname
    from pg_constraint
    where conrelid = 'public.notifications'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%type%'
  loop
    execute format('alter table public.notifications drop constraint %I', existing.conname);
  end loop;

  alter table public.notifications add constraint notifications_type_check
    check (type in ('LIKE', 'COMMENT', 'REPLY', 'FOLLOW', 'NEW_POST', 'MENTION', 'REPOST', 'MODERATION'));
end $$;


-- ----------------------------------------------------------------------------
-- 5. Server-only email availability
-- ----------------------------------------------------------------------------
-- Never expose this to anon/authenticated: it would become an account-existence
-- oracle. Only the service role may execute it, and only from server code.

create or replace function public.email_available(candidate text)
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select not exists (
    select 1 from auth.users where lower(email) = lower(candidate)
  );
$$;

revoke all on function public.email_available(text) from public, anon, authenticated;
grant execute on function public.email_available(text) to service_role;


-- ----------------------------------------------------------------------------
-- 6. Verification queries to run after applying (read-only)
-- ----------------------------------------------------------------------------
-- select column_name, data_type from information_schema.columns
--   where table_schema = 'public' and table_name = 'profiles' order by ordinal_position;
-- select indexname from pg_indexes where schemaname = 'public' and tablename = 'profiles';
-- select tgname from pg_trigger where tgrelid = 'public.profiles'::regclass;
--
-- Two-account authorization checks (run as each authenticated user):
--   1. update profiles set status = 'ACTIVE' where id = auth.uid();  -- must fail
--   2. update profiles set headline = 'x' where id = auth.uid();     -- must succeed
--   3. update profiles set headline = 'x' where id = '<other user>'; -- zero rows
--   4. insert into posts (author_id, title, slug, status) values (auth.uid(), ...); -- own only
--   5. anon attempts must fail for every write above.
