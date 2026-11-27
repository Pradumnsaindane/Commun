-- Phase 8 baseline: version-controlled reconstruction of the core social schema.
--
-- This migration is intentionally dated before the existing additive
-- migrations because those migrations alter `posts`, `comments` and
-- `post_saves`. It is written idempotently so it is safe to apply to an
-- environment that already contains equivalent tables.
--
-- Column types were reconstructed from application queries and the existing
-- proposals. A read-only production catalog dump is still required before
-- treating this as production-equivalent.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Commun member',
  username text,
  bio text,
  avatar_url text,
  website text,
  github text,
  interests text[] not null default '{}',
  role text not null default 'USER' check (role in ('USER', 'MODERATOR', 'ADMIN')),
  status text not null default 'PENDING_VERIFICATION' check (status in (
    'PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'DELETED'
  )),
  onboarding_completed boolean not null default false,
  headline text check (headline is null or char_length(headline) <= 120),
  location text check (location is null or char_length(location) <= 120),
  cover_image_path text,
  portfolio_url text,
  skills text[] not null default '{}',
  technologies text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username)) where username is not null;

alter table public.profiles enable row level security;

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles
  for select to anon, authenticated using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

-- Privilege columns are server-managed. Column grants are the first boundary;
-- the trigger also blocks privileged writes made through a table-wide grant.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  claims text := nullif(current_setting('request.jwt.claims', true), '');
begin
  -- This function is SECURITY DEFINER, so current_user is always its owner.
  -- session_user preserves the caller: direct postgres maintenance is allowed,
  -- but PostgREST sessions (session_user = authenticator) are not.
  if session_user in ('postgres', 'supabase_admin') then
    return new;
  end if;
  if claims is not null and (claims::jsonb ->> 'role') = 'service_role' then
    return new;
  end if;
  if new.role is distinct from old.role or new.status is distinct from old.status then
    raise exception 'Profile role and status are server-managed.';
  end if;
  return new;
end $$;

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();

revoke update (role, status) on public.profiles from anon, authenticated;
grant update (role, status) on public.profiles to service_role;

-- ---------------------------------------------------------------------------
-- Posts, topics and taxonomy
-- ---------------------------------------------------------------------------

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  description text,
  created_at timestamptz not null default now()
);

create unique index if not exists topics_name_lower_unique
  on public.topics (lower(name));

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null,
  excerpt text,
  body text not null default '',
  cover_image_path text,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED', 'REMOVED')),
  access_level text not null default 'FREE' check (access_level in ('FREE', 'MEMBERS')),
  reading_time_minutes integer not null default 1,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  post_type text not null default 'ARTICLE' check (post_type in ('ARTICLE', 'POST', 'SNIPPET', 'LINK')),
  language text check (language is null or char_length(language) <= 40),
  link_url text check (link_url is null or link_url ~* '^https?://'),
  repo_url text check (repo_url is null or repo_url ~* '^https://'),
  edited_at timestamptz
);

create unique index if not exists posts_slug_unique on public.posts (slug);
create index if not exists posts_author_created_idx on public.posts (author_id, created_at desc);
create index if not exists posts_status_published_idx on public.posts (status, published_at desc);

alter table public.topics enable row level security;
alter table public.posts enable row level security;

drop policy if exists topics_select_public on public.topics;
create policy topics_select_public on public.topics
  for select to anon, authenticated using (true);

-- The membership table is created by a later additive migration. A security
-- definer function defers the lookup until query time, so this baseline can be
-- applied first without a forward reference.
create or replace function public.has_active_membership(creator uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return exists (
    select 1 from public.memberships m
    where m.subscriber_id = (select auth.uid())
      and m.creator_id = creator
      and m.status = 'active'
  );
end $$;

revoke all on function public.has_active_membership(uuid) from public;
grant execute on function public.has_active_membership(uuid) to anon, authenticated;

-- Published free posts are public. Members-only posts require an active
-- subscription to the author. Authors and moderators can always see their own
-- drafts and removed posts.
drop policy if exists posts_select_visible on public.posts;
create policy posts_select_visible on public.posts
  for select to anon, authenticated
  using (
    (select auth.uid()) = author_id
    or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('MODERATOR', 'ADMIN')
    or (
      status = 'PUBLISHED'
      and (access_level = 'FREE' or public.has_active_membership(author_id))
    )
  );

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own on public.posts
  for insert to authenticated with check ((select auth.uid()) = author_id);

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own on public.posts
  for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own on public.posts
  for delete to authenticated using ((select auth.uid()) = author_id);

grant select on public.topics to anon, authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select on public.posts to anon;

create table if not exists public.post_topics (
  post_id uuid not null references public.posts(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  primary key (post_id, topic_id)
);

alter table public.post_topics enable row level security;

drop policy if exists post_topics_select_public on public.post_topics;
create policy post_topics_select_public on public.post_topics
  for select to anon, authenticated using (true);

drop policy if exists post_topics_write_own on public.post_topics;
create policy post_topics_write_own on public.post_topics
  for all to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())))
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));

grant select on public.post_topics to anon, authenticated;
grant insert, delete on public.post_topics to authenticated;

-- ---------------------------------------------------------------------------
-- Interactions
-- ---------------------------------------------------------------------------

create table if not exists public.post_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.post_saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

alter table public.post_likes enable row level security;
alter table public.post_saves enable row level security;
alter table public.follows enable row level security;

drop policy if exists post_likes_own on public.post_likes;
create policy post_likes_own on public.post_likes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists post_saves_own on public.post_saves;
create policy post_saves_own on public.post_saves
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists follows_own on public.follows;
create policy follows_own on public.follows
  for all to authenticated
  using ((select auth.uid()) in (follower_id, following_id))
  with check ((select auth.uid()) = follower_id);

grant select, insert, delete on public.post_likes to authenticated;
grant select, insert, delete on public.post_saves to authenticated;
grant select, insert, delete on public.follows to authenticated;

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  pinned boolean not null default false,
  is_removed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_post_created_idx on public.comments (post_id, created_at);

alter table public.comments enable row level security;

drop policy if exists comments_select_visible on public.comments;
create policy comments_select_visible on public.comments
  for select to anon, authenticated
  using (
    not is_removed
    or (select auth.uid()) = author_id
    or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('MODERATOR', 'ADMIN')
  );

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments
  for insert to authenticated with check ((select auth.uid()) = author_id);

drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments
  for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments
  for delete to authenticated using ((select auth.uid()) = author_id);

grant select on public.comments to anon, authenticated;
grant insert, update, delete on public.comments to authenticated;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in (
    'LIKE', 'COMMENT', 'REPLY', 'FOLLOW', 'NEW_POST', 'MENTION', 'REPOST', 'MODERATION'
  )),
  entity_id uuid,
  target_slug text,
  target_title text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);
-- Application upserts use these exact columns as the conflict target. A plain
-- column index is required; expression indexes cannot be named in ON CONFLICT.
create unique index if not exists notifications_dedup_unique
  on public.notifications (recipient_id, actor_id, type, entity_id);

alter table public.notifications enable row level security;

drop policy if exists notifications_recipient_read on public.notifications;
create policy notifications_recipient_read on public.notifications
  for select to authenticated using ((select auth.uid()) = recipient_id);

drop policy if exists notifications_actor_insert on public.notifications;
create policy notifications_actor_insert on public.notifications
  for insert to authenticated with check ((select auth.uid()) = actor_id);

drop policy if exists notifications_recipient_update on public.notifications;
create policy notifications_recipient_update on public.notifications
  for update to authenticated
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);

drop policy if exists notifications_recipient_delete on public.notifications;
create policy notifications_recipient_delete on public.notifications
  for delete to authenticated using ((select auth.uid()) = recipient_id);

grant select, insert, update, delete on public.notifications to authenticated;

alter table public.notifications replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Reports and moderation
-- ---------------------------------------------------------------------------

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('POST', 'COMMENT', 'DISCUSSION', 'REPLY', 'PROFILE')),
  target_id uuid not null,
  reason text not null check (reason in (
    'SPAM', 'HARASSMENT', 'ABUSE', 'MISINFORMATION', 'COPYRIGHT', 'MALICIOUS_CONTENT', 'OTHER'
  )),
  description text,
  status text not null default 'OPEN' check (status in ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED')),
  assigned_to uuid references public.profiles(id),
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists reports_reporter_read on public.reports;
create policy reports_reporter_read on public.reports
  for select to authenticated
  using (
    (select auth.uid()) = reporter_id
    or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('MODERATOR', 'ADMIN')
  );

drop policy if exists reports_reporter_insert on public.reports;
create policy reports_reporter_insert on public.reports
  for insert to authenticated with check ((select auth.uid()) = reporter_id);

drop policy if exists reports_moderator_update on public.reports;
create policy reports_moderator_update on public.reports
  for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') in ('MODERATOR', 'ADMIN'))
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') in ('MODERATOR', 'ADMIN'));

drop policy if exists audit_logs_admin_read on public.audit_logs;
create policy audit_logs_admin_read on public.audit_logs
  for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

grant select, insert on public.reports to authenticated;
grant update on public.reports to authenticated;
grant select on public.audit_logs to authenticated;
revoke insert, update, delete on public.audit_logs from anon, authenticated;
grant insert, update, delete on public.audit_logs to service_role;

-- ---------------------------------------------------------------------------
-- Discussions and replies
-- ---------------------------------------------------------------------------

create table if not exists public.discussions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  content text not null,
  is_pinned boolean not null default false,
  is_closed boolean not null default false,
  is_removed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.replies(id) on delete cascade,
  depth integer not null default 0 check (depth between 0 and 2),
  content text not null,
  is_solution boolean not null default false,
  is_removed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists discussions_created_idx on public.discussions (created_at desc);
create index if not exists replies_discussion_created_idx on public.replies (discussion_id, created_at);

alter table public.discussions enable row level security;
alter table public.replies enable row level security;

drop policy if exists discussions_select_visible on public.discussions;
create policy discussions_select_visible on public.discussions
  for select to anon, authenticated
  using (
    not is_removed
    or (select auth.uid()) = author_id
    or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('MODERATOR', 'ADMIN')
  );

drop policy if exists discussions_write_own on public.discussions;
create policy discussions_write_own on public.discussions
  for all to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

drop policy if exists replies_select_visible on public.replies;
create policy replies_select_visible on public.replies
  for select to anon, authenticated
  using (
    not is_removed
    or (select auth.uid()) = author_id
    or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('MODERATOR', 'ADMIN')
  );

drop policy if exists replies_write_own on public.replies;
create policy replies_write_own on public.replies
  for all to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

grant select on public.discussions, public.replies to anon, authenticated;
grant insert, update, delete on public.discussions, public.replies to authenticated;

-- ---------------------------------------------------------------------------
-- Proposed social extensions, reconciled into one authoritative definition
-- ---------------------------------------------------------------------------

create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('IMAGE', 'VIDEO')),
  alt_text text not null default '' check (char_length(alt_text) <= 300),
  width integer check (width > 0),
  height integer check (height > 0),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (post_id, position)
);

create table if not exists public.post_reposts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  quote text check (quote is null or char_length(quote) between 1 and 500),
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.user_skills (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill text not null check (char_length(skill) between 1 and 40),
  created_at timestamptz not null default now(),
  primary key (user_id, skill)
);

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
  constraint user_experience_dates check (end_date is null or start_date is null or end_date >= start_date),
  constraint user_experience_current check (not is_current or end_date is null)
);

create table if not exists public.user_education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  institution text not null check (char_length(institution) between 1 and 160),
  program text,
  start_year integer check (start_year between 1950 and 2100),
  end_year integer check (end_year between 1950 and 2100),
  created_at timestamptz not null default now(),
  constraint user_education_years check (end_year is null or start_year is null or end_year >= start_year)
);

alter table public.post_media enable row level security;
alter table public.post_reposts enable row level security;
alter table public.user_skills enable row level security;
alter table public.user_experience enable row level security;
alter table public.user_education enable row level security;

drop policy if exists post_media_select_visible on public.post_media;
create policy post_media_select_visible on public.post_media
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and (p.status = 'PUBLISHED' or p.author_id = (select auth.uid()))
    )
  );

drop policy if exists post_media_write_own on public.post_media;
create policy post_media_write_own on public.post_media
  for all to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())))
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));

drop policy if exists post_reposts_select_visible on public.post_reposts;
create policy post_reposts_select_visible on public.post_reposts
  for select to anon, authenticated
  using (
    (select auth.uid()) = user_id
    or exists (select 1 from public.posts p where p.id = post_id and p.status = 'PUBLISHED')
  );

drop policy if exists post_reposts_write_own on public.post_reposts;
create policy post_reposts_write_own on public.post_reposts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists user_skills_select_public on public.user_skills;
create policy user_skills_select_public on public.user_skills
  for select to anon, authenticated using (true);

drop policy if exists user_skills_write_own on public.user_skills;
create policy user_skills_write_own on public.user_skills
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists user_experience_select_public on public.user_experience;
create policy user_experience_select_public on public.user_experience
  for select to anon, authenticated using (true);

drop policy if exists user_experience_write_own on public.user_experience;
create policy user_experience_write_own on public.user_experience
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists user_education_select_public on public.user_education;
create policy user_education_select_public on public.user_education
  for select to anon, authenticated using (true);

drop policy if exists user_education_write_own on public.user_education;
create policy user_education_write_own on public.user_education
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select on public.post_media, public.post_reposts to anon, authenticated;
grant insert, update, delete on public.post_media, public.post_reposts to authenticated;
grant select on public.user_skills, public.user_experience, public.user_education to anon, authenticated;
grant insert, update, delete on public.user_skills, public.user_experience, public.user_education to authenticated;

-- ---------------------------------------------------------------------------
-- Storage buckets and path-scoped policies
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('post-media', 'post-media', false)
on conflict (id) do nothing;

drop policy if exists avatar_storage_select_public on storage.objects;
create policy avatar_storage_select_public on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists avatar_storage_write_own on storage.objects;
create policy avatar_storage_write_own on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists post_media_storage_select_own on storage.objects;
create policy post_media_storage_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists post_media_storage_write_own on storage.objects;
create policy post_media_storage_write_own on storage.objects
  for all to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
