-- PROPOSED SCHEMA FOR PHASE 3: COMMUN WORK MANAGEMENT AND COLLABORATION
-- Status: Proposed specification (Pending formal migration approval)
-- Note: Do NOT execute on production without explicit user authorization.

-- 1. Multi-tenant Workspaces
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  slug text not null unique check (slug ~* '^[a-z0-9-]+$'),
  organization_type text not null default 'BUSINESS_TEAM' check (
    organization_type in ('ENTERPRISE', 'BUSINESS_TEAM', 'ACADEMIC_INSTITUTION', 'INDIVIDUAL')
  ),
  owner_id uuid not null references auth.users(id) on delete cascade,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Workspace Members & Role-Based Access
create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'MEMBER' check (
    role in ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')
  ),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- 3. Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 200),
  description text not null default '',
  status text not null default 'ACTIVE' check (
    status in ('PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED')
  ),
  priority text not null default 'MEDIUM' check (
    priority in ('LOW', 'MEDIUM', 'HIGH', 'URGENT')
  ),
  owner_id uuid not null references auth.users(id) on delete set null,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null check (char_length(title) between 2 and 240),
  description text not null default '',
  status text not null default 'TODO' check (
    status in ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED')
  ),
  priority text not null default 'MEDIUM' check (
    priority in ('LOW', 'MEDIUM', 'HIGH', 'URGENT')
  ),
  assignee_id uuid references auth.users(id) on delete set null,
  creator_id uuid not null references auth.users(id) on delete cascade,
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Meetings & Meeting Notes
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 200),
  agenda text not null default '',
  notes text not null default '',
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes between 5 and 480),
  organizer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Meeting Bound Action Items
create table if not exists public.meeting_action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  assignee_id uuid references auth.users(id) on delete set null,
  description text not null check (char_length(description) between 2 and 500),
  status text not null default 'PENDING' check (status in ('PENDING', 'CONVERTED_TO_TASK', 'RESOLVED')),
  created_at timestamptz not null default now()
);

-- 7. Knowledge Base Documents (SOPs, Runbooks, ADRs)
create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 200),
  slug text not null,
  content text not null default '',
  category text not null default 'STANDARD' check (
    category in ('ARCHITECTURE', 'RUNBOOK', 'POLICY', 'ONBOARDING', 'STANDARD')
  ),
  author_id uuid not null references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

-- 8. Learning Tracks & Progress
create table if not exists public.learning_tracks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 200),
  description text not null default '',
  level text not null default 'INTERMEDIATE' check (level in ('FOUNDATIONAL', 'INTERMEDIATE', 'ADVANCED')),
  modules_count integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_enrollments (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.learning_tracks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  progress_percentage integer not null default 0 check (progress_percentage between 0 and 100),
  status text not null default 'IN_PROGRESS' check (status in ('ENROLLED', 'IN_PROGRESS', 'COMPLETED')),
  updated_at timestamptz not null default now(),
  unique (track_id, user_id)
);

-- Enable Row Level Security (RLS) across all proposed workspace tables
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_action_items enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.learning_tracks enable row level security;
alter table public.learning_enrollments enable row level security;

-- Base RLS Policy Example: Workspace Isolation
create policy workspace_members_read on public.workspaces
  for select using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = public.workspaces.id
      and wm.user_id = (select auth.uid())
    )
  );

