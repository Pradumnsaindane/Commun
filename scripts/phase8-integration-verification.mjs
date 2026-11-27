#!/usr/bin/env node
/**
 * Phase 8 — isolated integration verification for RLS, notifications,
 * realtime, admin and moderation flows.
 *
 * This harness never reads `.env.local`. It only accepts values exported
 * explicitly for a disposable Supabase project and refuses to run until both
 * isolation and writes are confirmed. It performs real GoTrue, PostgREST,
 * Realtime and application-API requests; it never returns a mocked success.
 *
 * Required environment:
 *   PHASE8_CONFIRM_ISOLATED=yes
 *   PHASE8_ALLOW_WRITES=true
 *   PHASE8_SUPABASE_URL=...
 *   PHASE8_SUPABASE_ANON_KEY=...
 *   PHASE8_SUPABASE_SERVICE_ROLE_KEY=...
 *   PHASE8_APP_URL=...
 *   PHASE8_USER_A_EMAIL / PHASE8_USER_A_PASSWORD
 *   PHASE8_USER_B_EMAIL / PHASE8_USER_B_PASSWORD
 *   PHASE8_MODERATOR_EMAIL / PHASE8_MODERATOR_PASSWORD
 *   PHASE8_ADMIN_EMAIL / PHASE8_ADMIN_PASSWORD
 *
 * Stripe and Upstash credentials are intentionally NOT required. When they are
 * absent, those providers are reported as BLOCKED with no provider calls.
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
    return `${url.protocol}//${url.hostname.slice(0, 3)}***`
  } catch {
    return `<set:${value.length} chars>`
  }
}

function redact(text, secrets) {
  let output = String(text)
  for (const secret of secrets) {
    if (secret && secret.length > 8) output = output.split(secret).join('<redacted>')
  }
  return output
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '<jwt-redacted>')
    .slice(0, 300)
}

const confirmIsolated = fromEnv(['PHASE8_CONFIRM_ISOLATED'])
const allowWrites = fromEnv(['PHASE8_ALLOW_WRITES']).toLowerCase() === 'true'
const url = fromEnv(['PHASE8_SUPABASE_URL'])
const anonKey = fromEnv(['PHASE8_SUPABASE_ANON_KEY'])
const serviceKey = fromEnv(['PHASE8_SUPABASE_SERVICE_ROLE_KEY'])
const appUrl = fromEnv(['PHASE8_APP_URL'])
const accounts = {
  A: { email: fromEnv(['PHASE8_USER_A_EMAIL']), password: fromEnv(['PHASE8_USER_A_PASSWORD']) },
  B: { email: fromEnv(['PHASE8_USER_B_EMAIL']), password: fromEnv(['PHASE8_USER_B_PASSWORD']) },
  MODERATOR: {
    email: fromEnv(['PHASE8_MODERATOR_EMAIL']),
    password: fromEnv(['PHASE8_MODERATOR_PASSWORD']),
  },
  ADMIN: { email: fromEnv(['PHASE8_ADMIN_EMAIL']), password: fromEnv(['PHASE8_ADMIN_PASSWORD']) },
}

const checks = []
const record = (name, ok, detail) => {
  checks.push({ name, status: ok ? 'PASS' : 'FAIL', detail: detail ?? null })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}
const blockRecord = (name, detail) => {
  checks.push({ name, status: 'BLOCKED', detail: detail ?? null })
  console.log(`BLOCKED  ${name}${detail ? ` — ${detail}` : ''}`)
}

function blocked(reason) {
  console.log(JSON.stringify({ verdict: 'blocked', reason, checks }, null, 2))
  process.exit(1)
}

function guard() {
  if (confirmIsolated !== 'yes') {
    return 'Refusing to run: set PHASE8_CONFIRM_ISOLATED=yes only for a disposable isolated project.'
  }
  if (!allowWrites) {
    return 'Refusing to run: set PHASE8_ALLOW_WRITES=true to permit fixture writes.'
  }
  if (!configured(url) || !configured(anonKey) || !configured(serviceKey)) {
    return `Supabase URL or keys missing/placeholder. url=${mask(url)} anon=${anonKey ? 'set' : 'missing'} service=${serviceKey ? 'set' : 'missing'}`
  }
  let host = ''
  try {
    host = new URL(url).hostname
  } catch {
    return 'PHASE8_SUPABASE_URL is not a valid URL.'
  }
  if (!['127.0.0.1', 'localhost', '::1'].includes(host)) {
    return `Refusing to run against a non-loopback Supabase host (${host}).`
  }
  if (!configured(appUrl)) return 'PHASE8_APP_URL is missing or a placeholder.'
  try {
    const appHost = new URL(appUrl).hostname
    if (!['127.0.0.1', 'localhost', '::1'].includes(appHost)) {
      return `Refusing to run against a non-loopback app host (${appHost}).`
    }
  } catch {
    return 'PHASE8_APP_URL is not a valid URL.'
  }
  for (const [key, account] of Object.entries(accounts)) {
    if (!configured(account.email) || !configured(account.password)) {
      return `${key} credentials are missing or placeholders.`
    }
  }
  return null
}

const guardFailure = guard()
if (guardFailure) blocked(guardFailure)

const secrets = [
  url,
  anonKey,
  serviceKey,
  ...Object.values(accounts).flatMap((account) => [account.email, account.password]),
]
const projectRef = new URL(url).hostname.split('.')[0]
const serviceClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const anonClient = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const startedAt = new Date(Date.now() - 60_000).toISOString()

function clientWithSession() {
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
}

function cookieForSession(session) {
  const key = `sb-${projectRef}-auth-token`
  const encoded = `base64-${Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')}`
  return `${key}=${encoded}`
}

async function signIn(account) {
  const client = clientWithSession()
  const { data, error } = await client.auth.signInWithPassword(account)
  if (error || !data.session || !data.user) {
    throw new Error(`sign-in failed: ${error?.message ?? 'no session'}`)
  }
  return {
    client,
    session: data.session,
    user: data.user,
    cookie: cookieForSession(data.session),
  }
}

async function api(session, path, options = {}) {
  const headers = { accept: 'application/json' }
  if (session) headers.cookie = cookieForSession(session)
  if (options.body !== undefined) headers['content-type'] = 'application/json'
  const response = await fetch(`${appUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    redirect: 'manual',
    signal: AbortSignal.timeout(25_000),
  })
  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { status: response.status, json, headers: response.headers }
}

async function selectById(client, table, id) {
  const { data, error } = await client.from(table).select('*').eq('id', id)
  return { rows: data ?? [], error }
}

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms))
}

const fixtures = {
  postIds: [],
  reportIds: [],
  notificationIds: [],
  productEventIds: [],
  membershipCreated: false,
  userBMetadataRestored: false,
}

async function cleanup(sessions) {
  try {
    if (fixtures.reportIds.length) {
      await serviceClient.from('reports').delete().in('id', fixtures.reportIds)
    }
    if (fixtures.notificationIds.length) {
      await serviceClient.from('notifications').delete().in('id', fixtures.notificationIds)
    }
    if (fixtures.postIds.length) {
      await serviceClient.from('posts').delete().in('id', fixtures.postIds)
    }
    if (fixtures.productEventIds.length) {
      await serviceClient.from('product_events').delete().in('id', fixtures.productEventIds)
    }
    if (fixtures.membershipCreated) {
      await serviceClient
        .from('memberships')
        .delete()
        .eq('subscriber_id', sessions.B.user.id)
        .eq('creator_id', sessions.A.user.id)
    }
    const privilegedIds = [sessions.MODERATOR.user.id, sessions.ADMIN.user.id]
    await serviceClient
      .from('audit_logs')
      .delete()
      .in('actor_id', privilegedIds)
      .gte('created_at', startedAt)
    // A deliberately attempts privilege escalation; normalise the fixture even
    // if the guard regresses so the next run starts from a known state.
    await serviceClient
      .from('profiles')
      .update({ role: 'USER', status: 'ACTIVE' })
      .eq('id', sessions.A.user.id)
    if (!fixtures.userBMetadataRestored) {
      const { error } = await serviceClient.auth.admin.updateUserById(sessions.B.user.id, {
        app_metadata: { ...sessions.B.user.app_metadata, role: 'USER', status: 'ACTIVE' },
      })
      if (error) throw error
      fixtures.userBMetadataRestored = true
    }
    record('Isolated fixtures cleaned up', true)
  } catch (error) {
    record('Isolated fixtures cleaned up', false, redact(error?.message ?? error, secrets))
  }
}

async function main() {
  const health = await fetch(`${url}/auth/v1/health`, { headers: { apikey: anonKey } })
  record('Supabase connectivity', health.ok, `HTTP ${health.status}`)

  let sessions
  try {
    sessions = {
      A: await signIn(accounts.A),
      B: await signIn(accounts.B),
      MODERATOR: await signIn(accounts.MODERATOR),
      ADMIN: await signIn(accounts.ADMIN),
    }
  } catch (error) {
    blocked(`Test-account sign-in failed: ${redact(error?.message ?? error, secrets)}`)
    return
  }

  const expectedRoles = { A: 'USER', B: 'USER', MODERATOR: 'MODERATOR', ADMIN: 'ADMIN' }
  for (const [key, session] of Object.entries(sessions)) {
    const role = session.user.app_metadata?.role ?? 'USER'
    const status = session.user.app_metadata?.status ?? 'PENDING_VERIFICATION'
    record(
      `${key} isolated identity`,
      role === expectedRoles[key] && status === 'ACTIVE',
      `role=${role} status=${status}`
    )
  }

  // ----- Fixtures -----------------------------------------------------------
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const postRows = [
    { slug: `phase8-free-${suffix}`, status: 'PUBLISHED', access_level: 'FREE' },
    { slug: `phase8-members-${suffix}`, status: 'PUBLISHED', access_level: 'MEMBERS' },
    { slug: `phase8-removable-${suffix}`, status: 'PUBLISHED', access_level: 'FREE' },
  ]
  const createdPosts = []
  for (const row of postRows) {
    const { data, error } = await serviceClient
      .from('posts')
      .insert({
        author_id: sessions.A.user.id,
        title: row.slug,
        slug: row.slug,
        excerpt: 'Phase 8 isolated verification fixture.',
        body: 'Phase 8 isolated verification fixture body.',
        status: row.status,
        access_level: row.access_level,
        reading_time_minutes: 1,
        published_at: new Date().toISOString(),
        post_type: 'ARTICLE',
      })
      .select('id,slug,status,access_level')
      .single()
    if (error || !data) {
      blocked(`Post fixture creation failed: ${redact(error?.message ?? error, secrets)}`)
      return
    }
    createdPosts.push(data)
    fixtures.postIds.push(data.id)
  }
  const [freePost, membersPost, removablePost] = createdPosts

  const notificationFixtures = [
    {
      label: 'API',
      type: 'COMMENT',
      entity_id: freePost.id,
      target_title: 'Phase 8 API notification',
    },
    {
      label: 'RLS',
      type: 'FOLLOW',
      entity_id: membersPost.id,
      target_title: 'Phase 8 RLS notification',
    },
  ]
  const createdNotifications = {}
  for (const fixture of notificationFixtures) {
    const { data, error } = await serviceClient
      .from('notifications')
      .insert({
        recipient_id: sessions.B.user.id,
        actor_id: sessions.A.user.id,
        type: fixture.type,
        entity_id: fixture.entity_id,
        target_title: fixture.target_title,
        read: false,
      })
      .select('id,read')
      .single()
    if (error || !data) {
      blocked(`Notification fixture creation failed: ${redact(error?.message ?? error, secrets)}`)
      return
    }
    createdNotifications[fixture.label] = data.id
    fixtures.notificationIds.push(data.id)
  }

  const { data: eventRow, error: eventError } = await serviceClient
    .from('product_events')
    .insert({
      user_id: sessions.A.user.id,
      event_name: 'article_viewed',
      path: '/phase8-isolated-verification',
      metadata: {},
    })
    .select('id')
    .single()
  if (eventError || !eventRow) {
    blocked(`Product event fixture creation failed: ${redact(eventError?.message ?? eventError, secrets)}`)
    return
  }
  fixtures.productEventIds.push(eventRow.id)

  // ----- Row level security -------------------------------------------------
  const rlsNotification = await selectById(sessions.B.client, 'notifications', createdNotifications.RLS)
  record('Recipient can read own notification (RLS)', rlsNotification.rows.length === 1)

  const otherNotification = await selectById(sessions.A.client, 'notifications', createdNotifications.RLS)
  record('Non-recipient cannot read notification (RLS)', otherNotification.rows.length === 0)

  const anonNotification = await selectById(anonClient, 'notifications', createdNotifications.RLS)
  record('Anonymous cannot read notifications (RLS)', anonNotification.rows.length === 0)

  const forgedUpdate = await sessions.A.client
    .from('notifications')
    .update({ read: true })
    .eq('id', createdNotifications.RLS)
  const afterForgedUpdate = await selectById(serviceClient, 'notifications', createdNotifications.RLS)
  record(
    'Non-recipient cannot mark notification read (RLS)',
    afterForgedUpdate.rows[0]?.read === false,
    `updateError=${Boolean(forgedUpdate.error)}`
  )

  const forgedDelete = await sessions.A.client
    .from('notifications')
    .delete()
    .eq('id', createdNotifications.RLS)
  const afterForgedDelete = await selectById(serviceClient, 'notifications', createdNotifications.RLS)
  record(
    'Non-recipient cannot delete notification (RLS)',
    afterForgedDelete.rows.length === 1,
    `deleteError=${Boolean(forgedDelete.error)}`
  )

  const escalation = await sessions.A.client
    .from('profiles')
    .update({ role: 'ADMIN', status: 'ACTIVE' })
    .eq('id', sessions.A.user.id)
  const { data: profileAfter } = await serviceClient
    .from('profiles')
    .select('role,status')
    .eq('id', sessions.A.user.id)
    .single()
  record(
    'Self-service privilege escalation blocked',
    Boolean(escalation.error) && profileAfter?.role === 'USER',
    `role=${profileAfter?.role ?? 'unknown'}`
  )

  const visibilityFor = async (client) => {
    const { data } = await client
      .from('posts')
      .select('id,access_level')
      .in('id', [freePost.id, membersPost.id])
    return new Set((data ?? []).map((row) => row.id))
  }
  const authorVisibility = await visibilityFor(sessions.A.client)
  const beforeMembership = await visibilityFor(sessions.B.client)

  const { data: membershipRow, error: membershipError } = await serviceClient
    .from('memberships')
    .insert({
      subscriber_id: sessions.B.user.id,
      creator_id: sessions.A.user.id,
      status: 'active',
      stripe_subscription_id: `sub_phase8_${suffix}`,
      stripe_price_id: 'price_phase8_local',
    })
    .select('id')
    .single()
  if (!membershipError && membershipRow) fixtures.membershipCreated = true
  const afterMembership = await visibilityFor(sessions.B.client)

  record(
    'Author can read own free and members-only posts',
    authorVisibility.has(freePost.id) && authorVisibility.has(membersPost.id)
  )
  record(
    'Members-only post hidden without active membership',
    beforeMembership.has(freePost.id) && !beforeMembership.has(membersPost.id)
  )
  record(
    'Members-only post visible with active membership',
    afterMembership.has(freePost.id) && afterMembership.has(membersPost.id)
  )

  const { data: anonymousPosts } = await anonClient
    .from('posts')
    .select('id')
    .eq('id', membersPost.id)
  record('Anonymous cannot read members-only post', (anonymousPosts ?? []).length === 0)

  const ownEvent = await sessions.A.client
    .from('product_events')
    .select('id')
    .eq('id', eventRow.id)
  const otherEvent = await sessions.B.client
    .from('product_events')
    .select('id')
    .eq('id', eventRow.id)
  record(
    'Product event owner read policy',
    (ownEvent.data ?? []).length === 1 && (otherEvent.data ?? []).length === 0
  )

  // ----- Notification API ---------------------------------------------------
  const unauthenticatedNotifications = await api(null, '/api/v1/notifications')
  record(
    'Notification API requires a session',
    unauthenticatedNotifications.status === 401,
    `HTTP ${unauthenticatedNotifications.status}`
  )

  const pageOne = await api(sessions.B.session, '/api/v1/notifications?page=1&limit=1')
  record(
    'Notification API paginates with exact unread count',
    pageOne.status === 200 &&
      Array.isArray(pageOne.json?.notifications) &&
      pageOne.json.notifications.length === 1 &&
      pageOne.json.page === 1 &&
      pageOne.json.limit === 1 &&
      pageOne.json.total >= 2 &&
      typeof pageOne.json.unreadCount === 'number' &&
      pageOne.json.hasNextPage === true,
    `HTTP ${pageOne.status} total=${pageOne.json?.total} unread=${pageOne.json?.unreadCount}`
  )
  record(
    'Notification API sends private no-store headers',
    (pageOne.headers.get('cache-control') ?? '').includes('private') &&
      (pageOne.headers.get('cache-control') ?? '').includes('no-store')
  )

  const markOne = await api(sessions.B.session, '/api/v1/notifications', {
    method: 'PATCH',
    body: { id: createdNotifications.API },
  })
  const afterMarkOne = await api(sessions.B.session, '/api/v1/notifications?limit=50')
  record(
    'Marking one notification read updates the exact unread count',
    markOne.status === 200 &&
      afterMarkOne.json?.notifications?.find((item) => item.id === createdNotifications.API)?.read === true &&
      afterMarkOne.json?.unreadCount === 1,
    `HTTP ${markOne.status} unread=${afterMarkOne.json?.unreadCount}`
  )

  const markAll = await api(sessions.B.session, '/api/v1/notifications', { method: 'PATCH', body: {} })
  const afterMarkAll = await api(sessions.B.session, '/api/v1/notifications?limit=50')
  record(
    'Marking all notifications read empties the unread count',
    markAll.status === 200 && afterMarkAll.json?.unreadCount === 0,
    `HTTP ${markAll.status} unread=${afterMarkAll.json?.unreadCount}`
  )

  const forgedApiDelete = await api(sessions.A.session, `/api/v1/notifications/${createdNotifications.RLS}`, {
    method: 'DELETE',
  })
  const stillExists = await selectById(serviceClient, 'notifications', createdNotifications.RLS)
  record(
    'Notification delete route cannot target another recipient',
    forgedApiDelete.status === 200 && stillExists.rows.length === 1,
    `HTTP ${forgedApiDelete.status}`
  )

  const ownerDelete = await api(sessions.B.session, `/api/v1/notifications/${createdNotifications.RLS}`, {
    method: 'DELETE',
  })
  const deletedByOwner = await selectById(serviceClient, 'notifications', createdNotifications.RLS)
  record(
    'Recipient can delete a single notification',
    ownerDelete.status === 200 && deletedByOwner.rows.length === 0,
    `HTTP ${ownerDelete.status}`
  )

  const clearAll = await api(sessions.B.session, '/api/v1/notifications', { method: 'DELETE' })
  const afterClearAll = await api(sessions.B.session, '/api/v1/notifications')
  record(
    'Recipient can clear all notifications',
    clearAll.status === 200 && afterClearAll.json?.total === 0,
    `HTTP ${clearAll.status} total=${afterClearAll.json?.total}`
  )

  const clientCreate = await api(sessions.B.session, '/api/v1/notifications', { method: 'POST' })
  record(
    'Client notification creation is rejected',
    clientCreate.status === 403,
    `HTTP ${clientCreate.status}`
  )

  // ----- Realtime -----------------------------------------------------------
  if (typeof WebSocket === 'undefined') {
    blockRecord('Notification realtime delivery', 'Node runtime has no WebSocket implementation')
  } else {
    // Use a normally signed-in client: setting the realtime token on a client
    // whose auth initialization is still in flight can be overwritten by the
    // SDK and silently downgrade the subscription to anonymous.
    const realtimeSession = await signIn(accounts.B)
    const realtimeClient = realtimeSession.client
    realtimeClient.realtime.setAuth(realtimeSession.session.access_token)
    const channel = realtimeClient.channel(`phase8-notifications-${suffix}`)
    let expectedRealtimeId = ''
    let resolveEvent
    const eventPromise = new Promise((resolve) => {
      resolveEvent = resolve
    })
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${sessions.B.user.id}`,
      },
      (payload) => {
        // Earlier fixture cleanup can still deliver a stale DELETE. Only the
        // exact INSERT produced by this check proves delivery.
        if (payload?.eventType === 'INSERT' && payload?.new?.id === expectedRealtimeId) {
          resolveEvent(payload)
        }
      }
    )
    try {
      const subscribed = new Promise((resolve, reject) => {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') resolve()
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            reject(new Error(`realtime channel status ${status}`))
          }
        })
      })
      await Promise.race([subscribed, timeout(15_000)])
      // SUBSCRIBED is the socket acknowledgement; the server registers the
      // postgres_changes listener just after it. Give that registration a
      // brief moment before producing the change.
      await new Promise((resolve) => setTimeout(resolve, 5_000))
      const { data: realtimeRow, error: realtimeError } = await serviceClient
        .from('notifications')
        .insert({
          recipient_id: sessions.B.user.id,
          actor_id: sessions.A.user.id,
          type: 'NEW_POST',
          entity_id: removablePost.id,
          target_title: 'Phase 8 realtime notification',
        })
        .select('id')
        .single()
      if (realtimeError || !realtimeRow) throw realtimeError ?? new Error('no notification row')
      expectedRealtimeId = realtimeRow.id
      fixtures.notificationIds.push(realtimeRow.id)
      const payload = await Promise.race([eventPromise, timeout(15_000)])
      record(
        'Notification realtime delivery',
        payload?.new?.id === realtimeRow.id && payload?.eventType === 'INSERT',
        `event=${payload?.eventType ?? 'none'}`
      )
    } catch (error) {
      record('Notification realtime delivery', false, redact(error?.message ?? error, secrets))
    } finally {
      realtimeClient.removeChannel(channel)
    }
  }

  // ----- Admin and moderation ----------------------------------------------
  const userModeration = await api(sessions.A.session, '/api/v1/moderation/reports')
  const userAdmin = await api(sessions.A.session, '/api/v1/admin/users')
  record('Normal user cannot access moderation API', userModeration.status === 403, `HTTP ${userModeration.status}`)
  record('Normal user cannot access admin API', userAdmin.status === 403, `HTTP ${userAdmin.status}`)

  const reportOne = await api(sessions.B.session, '/api/v1/reports', {
    method: 'POST',
    body: {
      targetType: 'POST',
      targetId: freePost.id,
      reason: 'SPAM',
      description: 'Phase 8 isolated moderation fixture.',
    },
  })
  const ownReports = await api(sessions.B.session, '/api/v1/reports')
  const reportOneId = ownReports.json?.reports?.find((report) => report.target_id === freePost.id)?.id
  if (reportOneId) fixtures.reportIds.push(reportOneId)
  record(
    'Reporter can submit a report through the app',
    [201, 200].includes(reportOne.status) && Boolean(reportOneId),
    `HTTP ${reportOne.status}`
  )

  const reportTwo = await api(sessions.B.session, '/api/v1/reports', {
    method: 'POST',
    body: {
      targetType: 'POST',
      targetId: removablePost.id,
      reason: 'ABUSE',
      description: 'Phase 8 isolated content-removal fixture.',
    },
  })
  const reportsAfterTwo = await api(sessions.B.session, '/api/v1/reports')
  const reportTwoId = reportsAfterTwo.json?.reports?.find((report) => report.target_id === removablePost.id)?.id
  if (reportTwoId) fixtures.reportIds.push(reportTwoId)
  record(
    'Second report fixture created',
    [201, 200].includes(reportTwo.status) && Boolean(reportTwoId),
    `HTTP ${reportTwo.status}`
  )

  if (!reportOneId || !reportTwoId) {
    blockRecord('Admin/moderation action checks', 'Report fixtures were not created')
  } else {
    const moderatorList = await api(sessions.MODERATOR.session, '/api/v1/moderation/reports')
    record(
      'Moderator can list reports',
      moderatorList.status === 200 && Array.isArray(moderatorList.json?.reports),
      `HTTP ${moderatorList.status}`
    )

    const invalidId = await api(sessions.MODERATOR.session, '/api/v1/moderation/reports/not-a-uuid')
    record('Invalid report id rejected', invalidId.status === 422, `HTTP ${invalidId.status}`)

    const detail = await api(sessions.MODERATOR.session, `/api/v1/moderation/reports/${reportOneId}`)
    record('Moderator can read report detail', detail.status === 200, `HTTP ${detail.status}`)

    const resolve = await api(sessions.MODERATOR.session, `/api/v1/moderation/reports/${reportOneId}`, {
      method: 'POST',
      body: { action: 'RESOLVE', note: 'Phase 8 isolated verification.' },
    })
    const { data: resolvedRow } = await serviceClient
      .from('reports')
      .select('status,assigned_to')
      .eq('id', reportOneId)
      .single()
    record(
      'Moderator can resolve a report',
      resolve.status === 200 && resolvedRow?.status === 'RESOLVED' && resolvedRow?.assigned_to === sessions.MODERATOR.user.id,
      `HTTP ${resolve.status} status=${resolvedRow?.status}`
    )

    const repeatResolve = await api(sessions.MODERATOR.session, `/api/v1/moderation/reports/${reportOneId}`, {
      method: 'POST',
      body: { action: 'RESOLVE' },
    })
    record('Closed report cannot be resolved twice', repeatResolve.status === 409, `HTTP ${repeatResolve.status}`)

    const audit = await serviceClient
      .from('audit_logs')
      .select('id,action')
      .eq('actor_id', sessions.MODERATOR.user.id)
      .eq('action', 'REPORT_RESOLVED')
      .gte('created_at', startedAt)
    record('Moderation decision wrote an audit entry', (audit.data ?? []).length >= 1)

    const moderationNotice = await serviceClient
      .from('notifications')
      .select('id,type')
      .eq('recipient_id', sessions.B.user.id)
      .eq('actor_id', sessions.MODERATOR.user.id)
      .eq('type', 'MODERATION')
      .eq('entity_id', reportOneId)
    const moderationNoticeIds = (moderationNotice.data ?? []).map((row) => row.id)
    fixtures.notificationIds.push(...moderationNoticeIds)
    record('Reporter received a moderation notification', moderationNoticeIds.length >= 1)

    const remove = await api(sessions.MODERATOR.session, `/api/v1/moderation/reports/${reportTwoId}`, {
      method: 'POST',
      body: { action: 'REMOVE' },
    })
    const { data: removedPost } = await serviceClient
      .from('posts')
      .select('status')
      .eq('id', removablePost.id)
      .single()
    record(
      'Moderator can remove reported content',
      remove.status === 200 && removedPost?.status === 'REMOVED',
      `HTTP ${remove.status} status=${removedPost?.status}`
    )

    const repeatRemove = await api(sessions.MODERATOR.session, `/api/v1/moderation/reports/${reportTwoId}`, {
      method: 'POST',
      body: { action: 'REMOVE' },
    })
    record('Removed content report cannot be actioned twice', repeatRemove.status === 409, `HTTP ${repeatRemove.status}`)

    const restore = await api(sessions.MODERATOR.session, `/api/v1/moderation/reports/${reportTwoId}`, {
      method: 'POST',
      body: { action: 'RESTORE' },
    })
    const { data: restoredPost } = await serviceClient
      .from('posts')
      .select('status')
      .eq('id', removablePost.id)
      .single()
    record(
      'Moderator can restore removed content',
      restore.status === 200 && restoredPost?.status === 'PUBLISHED',
      `HTTP ${restore.status} status=${restoredPost?.status}`
    )

    const moderatorAdmin = await api(sessions.MODERATOR.session, '/api/v1/admin/users')
    record('Moderator cannot access admin API', moderatorAdmin.status === 403, `HTTP ${moderatorAdmin.status}`)

    const adminUsers = await api(sessions.ADMIN.session, '/api/v1/admin/users')
    record('Admin can list users', adminUsers.status === 200 && Array.isArray(adminUsers.json?.users), `HTTP ${adminUsers.status}`)

    const adminLogs = await api(sessions.ADMIN.session, '/api/v1/admin/audit-logs')
    record('Admin can list audit logs', adminLogs.status === 200 && Array.isArray(adminLogs.json?.logs), `HTTP ${adminLogs.status}`)

    const selfChange = await api(sessions.ADMIN.session, '/api/v1/admin/users', {
      method: 'PATCH',
      body: { userId: sessions.ADMIN.user.id, role: 'USER' },
    })
    record('Admin cannot change their own role', selfChange.status === 422, `HTTP ${selfChange.status}`)

    const promote = await api(sessions.ADMIN.session, '/api/v1/admin/users', {
      method: 'PATCH',
      body: { userId: sessions.B.user.id, role: 'MODERATOR' },
    })
    const promotedAccess = await api(sessions.B.session, '/api/v1/moderation/reports')
    record(
      'Active promoted moderator is allowed',
      promote.status === 200 && promotedAccess.status === 200,
      `promote=${promote.status} access=${promotedAccess.status}`
    )

    const suspend = await api(sessions.ADMIN.session, '/api/v1/admin/users', {
      method: 'PATCH',
      body: { userId: sessions.B.user.id, status: 'SUSPENDED' },
    })
    const suspendedAccess = await api(sessions.B.session, '/api/v1/moderation/reports')
    record(
      'Suspended moderator claim is denied',
      suspend.status === 200 && suspendedAccess.status === 403,
      `suspend=${suspend.status} access=${suspendedAccess.status}`
    )

    const restoreUser = await api(sessions.ADMIN.session, '/api/v1/admin/users', {
      method: 'PATCH',
      body: { userId: sessions.B.user.id, role: 'USER', status: 'ACTIVE' },
    })
    record('Admin can restore a suspended account', restoreUser.status === 200, `HTTP ${restoreUser.status}`)

    const adminAudit = await serviceClient
      .from('audit_logs')
      .select('id,action')
      .eq('actor_id', sessions.ADMIN.user.id)
      .gte('created_at', startedAt)
    const actions = new Set((adminAudit.data ?? []).map((row) => row.action))
    record(
      'Admin changes wrote audit entries',
      actions.has('ROLE_CHANGED') && actions.has('USER_SUSPENDED') && actions.has('USER_RESTORED'),
      `actions=${[...actions].join(',')}`
    )
  }

  // ----- Providers with no isolated credentials -----------------------------
  const stripeKeys = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_MONTHLY_PRICE_ID']
  const missingStripe = stripeKeys.filter((key) => !configured(process.env[key] ?? ''))
  if (missingStripe.length) {
    blockRecord('Stripe live verification', `missing isolated test credentials: ${missingStripe.join(', ')}`)
  } else {
    blockRecord('Stripe live verification', 'credentials provided but no isolated Stripe test-mode harness has been approved')
  }

  const kvKeys = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']
  const missingKv = kvKeys.filter((key) => !configured(process.env[key] ?? ''))
  if (missingKv.length) {
    blockRecord('Upstash KV live verification', `missing isolated test credentials: ${missingKv.join(', ')}`)
  } else {
    blockRecord('Upstash KV live verification', 'credentials provided but no isolated KV harness has been approved')
  }

  await cleanup(sessions)

  const failed = checks.filter((check) => check.status === 'FAIL')
  const blockedChecks = checks.filter((check) => check.status === 'BLOCKED')
  const verdict = failed.length ? 'fail' : blockedChecks.length ? 'verified-with-blocked' : 'pass'
  console.log(
    JSON.stringify(
      {
        verdict,
        counts: {
          pass: checks.filter((check) => check.status === 'PASS').length,
          fail: failed.length,
          blocked: blockedChecks.length,
        },
        checks,
      },
      null,
      2
    )
  )
  if (failed.length) process.exitCode = 1
}

main().catch((error) => {
  console.log(
    JSON.stringify(
      {
        verdict: 'fail',
        reason: redact(error?.stack ?? error, secrets),
        checks,
      },
      null,
      2
    )
  )
  process.exitCode = 1
})
