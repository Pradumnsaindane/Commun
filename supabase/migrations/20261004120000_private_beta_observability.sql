create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null check (event_name in ('signup_completed','onboarding_completed','article_viewed','article_created','article_published','article_liked','article_saved','comment_created','discussion_created','reply_created','follow_created','notification_opened','report_created')),
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists product_events_name_created_idx on public.product_events (event_name, created_at desc);
create index if not exists product_events_user_created_idx on public.product_events (user_id, created_at desc);
alter table public.product_events enable row level security;
create policy product_events_insert_own on public.product_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy product_events_select_admin on public.product_events for select to authenticated using (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'ADMIN'));

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('BUG','FEATURE','CONFUSION','GENERAL')),
  message text not null check (char_length(message) between 10 and 2000),
  path text,
  created_at timestamptz not null default now()
);
create index if not exists beta_feedback_created_idx on public.beta_feedback (created_at desc);
alter table public.beta_feedback enable row level security;
create policy beta_feedback_insert_own on public.beta_feedback for insert to authenticated with check ((select auth.uid()) = user_id);
create policy beta_feedback_select_admin on public.beta_feedback for select to authenticated using (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'ADMIN'));

revoke all on public.product_events from anon;
revoke all on public.beta_feedback from anon;
grant insert, select on public.product_events to authenticated;
grant insert, select on public.beta_feedback to authenticated;
