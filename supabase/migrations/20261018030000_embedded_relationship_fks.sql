-- Migration: Embeddable author/post relationships
-- The app embeds profiles into posts/comments queries through PostgREST
-- (e.g. posts.select('…,profiles!inner(display_name)')), and post_saves
-- into saved-article queries. PostgREST can only resolve embedded
-- resources through real foreign keys, so these constraints are created
-- idempotently. Constraints are added NOT VALID first and validated
-- best-effort, so pre-existing orphan rows cannot block the migration;
-- PostgREST resolves NOT VALID relationships the same way.

-- 1. posts.author_id -> profiles.id (feed, dashboard author embeds)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where contype = 'f'
      and conrelid = 'public.posts'::regclass
      and confrelid = 'public.profiles'::regclass
      and conkey = array[(select attnum from pg_attribute where attrelid = 'public.posts'::regclass and attname = 'author_id')]
      and confkey = array[(select attnum from pg_attribute where attrelid = 'public.profiles'::regclass and attname = 'id')]
  ) then
    alter table public.posts
      add constraint posts_author_id_profile_fk
      foreign key (author_id) references public.profiles (id) on delete cascade
      not valid;
  end if;
  begin
    alter table public.posts validate constraint posts_author_id_profile_fk;
  exception when others then
    raise notice 'posts_author_id_profile_fk left unvalidated: %', sqlerrm;
  end;
end $$;

-- 2. comments.author_id -> profiles.id (article comment author embeds)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where contype = 'f'
      and conrelid = 'public.comments'::regclass
      and confrelid = 'public.profiles'::regclass
      and conkey = array[(select attnum from pg_attribute where attrelid = 'public.comments'::regclass and attname = 'author_id')]
      and confkey = array[(select attnum from pg_attribute where attrelid = 'public.profiles'::regclass and attname = 'id')]
  ) then
    alter table public.comments
      add constraint comments_author_id_profile_fk
      foreign key (author_id) references public.profiles (id) on delete cascade
      not valid;
  end if;
  begin
    alter table public.comments validate constraint comments_author_id_profile_fk;
  exception when others then
    raise notice 'comments_author_id_profile_fk left unvalidated: %', sqlerrm;
  end;
end $$;

-- 3. post_saves.post_id -> posts.id (saved library post embeds)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where contype = 'f'
      and conrelid = 'public.post_saves'::regclass
      and confrelid = 'public.posts'::regclass
      and conkey = array[(select attnum from pg_attribute where attrelid = 'public.post_saves'::regclass and attname = 'post_id')]
      and confkey = array[(select attnum from pg_attribute where attrelid = 'public.posts'::regclass and attname = 'id')]
  ) then
    alter table public.post_saves
      add constraint post_saves_post_id_fk
      foreign key (post_id) references public.posts (id) on delete cascade
      not valid;
  end if;
  begin
    alter table public.post_saves validate constraint post_saves_post_id_fk;
  exception when others then
    raise notice 'post_saves_post_id_fk left unvalidated: %', sqlerrm;
  end;
end $$;