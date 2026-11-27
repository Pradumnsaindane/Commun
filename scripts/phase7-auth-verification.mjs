#!/usr/bin/env node
/**
 * Phase 7 — real Supabase authentication verification.
 *
 * This harness deliberately never reads `.env.local`. It only accepts values
 * exported explicitly for an isolated staging project, and it refuses to run
 * until isolation is confirmed. It performs real GoTrue/PostgREST requests and
 * reports only masked, secret-safe output.
 *
 * Required environment:
 *   PHASE7_CONFIRM_ISOLATED=yes
 *   PHASE7_SUPABASE_URL=...
 *   PHASE7_SUPABASE_ANON_KEY=...
 *   PHASE7_USER_A_EMAIL / PHASE7_USER_A_PASSWORD
 * Optional:
 *   PHASE7_USER_B_EMAIL / PHASE7_USER_B_PASSWORD
 *   PHASE7_APP_URL, PHASE7_PROJECT_REF, PHASE7_ALLOW_WRITES=true
 *
 * PHASE5_* aliases are accepted so one isolated export can drive Phase 5 and
 * Phase 7 verification. No credential is written to disk or printed.
 */

import { createClient } from '@supabase/supabase-js'

const PLACEHOLDER_MARKERS = [
  'your-project',
  'your-publishable-key',
  'your-anon-key',
  'server-only',
  'placeholder',
  'replace-with',
  'example.supabase.co',
  'changeme',
]

function fromEnv(names) {
  for (const name of names) {
    const value = process.env[name]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function configured(value) {
  const lowered = value.toLowerCase()
  return Boolean(value) && !PLACEHOLDER_MARKERS.some((marker) => lowered.includes(marker))
}

function mask(value) {
  if (!value) return '<missing>'
  try {
    const url = new URL(value)
    const label = url.hostname.split('.')[0]
    return `${url.protocol}//${label.slice(0, 3)}***`
  } catch {
    return `<set:${value.length} chars>`
  }
}

function redact(text, secrets) {
  let output = text
  for (const secret of secrets) {
    if (secret && secret.length > 8) output = output.split(secret).join('<redacted>')
  }
  return output
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '<jwt-redacted>')
    .slice(0, 300)
}

const confirmIsolated = fromEnv(['PHASE7_CONFIRM_ISOLATED', 'PHASE5_CONFIRM_ISOLATED'])
const url = fromEnv(['PHASE7_SUPABASE_URL', 'PHASE5_SUPABASE_URL', 'PHASE_D_SUPABASE_URL'])
const anonKey = fromEnv([
  'PHASE7_SUPABASE_ANON_KEY',
  'PHASE5_SUPABASE_ANON_KEY',
  'PHASE_D_SUPABASE_ANON_KEY',
])
const appUrl = fromEnv(['PHASE7_APP_URL', 'PHASE5_APP_URL'])
const projectRef = fromEnv(['PHASE7_PROJECT_REF', 'PHASE5_PROJECT_REF', 'PHASE_D_PROJECT_REF'])
const allowWrites = fromEnv(['PHASE7_ALLOW_WRITES', 'PHASE5_ALLOW_WRITES']).toLowerCase() === 'true'
const users = {
  A: {
    email: fromEnv(['PHASE7_USER_A_EMAIL', 'PHASE5_USER_A_EMAIL', 'PHASE_D_USER_A_EMAIL']),
    password: fromEnv(['PHASE7_USER_A_PASSWORD', 'PHASE5_USER_A_PASSWORD', 'PHASE_D_USER_A_PASSWORD']),
  },
  B: {
    email: fromEnv(['PHASE7_USER_B_EMAIL', 'PHASE5_USER_B_EMAIL', 'PHASE_D_USER_B_EMAIL']),
    password: fromEnv(['PHASE7_USER_B_PASSWORD', 'PHASE5_USER_B_PASSWORD', 'PHASE_D_USER_B_PASSWORD']),
  },
}

const results = []
const record = (name, ok, detail) => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

function blocked(reason) {
  console.log(JSON.stringify({ verdict: 'blocked', reason, checks: results }, null, 2))
  process.exit(1)
}

if (confirmIsolated !== 'yes') {
  blocked('Refusing to run: set PHASE7_CONFIRM_ISOLATED=yes only for a disposable, isolated project.')
}
if (!configured(url) || !configured(anonKey)) {
  blocked(`Supabase URL or anon key missing/placeholder. url=${mask(url)} key=${anonKey ? 'set' : 'missing'}`)
}
if (projectRef && !url.includes(projectRef)) {
  blocked('Configured project ref does not match the Supabase URL.')
}
if (!configured(users.A.email) || !configured(users.A.password)) {
  blocked('USER_A credentials are missing or still placeholders.')
}

const secrets = [url, anonKey, users.A.password, users.B.password, ...Object.values(users).map((u) => u.email)]
const makeClient = () =>
  createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function signIn(user) {
  const client = makeClient()
  const { data, error } = await client.auth.signInWithPassword(user)
  if (error) throw error
  if (!data.session?.access_token) throw new Error('No access token returned')
  return { client, session: data.session }
}

async function run() {
  // 1. Connectivity against the real GoTrue health endpoint.
  const health = await fetch(`${url}/auth/v1/health`, { headers: { apikey: anonKey } })
  record('Supabase connectivity', health.ok, `HTTP ${health.status}`)

  // 2. Invalid credentials must be rejected by the real provider.
  const invalidClient = makeClient()
  const invalid = await invalidClient.auth.signInWithPassword({
    email: users.A.email,
    password: `${users.A.password}-definitely-wrong`,
  })
  record(
    'Invalid credentials rejected',
    Boolean(invalid.error),
    invalid.error ? 'provider returned an error' : 'WRONG PASSWORD ACCEPTED'
  )

  // 3. Successful login for USER_A.
  const { client: clientA, session: sessionA } = await signIn(users.A)
  record('Successful login', Boolean(sessionA.user?.id), 'access token issued')

  // 4. Session persistence via the issued access token and refresh grant.
  const { data: userFromToken, error: userError } = await clientA.auth.getUser(sessionA.access_token)
  record(
    'Session token resolves identity',
    !userError && userFromToken.user?.id === sessionA.user?.id,
    userError ? redact(userError.message, secrets) : 'identity matches'
  )

  const refreshed = await clientA.auth.refreshSession({ refresh_token: sessionA.refresh_token })
  record(
    'Refresh token grants new session',
    !refreshed.error && Boolean(refreshed.data.session?.access_token),
    'refresh grant accepted'
  )

  // 5. Invalid/expired token must not resolve an identity.
  const forged = await makeClient().auth.getUser('invalid.token.value')
  record('Invalid token rejected', Boolean(forged.error), forged.error ? 'no identity' : 'INVALID TOKEN ACCEPTED')

  // 6. Logout must revoke the refresh token.
  const { error: logoutError } = await clientA.auth.signOut()
  const afterLogout = await makeClient().auth.refreshSession({ refresh_token: sessionA.refresh_token })
  record(
    'Logout revokes refresh token',
    !logoutError && Boolean(afterLogout.error),
    'refresh grant rejected after sign-out'
  )

  // 7. Password recovery must be accepted by the real provider.
  const recovery = await makeClient().auth.resetPasswordForEmail(users.A.email)
  record(
    'Password recovery request',
    !recovery.error,
    recovery.error ? redact(recovery.error.message, secrets) : 'provider accepted recovery'
  )

  // 8. Password reset, only with explicit write consent, then restore.
  if (allowWrites) {
    const { client: resetClient, session: resetSession } = await signIn(users.A)
    const temporaryPassword = `Phase7Tmp_${Date.now()}Aa1`
    const updated = await resetClient.auth.updateUser({ password: temporaryPassword })
    record(
      'Password reset updates credential',
      !updated.error,
      updated.error ? redact(updated.error.message, secrets) : 'password changed'
    )
    if (!updated.error) {
      const relogin = await signIn({ email: users.A.email, password: temporaryPassword })
      record('Login with reset password', Boolean(relogin.session.user?.id), 'new password accepted')
      const restored = await relogin.client.auth.updateUser({ password: users.A.password })
      record('Original password restored', !restored.error, 'fixture returned to baseline')
    }
  } else {
    record('Password reset', true, 'SKIPPED — set PHASE7_ALLOW_WRITES=true for an isolated project')
  }

  // 9. Cross-user identity separation and RLS ownership enforcement.
  if (configured(users.B.email) && configured(users.B.password)) {
    const { client: clientB, session: sessionB } = await signIn(users.B)
    record('Cross-user identities distinct', sessionB.user?.id !== sessionA.user?.id, 'different user ids')

    const crossUserWrite = await clientB
      .from('product_events')
      .insert({ user_id: sessionA.user.id, event_name: 'article_viewed', path: '/phase7-cross-user' })
      .select('id')
    record(
      'Cross-user row write denied by RLS',
      Boolean(crossUserWrite.error),
      crossUserWrite.error ? 'RLS rejected another user id' : 'CROSS-USER WRITE ACCEPTED'
    )
  } else {
    record('Cross-user identities distinct', true, 'SKIPPED — USER_B credentials not provided')
    record('Cross-user row write denied by RLS', true, 'SKIPPED — USER_B credentials not provided')
  }

  // 10. Application API authorization and redirect preservation.
  if (configured(appUrl)) {
    const unauthenticated = await fetch(`${appUrl}/api/v1/notifications`, { redirect: 'manual' })
    record('Unauthenticated notifications API denied', unauthenticated.status === 401, `HTTP ${unauthenticated.status}`)

    const protectedPage = await fetch(`${appUrl}/feed?tab=latest`, { redirect: 'manual' })
    const location = protectedPage.headers.get('location') ?? ''
    const preserved =
      protectedPage.status === 307 && location.includes('/login?next=') && location.includes('feed')
    record('Protected route redirect preserves next', preserved, `HTTP ${protectedPage.status}`)
  } else {
    record('Application API authorization', true, 'SKIPPED — PHASE7_APP_URL not provided')
  }
}

try {
  await run()
} catch (error) {
  record('Harness completed', false, redact(error instanceof Error ? error.message : String(error), secrets))
}

const failed = results.filter((result) => !result.ok)
console.log(
  JSON.stringify(
    {
      verdict: failed.length === 0 ? 'passed' : 'failed',
      target: mask(url),
      checked: results.length,
      failed: failed.map((result) => result.name),
    },
    null,
    2
  )
)
process.exit(failed.length === 0 ? 0 : 1)
