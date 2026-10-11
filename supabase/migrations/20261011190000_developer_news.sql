-- Migration: Developer News and Saved News Schema
-- Adds support for real external developer news ingestion, deduplication, categorization, and bookmarks.

create table if not exists public.developer_news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 300),
  summary text not null default '',
  canonical_url text not null unique check (canonical_url ~* '^https?://'),
  source_name text not null check (char_length(source_name) between 2 and 100),
  source_domain text not null default '',
  published_at timestamptz not null,
  ingested_at timestamptz not null default now(),
  category text not null check (category in (
    'Artificial Intelligence and Machine Learning',
    'Web Development',
    'JavaScript and TypeScript',
    'Frontend Engineering',
    'Backend Engineering',
    'Cloud Computing',
    'DevOps and Platform Engineering',
    'Cybersecurity',
    'Databases',
    'Open Source',
    'Developer Tools',
    'System Design',
    'Programming Languages',
    'Engineering Careers'
  )),
  tags text[] not null default '{}'::text[],
  image_url text,
  score integer not null default 0
);

create index if not exists developer_news_published_idx on public.developer_news (published_at desc);
create index if not exists developer_news_category_published_idx on public.developer_news (category, published_at desc);

alter table public.developer_news enable row level security;

-- Public can read developer news
drop policy if exists developer_news_select_all on public.developer_news;
create policy developer_news_select_all on public.developer_news for select using (true);

-- Permissions
grant select on public.developer_news to anon, authenticated;

-- Saved news bookmarks
create table if not exists public.saved_news (
  user_id uuid not null references auth.users(id) on delete cascade,
  news_id uuid not null references public.developer_news(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, news_id)
);

create index if not exists saved_news_user_idx on public.saved_news (user_id, created_at desc);

alter table public.saved_news enable row level security;

drop policy if exists saved_news_own on public.saved_news;
create policy saved_news_own on public.saved_news for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, delete on public.saved_news to authenticated;
revoke all on public.saved_news from anon;
