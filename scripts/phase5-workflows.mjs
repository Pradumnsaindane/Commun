#!/usr/bin/env node
/**
 * Phase 5 authenticated workflow harness.
 *
 * Executes real user journeys against an isolated staging deployment and a
 * disposable Supabase project. It refuses to run without explicit isolation and
 * write confirmation, uses unique fixtures, verifies cross-user denial, and
 * removes the fixtures it created with the service-role client.
 *
 * Required environment:
 *
 *   PHASE5_CONFIRM_ISOLATED=yes
 *   PHASE5_ALLOW_WRITES=true
 *   PHASE5_APP_URL=http://localhost:3000
 *   PHASE5_PROJECT_REF=<20-character project ref>
 *   PHASE5_SUPABASE_URL=https://<ref>.supabase.co
 *   PHASE5_SUPABASE_ANON_KEY=...
 *   PHASE5_SUPABASE_SERVICE_ROLE_KEY=...
 *   PHASE5_USER_A_EMAIL=... PHASE5_USER_A_PASSWORD=...
 *   PHASE5_USER_B_EMAIL=... PHASE5_USER_B_PASSWORD=...
 *   PHASE5_MODERATOR_EMAIL=... PHASE5_MODERATOR_PASSWORD=...
 *   PHASE5_ADMIN_EMAIL=... PHASE5_ADMIN_PASSWORD=...
 *
 * PHASE_D_* aliases are accepted for the Supabase values and the four accounts.
 *
 * Exit codes:
 *   0  all executed workflow checks passed
 *   1  configuration missing or unsafe target
 *   2  connectivity or sign-in failure
 *   3  one or more workflow assertions failed
 *
 * No keys, emails, user ids, post ids, or row contents are printed.
 */

import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match || process.env[match[1]] !== undefined) continue
    let value = match[2]
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[match[1]] = value
  }
}

const PLACEHOLDER_MARKERS = [
  'your-project',
  'your-publishable-key',
  'your-anon-key',
  'server-only-service-role-key',
  'replace-with',
]

function configured(value) {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false
  const lowered = trimmed.toLowerCase()
  return !PLACEHOLDER_MARKERS.some((marker) => lowered.includes(marker))
}

function firstConfigured(...names) {
  for (const name of names) {
    if (configured(process.env[name])) return process.env[name]
  }
  return undefined
}

function normalizeUrl(value) {
  try {
    return new URL(value).origin.toLowerCase()
  } catch {
    return null
  }
}

function maskedHost(value) {
  try {
    const parsed = new URL(value)
    const [first, ...rest] = parsed.hostname.split('.')
    return `${parsed.protocol}//${first.slice(0, 2)}***.${rest.join('.')}`
  } catch {
    return '<invalid-url>'
  }
}

function sanitize(value, max = 200) {
  if (value === undefined || value === null) return value
  let text = String(value)
  text = text.replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '<jwt-redacted>')
  text = text.replace(/sb_(publishable|secret)_[A-Za-z0-9_-]+/g, 'sb_$1_<redacted>')
  return text.slice(0, max)
}

const confirmed =
  process.env.PHASE5_CONFIRM_ISOLATED === 'yes' || process.env.PHASE_D_CONFIRM_ISOLATED === 'yes'
const allowWrites =
  process.env.PHASE5_ALLOW_WRITES === 'true' || process.env.PHASE_D_ALLOW_WRITES === 'true'
const appUrl = (firstConfigured('PHASE5_APP_URL') ?? 'http://localhost:3000').replace(/\/+$/, '')
const url = firstConfigured('PHASE5_SUPABASE_URL', 'PHASE_D_SUPABASE_URL')
const anon = firstConfigured('PHASE5_SUPABASE_ANON_KEY', 'PHASE_D_SUPABASE_ANON_KEY')
const service = firstConfigured(
  'PHASE5_SUPABASE_SERVICE_ROLE_KEY',
  'PHASE_D_SUPABASE_SERVICE_ROLE_KEY'
)
const projectRef = firstConfigured('PHASE5_PROJECT_REF', 'PHASE_D_PROJECT_REF')

const accounts = [
  { key: 'USER_A', role: 'USER' },
  { key: 'USER_B', role: 'USER' },
  { key: 'MODERATOR', role: 'MODERATOR' },
  { key: 'ADMIN', role: 'ADMIN' },
].map(({ key, role }) => ({
  key,
  role,
  email: firstConfigured(`PHASE5_${key}_EMAIL`, `PHASE_D_${key}_EMAIL`),
  password: firstConfigured(`PHASE5_${key}_PASSWORD`, `PHASE_D_${key}_PASSWORD`),
}))

const checks = []
const runId = `phase5-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const marker = `Phase 5 verification ${runId}`

function record(name, status, detail) {
  checks.push({ name, status, detail })
}

function expect(name, condition, detail) {
  record(name, condition ? 'pass' : 'fail', detail)
}

function expectStatus(name, result, allowed) {
  const ok = allowed.includes(result.status)
  record(name, ok ? 'pass' : 'fail', `http=${result.status}`)
  return ok
}

function summarize() {
  return {
    passed: checks.filter((entry) => entry.status === 'pass').length,
    failed: checks.filter((entry) => entry.status === 'fail').length,
    skipped: checks.filter((entry) => entry.status === 'skip').length,
  }
}

function emit(verdict, reason, exitCode) {
  console.log(
    JSON.stringify(
      {
        mode: 'phase5-authenticated-workflows',
        target: {
          app: appUrl,
          supabase: url ? maskedHost(url) : null,
          writes: allowWrites,
        },
        checks,
        summary: summarize(),
        verdict,
        ...(reason ? { reason } : {}),
      },
      null,
      2
    )
  )
  process.exitCode = exitCode
}

function blocked(reason, exitCode = 1) {
  emit('blocked', reason, exitCode)
}

function guard() {
  if (!confirmed) return 'Refusing to run: set PHASE5_CONFIRM_ISOLATED=yes only for a disposable staging environment.'
  if (!allowWrites) return 'Refusing to run: set PHASE5_ALLOW_WRITES=true for the isolated workflow fixtures.'
  const missing = []
  if (!url) missing.push('PHASE5_SUPABASE_URL')
  if (!anon) missing.push('PHASE5_SUPABASE_ANON_KEY')
  if (!service) missing.push('PHASE5_SUPABASE_SERVICE_ROLE_KEY')
  if (!projectRef) missing.push('PHASE5_PROJECT_REF')
  for (const account of accounts) {
    if (!account.email) missing.push(`PHASE5_${account.key}_EMAIL`)
    if (!account.password) missing.push(`PHASE5_${account.key}_PASSWORD`)
  }
  if (missing.length) return `Missing or placeholder values: ${missing.join(', ')}.`
  if (!/^[a-z0-9]{20}$/.test(projectRef)) {
    return 'PHASE5_PROJECT_REF must be the 20-character project reference.'
  }
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return 'PHASE5_SUPABASE_URL is not a valid URL.'
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) {
    return 'PHASE5_SUPABASE_URL must be an https://<ref>.supabase.co project URL.'
  }
  if (parsed.hostname.split('.')[0] !== projectRef) {
    return 'PHASE5_PROJECT_REF does not match the hostname in PHASE5_SUPABASE_URL.'
  }
  const applicationUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (configured(applicationUrl) && normalizeUrl(applicationUrl) === normalizeUrl(url)) {
    return 'Refusing to run: the workflow project is the application Supabase project.'
  }
  let app
  try {
    app = new URL(appUrl)
  } catch {
    return 'PHASE5_APP_URL is not a valid URL.'
  }
  if (app.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(app.hostname)) {
    return 'PHASE5_APP_URL must use https unless it targets localhost.'
  }
  return null
}

/**
 * Build the cookie @supabase/ssr expects for a password session. The default
 * storage key is `sb-<project-ref>-auth-token`; values are `base64-` prefixed
 * base64url JSON and are split at 3180 encoded characters.
 */
function cookieForSession(session, ref) {
  const key = `sb-${ref}-auth-token`
  const encoded = `base64-${Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')}`
  if (encodeURIComponent(encoded).length <= 3180) return `${key}=${encoded}`
  const chunks = []
  let remaining = encoded
  while (remaining.length > 0) {
    let head = remaining.slice(0, 3180)
    const lastEscape = head.lastIndexOf('%')
    if (lastEscape > 3180 - 3) head = head.slice(0, lastEscape)
    chunks.push(head)
    remaining = remaining.slice(head.length)
  }
  return chunks.map((value, index) => `${key}.${index}=${value}`).join('; ')
}

async function api(session, path, options = {}) {
  const response = await fetch(`${appUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      accept: 'application/json',
      cookie: session.cookie,
      ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    redirect: 'manual',
    signal: AbortSignal.timeout(20_000),
  })
  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { status: response.status, json }
}

async function signIn(account) {
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const { data, error } = await client.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  })
  if (error || !data.session || !data.user) {
    throw new Error(`${account.key} sign-in failed: ${error?.message ?? 'no session'}`)
  }
  const role = data.user.app_metadata?.role ?? 'USER'
  const status =
    data.user.app_metadata?.status ??
    (data.user.email_confirmed_at ? 'ACTIVE' : 'PENDING_VERIFICATION')
  record(`${account.key} sign-in`, 'pass', `role=${role} status=${status}`)
  if (role !== account.role) {
    record(`${account.key} role`, 'fail', `expected=${account.role} observed=${role}`)
  }
  if (status !== 'ACTIVE') {
    record(`${account.key} status`, 'fail', `expected=ACTIVE observed=${status}`)
  }
  return {
    user: data.user,
    cookie: cookieForSession(data.session, projectRef),
  }
}

async function main() {
  const unsafe = guard()
  if (unsafe) return blocked(unsafe)

  const db = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const sessions = {}
  let postId = null
  let postSlug = null
  let commentId = null
  let followCreated = false
  let baselineNotificationIds = new Set()
  let createdNotificationIds = []

  async function cleanup() {
    try {
      if (createdNotificationIds.length) {
        await db.from('notifications').delete().in('id', createdNotificationIds)
      }
      if (postId) {
        await db.from('reports').delete().eq('target_id', postId)
        await db.from('comments').delete().eq('post_id', postId)
        await db.from('posts').delete().eq('id', postId)
      }
      record('cleanup', 'pass', 'isolated fixtures removed')
    } catch (error) {
      record('cleanup', 'fail', sanitize(error.message))
    }
  }

  try {
    for (const account of accounts) {
      sessions[account.key] = await signIn(account)
    }

    const a = sessions.USER_A
    const b = sessions.USER_B
    const moderator = sessions.MODERATOR
    const admin = sessions.ADMIN

    const profile = await api(a, '/api/v1/profiles')
    expectStatus('USER_A reads own profile', profile, [200])
    expect('USER_A profile row exists', Boolean(profile.json?.profile), profile.json?.profile ? 'row=present' : 'row=missing')

    const notificationsBefore = await api(a, '/api/v1/notifications')
    expectStatus('USER_A reads notifications before workflow', notificationsBefore, [200])
    baselineNotificationIds = new Set(
      (notificationsBefore.json?.notifications ?? []).map((item) => item.id)
    )

    const created = await api(a, '/api/v1/social-posts', {
      method: 'POST',
      body: { type: 'POST', title: marker, body: `${marker} body.` },
    })
    if (!expectStatus('USER_A creates social post', created, [201])) {
      await cleanup()
      return emit('failed', 'The workflow cannot continue without a created post.', 3)
    }
    postId = created.json?.post?.id ?? null
    postSlug = created.json?.post?.slug ?? null
    expect('social post id returned', Boolean(postId), postId ? 'id=present' : 'id=missing')
    expect(
      'social post schema is production-equivalent',
      created.json?.degraded !== true,
      created.json?.degraded === true ? 'post_type/language/link_url columns missing' : 'degraded=false'
    )
    if (!postId || !postSlug) {
      await cleanup()
      return emit('failed', 'The created post did not return an id and slug.', 3)
    }

    const reader = await api(a, `/api/v1/posts/${encodeURIComponent(postSlug)}`)
    expectStatus('USER_A reads created post', reader, [200])

    const updated = await api(a, `/api/v1/social-posts/${postId}`, {
      method: 'PATCH',
      body: { type: 'POST', title: marker, body: `${marker} updated body.` },
    })
    expectStatus('USER_A updates own post', updated, [200])

    const crossUpdate = await api(b, `/api/v1/social-posts/${postId}`, {
      method: 'PATCH',
      body: { type: 'POST', title: marker, body: `${marker} unauthorized edit.` },
    })
    expectStatus('USER_B cannot update USER_A post', crossUpdate, [403, 404])
    expect('USER_B post update was denied', [403, 404].includes(crossUpdate.status), `http=${crossUpdate.status}`)

    const crossDelete = await api(b, `/api/v1/social-posts/${postId}`, { method: 'DELETE' })
    expectStatus('USER_B cannot delete USER_A post', crossDelete, [403, 404])

    const comment = await api(b, '/api/v1/comments', {
      method: 'POST',
      body: { postId, content: `${marker} comment.` },
    })
    expectStatus('USER_B comments on USER_A post', comment, [201])
    commentId = comment.json?.comment?.id ?? null
    expect('comment id returned', Boolean(commentId), commentId ? 'id=present' : 'id=missing')

    if (commentId) {
      const comments = await api(a, `/api/v1/comments?postId=${postId}`)
      expectStatus('USER_A lists comments', comments, [200])
      expect(
        'created comment is visible',
        (comments.json?.comments ?? []).some((item) => item.id === commentId),
        `rows=${(comments.json?.comments ?? []).length}`
      )

      const ownUpdate = await api(b, `/api/v1/comments/${commentId}`, {
        method: 'PATCH',
        body: { content: `${marker} edited comment.` },
      })
      expectStatus('USER_B updates own comment', ownUpdate, [200])

      const crossCommentUpdate = await api(a, `/api/v1/comments/${commentId}`, {
        method: 'PATCH',
        body: { content: `${marker} unauthorized comment edit.` },
      })
      expectStatus('USER_A cannot update USER_B comment', crossCommentUpdate, [403, 404])

      const crossCommentDelete = await api(a, `/api/v1/comments/${commentId}`, { method: 'DELETE' })
      expectStatus('USER_A cannot delete USER_B comment', crossCommentDelete, [403, 404])

      const ownDelete = await api(b, `/api/v1/comments/${commentId}`, { method: 'DELETE' })
      expectStatus('USER_B deletes own comment', ownDelete, [204])

      const afterDelete = await api(a, `/api/v1/comments?postId=${postId}`)
      expectStatus('USER_A lists comments after delete', afterDelete, [200])
      expect(
        'deleted comment is no longer listed',
        !(afterDelete.json?.comments ?? []).some((item) => item.id === commentId),
        `rows=${(afterDelete.json?.comments ?? []).length}`
      )
    }

    const like = await api(b, '/api/v1/reactions', {
      method: 'POST',
      body: { postId, action: 'like' },
    })
    expectStatus('USER_B likes USER_A post', like, [200])
    const likedState = await api(b, `/api/v1/reactions?postId=${postId}`)
    expectStatus('USER_B reads reaction state', likedState, [200])
    expect('like state is active', likedState.json?.liked === true, `liked=${Boolean(likedState.json?.liked)}`)
    const unlike = await api(b, '/api/v1/reactions', {
      method: 'POST',
      body: { postId, action: 'unlike' },
    })
    expectStatus('USER_B unlikes USER_A post', unlike, [200])

    const save = await api(b, '/api/v1/reactions', {
      method: 'POST',
      body: { postId, action: 'save' },
    })
    expectStatus('USER_B saves USER_A post', save, [200])
    const savedState = await api(b, `/api/v1/reactions?postId=${postId}`)
    expectStatus('USER_B reads saved state', savedState, [200])
    expect('save state is active', savedState.json?.saved === true, `saved=${Boolean(savedState.json?.saved)}`)
    const unsave = await api(b, '/api/v1/reactions', {
      method: 'POST',
      body: { postId, action: 'unsave' },
    })
    expectStatus('USER_B unsaves USER_A post', unsave, [200])

    const follow = await api(b, '/api/v1/follows', {
      method: 'POST',
      body: { followingId: a.user.id },
    })
    if (follow.status === 200) {
      followCreated = true
      record('USER_B follows USER_A', 'pass', 'http=200')
    } else if (follow.status === 409) {
      record('USER_B follows USER_A', 'pass', 'http=409 already following')
    } else {
      record('USER_B follows USER_A', 'fail', `http=${follow.status}`)
    }
    const duplicateFollow = await api(b, '/api/v1/follows', {
      method: 'POST',
      body: { followingId: a.user.id },
    })
    expect('duplicate follow is rejected', duplicateFollow.status === 409, `http=${duplicateFollow.status}`)
    if (followCreated) {
      const unfollow = await api(b, '/api/v1/follows', {
        method: 'DELETE',
        body: { followingId: a.user.id },
      })
      expectStatus('USER_B unfollows USER_A', unfollow, [200])
    }

    const report = await api(b, '/api/v1/reports', {
      method: 'POST',
      body: {
        targetType: 'POST',
        targetId: postId,
        reason: 'OTHER',
        description: `${marker} report.`,
      },
    })
    expect('USER_B submits report', [200, 201].includes(report.status), `http=${report.status}`)

    const ownReports = await api(b, '/api/v1/reports')
    expectStatus('USER_B lists own reports', ownReports, [200])
    expect(
      'submitted report is visible to reporter',
      (ownReports.json?.reports ?? []).some((item) => item.target_id === postId),
      `rows=${(ownReports.json?.reports ?? []).length}`
    )

    const moderation = await api(moderator, '/api/v1/moderation/reports?status=OPEN')
    expectStatus('MODERATOR lists open reports', moderation, [200])
    expect(
      'report is visible in moderation queue',
      (moderation.json?.reports ?? []).some((item) => item.target_id === postId),
      `rows=${(moderation.json?.reports ?? []).length}`
    )
    const deniedModeration = await api(a, '/api/v1/moderation/reports')
    expectStatus('USER_A cannot read moderation queue', deniedModeration, [403])

    const adminUsers = await api(admin, '/api/v1/admin/users?page=1')
    expectStatus('ADMIN lists users', adminUsers, [200])
    expect(
      'admin user list is populated',
      Array.isArray(adminUsers.json?.users) && adminUsers.json.users.length > 0,
      `rows=${adminUsers.json?.users?.length ?? 0}`
    )
    const deniedAdmin = await api(a, '/api/v1/admin/users?page=1')
    expectStatus('USER_A cannot list admin users', deniedAdmin, [403])
    const deniedModeratorAdmin = await api(moderator, '/api/v1/admin/users?page=1')
    expectStatus('MODERATOR cannot list admin users', deniedModeratorAdmin, [403])
    const auditLogs = await api(admin, '/api/v1/admin/audit-logs?page=1')
    expectStatus('ADMIN lists audit logs', auditLogs, [200])

    const notificationsAfter = await api(a, '/api/v1/notifications')
    expectStatus('USER_A reads notifications after workflow', notificationsAfter, [200])
    const afterRows = notificationsAfter.json?.notifications ?? []
    createdNotificationIds = afterRows
      .filter((item) => !baselineNotificationIds.has(item.id))
      .map((item) => item.id)
    expect(
      'workflow generated notifications',
      createdNotificationIds.length > 0,
      `new=${createdNotificationIds.length}`
    )
    expect(
      'comment notification is present',
      afterRows.some((item) => item.type === 'COMMENT'),
      'type=COMMENT'
    )

    const unread = afterRows.find((item) => createdNotificationIds.includes(item.id) && item.read === false)
    if (unread) {
      const markRead = await api(a, '/api/v1/notifications', {
        method: 'PATCH',
        body: { id: unread.id },
      })
      expectStatus('USER_A marks notification read', markRead, [200])
      const afterRead = await api(a, '/api/v1/notifications')
      expect(
        'notification read state persists',
        (afterRead.json?.notifications ?? []).some((item) => item.id === unread.id && item.read === true),
        'read=true'
      )
    } else {
      record('USER_A marks notification read', 'skip', 'no unread workflow notification')
    }

    const expired = await fetch(`${appUrl}/api/v1/notifications`, {
      headers: {
        accept: 'application/json',
        cookie: `sb-${projectRef}-auth-token=base64-e30`,
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(20_000),
    })
    expectStatus('expired session is rejected', { status: expired.status }, [401])

    await cleanup()
    const summary = summarize()
    if (summary.failed > 0) {
      return emit('failed', `${summary.failed} workflow assertion(s) failed.`, 3)
    }
    return emit('passed', null, 0)
  } catch (error) {
    await cleanup()
    return emit('failed', sanitize(error.message), 2)
  }
}

main().catch((error) => {
  blocked(`Unhandled workflow error: ${sanitize(error.message)}`, 2)
})
