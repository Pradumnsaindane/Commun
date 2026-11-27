-- Phase 11C: deterministic local-only seed data.
--
-- Loaded by `supabase db reset` after all migrations. These identities exist
-- ONLY in the disposable local stack. Never run this file against staging or
-- production. Passwords are intentionally written in plaintext in comments
-- for local test operators; they are test-only credentials.
--
--   user A: alice@local.commun.test  / LocalTest123!
--   user B: bob@local.commun.test   / LocalTest123!

-- ---------------------------------------------------------------------------
-- Auth users (confirmed email, password login)
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at,
  recovery_token, recovery_sent_at, email_change_token_new, email_change,
  email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at, phone, phone_confirmed_at,
  phone_change, phone_change_token, phone_change_sent_at,
  email_change_token_current, email_change_confirm_status, banned_until,
  reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at,
  is_anonymous
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'alice@local.commun.test',
    crypt('LocalTest123!', gen_salt('bf')),
    now(), null, '', null, '', null, '', '', null, now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    false, now(), now(), null, null, '', '', null, '', 0, null, '', null,
    false, null, false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'bob@local.commun.test',
    crypt('LocalTest123!', gen_salt('bf')),
    now(), null, '', null, '', null, '', '', null, now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    false, now(), now(), null, null, '', '', null, '', 0, null, '', null,
    false, null, false
  )
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at,
  created_at, updated_at
)
values
  (
    '11111111-1111-4111-8111-111111111101',
    '11111111-1111-4111-8111-111111111111',
    '{"sub":"11111111-1111-4111-8111-111111111111","email":"alice@local.commun.test"}'::jsonb,
    'email', '11111111-1111-4111-8111-111111111111', now(), now(), now()
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    '22222222-2222-4222-8222-222222222222',
    '{"sub":"22222222-2222-4222-8222-222222222222","email":"bob@local.commun.test"}'::jsonb,
    'email', '22222222-2222-4222-8222-222222222222', now(), now(), now()
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Profiles (statuses are server-managed in production; seeded directly here)
-- ---------------------------------------------------------------------------

insert into public.profiles (
  id, display_name, username, bio, role, status, onboarding_completed
)
values
  (
    '11111111-1111-4111-8111-111111111111', 'Alice Local', 'alice-local',
    'Local seed user A.', 'USER', 'ACTIVE', true
  ),
  (
    '22222222-2222-4222-8222-222222222222', 'Bob Local', 'bob-local',
    'Local seed user B.', 'USER', 'ACTIVE', true
  )
on conflict (id) do nothing;

insert into public.topics (id, name, slug, description)
values (
  '33333333-3333-4333-8333-333333333333', 'Local Testing', 'local-testing',
  'Seed topic for local Phase 11 verification.'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Ownership-scoped content for two-user RLS isolation checks
-- ---------------------------------------------------------------------------

insert into public.posts (
  id, author_id, title, slug, excerpt, body, status, access_level,
  reading_time_minutes, published_at, post_type
)
values
  (
    '44444444-4444-4444-8444-444444444441',
    '11111111-1111-4111-8111-111111111111',
    'Alice public post', 'alice-public-post', 'Visible to everyone.',
    'Local seed content owned by Alice.', 'PUBLISHED', 'FREE', 1, now(), 'ARTICLE'
  ),
  (
    '44444444-4444-4444-8444-444444444442',
    '11111111-1111-4111-8111-111111111111',
    'Alice private draft', 'alice-private-draft', 'Owner-only draft.',
    'This draft must be invisible to Bob.', 'DRAFT', 'FREE', 1, null, 'ARTICLE'
  ),
  (
    '44444444-4444-4444-8444-444444444443',
    '22222222-2222-4222-8222-222222222222',
    'Bob public post', 'bob-public-post', 'Visible to everyone.',
    'Local seed content owned by Bob.', 'PUBLISHED', 'FREE', 1, now(), 'ARTICLE'
  )
on conflict (id) do nothing;

insert into public.comments (id, post_id, author_id, content)
values (
  '55555555-5555-4555-8555-555555555551',
  '44444444-4444-4444-8444-444444444441',
  '22222222-2222-4222-8222-222222222222',
  'Bob commenting on Alice public post.'
)
on conflict (id) do nothing;

insert into public.notifications (
  id, recipient_id, actor_id, type, entity_id, target_slug, target_title
)
values (
  '66666666-6666-4666-8666-666666666661',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  'COMMENT',
  '44444444-4444-4444-8444-444444444441',
  'alice-public-post', 'Alice public post'
)
on conflict (id) do nothing;
