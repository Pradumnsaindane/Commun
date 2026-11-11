-- ============================================================================
-- PROPOSED MIGRATION — NOT APPLIED
-- Commun.dev Phase 1 social core
-- ============================================================================
--
-- This file is a proposal. It has NOT been applied to any database and must
-- not be executed until all of the following are true:
--
--   1. A read-only dump of the linked Supabase project has been reviewed
--      (tables, columns, constraints, indexes, policies, grants, triggers).
--   2. The base social tables referenced here (public.profiles, public.posts)
--      are confirmed to exist with the expected columns.
--   3. The migration has been rehearsed on a disposable preview project and
--      RLS has been tested with two separate accounts.
--   4. The repository owner has explicitly approved applying it to a named
--      environment.
--
-- Safety properties of this file:
--   * No table, column, row, or grant is removed, and no existing policy is
--     weakened. `drop policy if exists` only re-creates policies proposed here.
--   * No data is deleted, truncated, or backfilled destructively.
--   * All statements are idempotent so an interrupted apply can be re-run.
--   * New tables default to RLS enabled with explicit policies.
--   * Ownership is always derived from auth.uid() — never from request fields.
--
-- NOT included here (requires separate design/approval): communities,
-- messaging, projects showcase, jobs, services, payouts, imports, blocks,
-- notification preferences, and any change to existing RLS policies.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Post types and social post metadata
-- ----------------------------------------------------------------------------
-- Existing content stays valid: every current row is an ARTICLE.
-- Adding a NOT NULL column with a constant default is metadata-only on
-- PostgreSQL 11+, so this does not rewrite the existing posts table.

alter table public.posts
  add column if not exists post_type text not null default 'ARTICLE';

alter table public.posts
  add column if not exists language text;

alter table public.posts
  add column if not exists link_url text;

alter table public.posts
  add column if not exists repo_url text;

alter table public.posts
  add column if not exists edited_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'posts_post_type_check'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_post_type_check
      check (post_type in ('ARTICLE', 'POST', 'SNIPPET'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'posts_link_url_check'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_link_url_check
      check (link_url is null or link_url ~* '^https?://');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'posts_repo_url_check'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_repo_url_check
      check (repo_url is null or repo_url ~* '^https://');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'posts_language_check'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_language_check
      check (language is null or char_length(language) <= 40);
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 2. Post media
-- ----------------------------------------------------------------------------
-- Rows reference a storage object; the public page requests a signed URL.
-- Alt text is required so media is usable by assistive technology.

create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('IMAGE', 'VIDEO')),
  alt_text text not null default '' check (char_length(alt_text) <= 300),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (post_id, position)
);

create index if not exists post_media_post_idx
  on public.post_media (post_id, position);

alter table public.post_media enable row level security;

drop policy if exists post_media_select_visible on public.post_media;
create policy post_media_select_visible on public.post_media
  for select
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_media.post_id
        and (p.status = 'PUBLISHED' or p.author_id = (select auth.uid()))
    )
  );

drop policy if exists post_media_insert_owner on public.post_media;
create policy post_media_insert_owner on public.post_media
  for insert to authenticated
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_media.post_id
        and p.author_id = (select auth.uid())
    )
  );

drop policy if exists post_media_delete_owner on public.post_media;
create policy post_media_delete_owner on public.post_media
  for delete to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_media.post_id
        and p.author_id = (select auth.uid())
    )
  );

grant select on public.post_media to anon, authenticated;
grant insert, delete on public.post_media to authenticated;


-- ----------------------------------------------------------------------------
-- 3. Reposts and quote reposts
-- ----------------------------------------------------------------------------
-- A quote repost stores optional commentary on the original post. The original
-- post is never duplicated, so attribution and deletion stay correct.

create table if not exists public.post_reposts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  quote text check (quote is null or char_length(quote) between 1 and 500),
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists post_reposts_post_idx
  on public.post_reposts (post_id, created_at desc);

alter table public.post_reposts enable row level security;

drop policy if exists post_reposts_select_visible on public.post_reposts;
create policy post_reposts_select_visible on public.post_reposts
  for select
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.posts p
      where p.id = post_reposts.post_id
        and p.status = 'PUBLISHED'
    )
  );

drop policy if exists post_reposts_insert_own on public.post_reposts;
create policy post_reposts_insert_own on public.post_reposts
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.posts p
      where p.id = post_reposts.post_id
        and p.status = 'PUBLISHED'
    )
  );

drop policy if exists post_reposts_delete_own on public.post_reposts;
create policy post_reposts_delete_own on public.post_reposts
  for delete to authenticated
  using (user_id = (select auth.uid()));

grant select on public.post_reposts to anon, authenticated;
grant insert, delete on public.post_reposts to authenticated;


-- ----------------------------------------------------------------------------
-- 4. Developer profile fields
-- ----------------------------------------------------------------------------
-- Visibility/recruiter fields are intentionally deferred to the careers phase,
-- where their RLS can be designed and tested as one model.

alter table public.profiles
  add column if not exists headline text;

alter table public.profiles
  add column if not exists location text;

alter table public.profiles
  add column if not exists cover_image_path text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_headline_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_headline_check
      check (headline is null or char_length(headline) <= 120);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_location_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_location_check
      check (location is null or char_length(location) <= 120);
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 5. Skills, experience, education
-- ----------------------------------------------------------------------------
-- These are user-authored professional facts. Nothing here is imported or
-- verified until the integrations phase adds an explicit verification source.

create table if not exists public.user_skills (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill text not null check (char_length(skill) between 1 and 40),
  created_at timestamptz not null default now(),
  primary key (user_id, skill)
);

create index if not exists user_skills_skill_idx
  on public.user_skills (lower(skill));

alter table public.user_skills enable row level security;

drop policy if exists user_skills_select_public on public.user_skills;
create policy user_skills_select_public on public.user_skills
  for select using (true);

drop policy if exists user_skills_write_own on public.user_skills;
create policy user_skills_write_own on public.user_skills
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select on public.user_skills to anon, authenticated;
grant insert, update, delete on public.user_skills to authenticated;


create table if not exists public.user_experience (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company text not null check (char_length(company) between 1 and 120),
  title text not null check (char_length(title) between 1 and 120),
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text check (description is null or char_length(description) <= 2000),
  created_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date),
  check (not is_current or end_date is null)
);

create index if not exists user_experience_user_idx
  on public.user_experience (user_id, start_date desc);

alter table public.user_experience enable row level security;

drop policy if exists user_experience_select_public on public.user_experience;
create policy user_experience_select_public on public.user_experience
  for select using (true);

drop policy if exists user_experience_write_own on public.user_experience;
create policy user_experience_write_own on public.user_experience
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select on public.user_experience to anon, authenticated;
grant insert, update, delete on public.user_experience to authenticated;


create table if not exists public.user_education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  institution text not null check (char_length(institution) between 1 and 160),
  program text,
  start_year integer check (start_year is null or start_year between 1950 and 2100),
  end_year integer check (end_year is null or end_year between 1950 and 2100),
  created_at timestamptz not null default now(),
  check (end_year is null or start_year is null or end_year >= start_year)
);

create index if not exists user_education_user_idx
  on public.user_education (user_id, end_year desc);

alter table public.user_education enable row level security;

drop policy if exists user_education_select_public on public.user_education;
create policy user_education_select_public on public.user_education
  for select using (true);

drop policy if exists user_education_write_own on public.user_education;
create policy user_education_write_own on public.user_education
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select on public.user_education to anon, authenticated;
grant insert, update, delete on public.user_education to authenticated;


-- ----------------------------------------------------------------------------
-- 6. Feed and discovery indexes
-- ----------------------------------------------------------------------------
-- Index if not exists only checks the name. Review the live index list first to
-- avoid duplicating an equivalent index under a different name.

create index if not exists posts_feed_idx
  on public.posts (status, published_at desc);

create index if not exists posts_author_feed_idx
  on public.posts (author_id, status, published_at desc);

create index if not exists post_likes_post_idx
  on public.post_likes (post_id);

create index if not exists post_saves_post_idx
  on public.post_saves (post_id);

create index if not exists comments_post_created_idx
  on public.comments (post_id, created_at);

create index if not exists follows_follower_idx
  on public.follows (follower_id);

create index if not exists follows_following_idx
  on public.follows (following_id);


-- ----------------------------------------------------------------------------
-- 7. Media storage bucket (review before applying)
-- ----------------------------------------------------------------------------
-- Private bucket. The app must issue short-lived signed URLs and validate
-- MIME type, size, and dimensions server-side before upload.
--
-- The storage policies below assume the standard Supabase convention that the
-- first path segment is the uploader's user id:
--   post-media/<user_id>/<random>.<ext>

insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', false)
on conflict (id) do nothing;

drop policy if exists post_media_storage_select_own on storage.objects;
create policy post_media_storage_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists post_media_storage_insert_own on storage.objects;
create policy post_media_storage_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists post_media_storage_delete_own on storage.objects;
create policy post_media_storage_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );


-- ----------------------------------------------------------------------------
-- 8. Follow-up work NOT covered by this migration
-- ----------------------------------------------------------------------------
-- * Server-side onboarding finalization that sets profiles.status = 'ACTIVE'.
--   The current client-side write must be removed and the column protected by
--   policy so users cannot self-activate.
-- * Unique constraint and case-insensitive index on profiles.username if the
--   live schema does not already enforce it (verify before adding, because
--   duplicate usernames may exist).
-- * pg_trgm/tsvector search functions and indexes.
-- * user_blocks, notification preferences, communities, messaging, projects,
--   jobs, services, and financial objects.
