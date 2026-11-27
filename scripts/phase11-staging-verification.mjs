#!/usr/bin/env node
/**
 * Phase 11M — hosted staging verification harness.
 *
 * SAFETY GATES (all must pass before any hosted network request):
 *   1. checkStagingIdentity(process.env) — explicit staging ref, URL match,
 *      non-production ref, non-local keys, dedicated Vercel project, and two
 *      non-seed test accounts.
 *   2. PHASE11_STAGING_ALLOW_WRITES=1 — explicit opt-in for test-row writes.
 *
 * This script reads no .env.local and never falls back to local/default values.
 * Registration, email confirmation, and password recovery require real email
 * delivery and are deliberately reported as BLOCKED (manual) — they are never
 * reported as PASS from an assumption.
 *
 * Required environment (supplied securely by the operator, never committed):
 *   PHASE11_STAGING_CONFIRMED=yes
 *   PHASE11_STAGING_PROJECT_REF=<20-char staging ref>
 *   PHASE11_STAGING_VERCEL_PROJECT=<dedicated project name containing "staging">
 *   NEXT_PUBLIC_APP_ENV=staging
 *   NEXT_PUBLIC_SUPABASE_URL=https://<staging-ref>.supabase.co
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<staging anon/publishable key>
 *   SUPABASE_SERVICE_ROLE_KEY=<staging server-only key>
 *   NEXT_PUBLIC_SITE_URL=<verified staging HTTPS URL>
 *   PHASE11_STAGING_USER_A_EMAIL / PASSWORD
 *   PHASE11_STAGING_USER_B_EMAIL / PASSWORD
 *   PHASE11_STAGING_ALLOW_WRITES=1
 */

import { createClient } from '@supabase/supabase-js'
import { checkStagingIdentity, REQUIRED_TABLES } from './phase11-staging-identity.mjs'

function fromEnv(name) {
  const raw = process.env[name]
  return typeof raw === 'string' ? raw.trim() : ''
}

const results = []
function record(name, status, detail = '') {
  results.push({ name, status, detail })
  console.log(`${status.padEnd(7)} ${name}${detail ? ` — ${detail}` : ''}`)
}

function finish() {
  const pass = results.filter((r) => r.status === 'PASS').length
  const fail = results.filter((r) => r.status === 'FAIL').length
  const blocked = results.filter((r) => r.status === 'BLOCKED').length
  console.log(`\nSummary: ${pass} PASS, ${fail} FAIL, ${blocked} BLOCKED`)
  process.exitCode = fail ? 1 : blocked ? 2 : 0
}

function clientFor(token) {
  const publishableKey =
    fromEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || fromEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return createClient(fromEnv('NEXT_PUBLIC_SUPABASE_URL'), publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        'X-Phase11-Staging-Verification': '1',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  })
}

async function signIn(email, password) {
  const auth = clientFor()
  const { data, error } = await auth.auth.signInWithPassword({ email, password })
  if (error || !data.session?.access_token) throw error ?? new Error('no access token returned')
  return { token: data.session.access_token, userId: data.user.id }
}

async function main() {
  const identity = checkStagingIdentity(process.env)
  for (const result of identity.results) record(`identity: ${result.name}`, result.status, result.detail)
  if (!identity.ok) {
    console.log('\nBLOCKED — hosted verification aborted before any network request.')
    return finish()
  }
  if (fromEnv('PHASE11_STAGING_ALLOW_WRITES').toLowerCase() !== '1') {
    record('explicit hosted write opt-in', 'BLOCKED', 'set PHASE11_STAGING_ALLOW_WRITES=1')
    console.log('\nBLOCKED — hosted verification aborted before any network request.')
    return finish()
  }
  record('explicit hosted write opt-in', 'PASS', 'PHASE11_STAGING_ALLOW_WRITES=1')

  const url = fromEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anon = clientFor()
  const service = createClient(url, fromEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const probe = `phase11-${Date.now()}-${Math.floor(Math.random() * 100000)}`

  try {
    const { error } = await anon.from('profiles').select('id').limit(1)
    record('staging database connectivity (anon REST)', error ? 'FAIL' : 'PASS', error?.message ?? 'reachable')
  } catch (error) {
    record('staging database connectivity (anon REST)', 'FAIL', String(error?.message ?? error))
  }

  const missing = []
  for (const table of REQUIRED_TABLES) {
    const { error } = await service.from(table).select('*').limit(0)
    if (error) missing.push(`${table}:${error.code ?? error.message}`)
  }
  record(
    'migrated schema present on staging',
    missing.length === 0 ? 'PASS' : 'FAIL',
    missing.length ? missing.join(', ') : `${REQUIRED_TABLES.length} tables present`
  )

  let a, b
  try {
    a = await signIn(fromEnv('PHASE11_STAGING_USER_A_EMAIL'), fromEnv('PHASE11_STAGING_USER_A_PASSWORD'))
    b = await signIn(fromEnv('PHASE11_STAGING_USER_B_EMAIL'), fromEnv('PHASE11_STAGING_USER_B_PASSWORD'))
    record('two independent staging users can log in', 'PASS', 'User A and User B')
  } catch (error) {
    record('two independent staging users can log in', 'FAIL', String(error?.message ?? error))
    return finish()
  }

  const alice = clientFor(a.token)
  const bob = clientFor(b.token)
  const probeIds = { a: null, b: null }

  try {
    const { data, error } = await alice.from('posts').insert({
      author_id: a.userId,
      title: `Phase11 A ${probe}`,
      slug: `phase11-a-${probe}`,
      body: 'Temporary hosted staging verification row.',
      status: 'DRAFT',
      access_level: 'FREE',
    }).select('id').single()
    if (error) throw error
    probeIds.a = data.id

    const { data: bdata, error: berror } = await bob.from('posts').insert({
      author_id: b.userId,
      title: `Phase11 B ${probe}`,
      slug: `phase11-b-${probe}`,
      body: 'Temporary hosted staging verification row.',
      status: 'PUBLISHED',
      access_level: 'FREE',
    }).select('id').single()
    if (berror) throw berror
    probeIds.b = bdata.id

    record('User A create authorized record', 'PASS', 'post inserted')
    record('User B create authorized record', 'PASS', 'post inserted')

    const [aRead, bRead, anonRead] = await Promise.all([
      alice.from('posts').select('id,title').eq('id', probeIds.a),
      bob.from('posts').select('id,title').eq('id', probeIds.a),
      anon.from('posts').select('id,title').eq('id', probeIds.a),
    ])
    record(
      'User A reads own private record',
      aRead.error ? 'FAIL' : (aRead.data?.length ?? 0) === 1 ? 'PASS' : 'FAIL',
      `${aRead.data?.length ?? 0} row`
    )
    record(
      'User B and anonymous cannot read User A private record',
      !bRead.error && !anonRead.error && (bRead.data?.length ?? 0) === 0 && (anonRead.data?.length ?? 0) === 0
        ? 'PASS'
        : 'FAIL',
      `User B=${bRead.data?.length ?? 0}, anon=${anonRead.data?.length ?? 0}`
    )

    const { data: denied, error: deniedError } = await bob
      .from('posts')
      .update({ title: 'Phase11 cross-user overwrite' })
      .eq('id', probeIds.a)
      .select('id')
    const { data: unchanged } = await alice.from('posts').select('title').eq('id', probeIds.a)
    record(
      'User B cannot modify User A private record',
      !deniedError && (denied?.length ?? 0) === 0 && unchanged?.[0]?.title === `Phase11 A ${probe}`
        ? 'PASS'
        : 'FAIL',
      `${denied?.length ?? 0} rows changed`
    )

    const { error: updateError } = await bob
      .from('posts')
      .update({ title: `Phase11 B ${probe} updated` })
      .eq('id', probeIds.b)
    const { data: updated } = await bob.from('posts').select('title').eq('id', probeIds.b)
    record(
      'User B can update own record',
      !updateError && updated?.[0]?.title === `Phase11 B ${probe} updated` ? 'PASS' : 'FAIL',
      updateError?.message ?? 'updated'
    )

    const reuse = clientFor(a.token)
    const { data: reused, error: reuseError } = await reuse.from('posts').select('id').eq('id', probeIds.a)
    record(
      'session persistence with same token',
      !reuseError && (reused?.length ?? 0) === 1 ? 'PASS' : 'FAIL',
      `${reused?.length ?? 0} row`
    )

    // A JWT remains cryptographically valid after client-side signOut, so a
    // REST probe cannot prove browser-level logout. This is verified manually.
    record('logout in the browser session', 'BLOCKED', 'requires manual browser session check')

    const { error: deleteA } = await clientFor(a.token).from('posts').delete().eq('id', probeIds.a)
    const { error: deleteB } = await bob.from('posts').delete().eq('id', probeIds.b)
    if (deleteA || deleteB) {
      await service.from('posts').delete().in('id', [probeIds.a, probeIds.b])
    }
    const { data: leftovers } = await service.from('posts').select('id').in('id', [probeIds.a, probeIds.b])
    record(
      'authorized delete and probe cleanup',
      (leftovers?.length ?? 0) === 0 ? 'PASS' : 'FAIL',
      `${leftovers?.length ?? 0} probe rows remaining`
    )
  } catch (error) {
    record('hosted CRUD / RLS probe', 'FAIL', String(error?.message ?? error))
    if (probeIds.a || probeIds.b) {
      await service.from('posts').delete().in('id', Object.values(probeIds).filter(Boolean))
    }
  }

  record(
    'registration + email verification (real email + callback)',
    'BLOCKED',
    'requires operator-observed email delivery and callback confirmation'
  )
  record(
    'password recovery + reset (real email + callback)',
    'BLOCKED',
    'requires operator-observed recovery email and successful reset login'
  )
  record('protected route access in browser', 'BLOCKED', 'requires manual authenticated browser session on staging URL')

  finish()
}

main().catch((error) => {
  console.error('BLOCKED phase11:staging harness error:', String(error?.message ?? error))
  process.exitCode = 2
})
