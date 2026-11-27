#!/usr/bin/env node
/**
 * Phase 11C — local Supabase verification harness.
 *
 * SAFETY: this script only targets the disposable CLI stack. It reads the
 * gitignored .env.local, then refuses to make any network request unless
 * NEXT_PUBLIC_APP_ENV=local and the Supabase URL is an HTTP loopback URL.
 * No hosted/staging/production credential can satisfy those checks.
 *
 * Verified with real GoTrue and PostgREST requests:
 *   - both seeded users can sign in with a password
 *   - seeded data survived migrations/seed (persistence)
 *   - Alice sees her own draft; Bob cannot see it (two-user RLS isolation)
 *   - Bob cannot update Alice's post
 *   - a new post written by Bob persists, then can be deleted by Bob
 *   - notifications are visible only to their recipient
 *
 * Results are explicit PASS / FAIL / BLOCKED. Missing configuration is
 * BLOCKED, never PASS. No mocks are used.
 */

import { readFileSync } from 'node:fs'
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

function readLocalEnv() {
  const values = {}
  try {
    const contents = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
      if (!match) continue
      const value = match[2].replace(/^["']|["']$/g, '')
      if (value) values[match[1]] = value
    }
  } catch {
    // Missing .env.local is reported as BLOCKED below, not as a crash.
  }
  return values
}

function configured(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return false
  return !PLACEHOLDER_MARKERS.some((marker) => trimmed.toLowerCase().includes(marker))
}

function isLoopbackHttp(value) {
  try {
    const parsed = new URL(value)
    return (
      parsed.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname.replace(/^\[|\]$/g, ''))
    )
  } catch {
    return false
  }
}

const env = readLocalEnv()
const url = String(env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const anonKey = String(
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
).trim()
const appEnv = String(env.NEXT_PUBLIC_APP_ENV ?? '').trim().toLowerCase()

const results = []
function record(name, status, detail = '') {
  results.push({ name, status, detail })
  console.log(`${status.padEnd(7)} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function failIfNotLocal() {
  if (appEnv !== 'local') {
    console.error(
      `BLOCKED phase11:local requires NEXT_PUBLIC_APP_ENV=local in .env.local (got "${appEnv || '<empty>'}").`
    )
    process.exit(2)
  }
  if (!isLoopbackHttp(url)) {
    console.error(
      'BLOCKED phase11:local requires a loopback HTTP NEXT_PUBLIC_SUPABASE_URL. Refusing to contact a hosted project.'
    )
    process.exit(2)
  }
  if (!configured(anonKey)) {
    console.error('BLOCKED phase11:local requires a real local anon key in .env.local.')
    process.exit(2)
  }
  if (!process.env.PHASE11_ALLOW_WRITES) {
    console.error(
      'BLOCKED phase11:local requires PHASE11_ALLOW_WRITES=1 because this harness performs seed-data writes.'
    )
    process.exit(2)
  }
}

const ALICE = {
  email: 'alice@local.commun.test',
  password: 'LocalTest123!',
  id: '11111111-1111-4111-8111-111111111111',
  postId: '44444444-4444-4444-8444-444444444442',
}
const BOB = {
  email: 'bob@local.commun.test',
  password: 'LocalTest123!',
  id: '22222222-2222-4222-8222-222222222222',
}

const client = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'X-Phase11-Local-Verification': '1' } },
})

async function signIn(user) {
  const { data, error } = await client.auth.signInWithPassword(user)
  if (error || !data.session?.access_token) throw error ?? new Error('no access token returned')
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  })
}

async function main() {
  await failIfNotLocal()

  let alice, bob
  try {
    alice = await signIn(ALICE)
    bob = await signIn(BOB)
    record('seeded users can sign in with passwords', 'PASS', 'Alice and Bob')
  } catch (error) {
    record('seeded users can sign in with passwords', 'FAIL', String(error.message ?? error))
    return finish()
  }

  try {
    const { data, error } = await alice.from('profiles').select('id').eq('id', ALICE.id)
    if (error) throw error
    record('seeded profiles persisted', data?.length === 1 ? 'PASS' : 'FAIL', `${data?.length ?? 0} row`)
  } catch (error) {
    record('seeded profiles persisted', 'FAIL', String(error.message ?? error))
  }

  let alicePosts, bobPosts
  try {
    const select = 'id,author_id,slug,title,status'
    const [a, b] = await Promise.all([
      alice.from('posts').select(select),
      bob.from('posts').select(select),
    ])
    if (a.error) throw a.error
    if (b.error) throw b.error
    alicePosts = a.data ?? []
    bobPosts = b.data ?? []

    const aliceSeesOwnDraft = alicePosts.some((p) => p.id === ALICE.postId)
    const bobSeesAliceDraft = bobPosts.some((p) => p.id === ALICE.postId)
    record(
      'two-user RLS: author sees own draft, other user does not',
      aliceSeesOwnDraft && !bobSeesAliceDraft ? 'PASS' : 'FAIL',
      `Alice=${alicePosts.length} posts, Bob=${bobPosts.length} posts`
    )
  } catch (error) {
    record('two-user RLS: author sees own draft, other user does not', 'FAIL', String(error.message ?? error))
  }

  try {
    const { data, error } = await bob
      .from('posts')
      .update({ title: 'Bob attempted overwrite' })
      .eq('id', ALICE.postId)
      .select('id')
    if (error) throw error
    const { data: verify } = await alice.from('posts').select('title').eq('id', ALICE.postId)
    const unchanged = verify?.[0]?.title === 'Alice private draft'
    record(
      'two-user RLS: cross-user update denied',
      (data?.length ?? 0) === 0 && unchanged ? 'PASS' : 'FAIL',
      `updated rows=${data?.length ?? 0}`
    )
  } catch (error) {
    record('two-user RLS: cross-user update denied', 'FAIL', String(error.message ?? error))
  }

  const probeId = '77777777-7777-4777-8777-777777777771'
  try {
    const { error: insertError } = await bob.from('posts').insert({
      id: probeId,
      author_id: BOB.id,
      title: 'Phase 11 local persistence probe',
      slug: `phase11-local-probe-${Date.now()}`,
      body: 'Temporary row written and removed by the local verification harness.',
      status: 'PUBLISHED',
      access_level: 'FREE',
    })
    if (insertError) throw insertError
    const { data: readback, error: readError } = await bob
      .from('posts')
      .select('id')
      .eq('id', probeId)
    if (readError) throw readError
    record(
      'authenticated CRUD write persists',
      readback?.length === 1 ? 'PASS' : 'FAIL',
      `${readback?.length ?? 0} row after insert`
    )
    const { error: deleteError } = await bob.from('posts').delete().eq('id', probeId)
    if (deleteError) throw deleteError
    const { data: afterDelete } = await bob.from('posts').select('id').eq('id', probeId)
    record(
      'authenticated CRUD delete persists',
      (afterDelete?.length ?? 0) === 0 ? 'PASS' : 'FAIL',
      `${afterDelete?.length ?? 0} row after delete`
    )
  } catch (error) {
    record('authenticated CRUD write/delete', 'FAIL', String(error.message ?? error))
    try {
      await bob.from('posts').delete().eq('id', probeId)
    } catch {}
  }

  try {
    const [a, b] = await Promise.all([
      alice.from('notifications').select('id'),
      bob.from('notifications').select('id'),
    ])
    if (a.error) throw a.error
    if (b.error) throw b.error
    record(
      'notifications are recipient-scoped',
      (a.data?.length ?? 0) >= 1 && (b.data?.length ?? 0) === 0 ? 'PASS' : 'FAIL',
      `Alice=${a.data?.length ?? 0}, Bob=${b.data?.length ?? 0}`
    )
  } catch (error) {
    record('notifications are recipient-scoped', 'FAIL', String(error.message ?? error))
  }

  finish()
}

function finish() {
  const failed = results.some((r) => r.status === 'FAIL')
  console.log(
    `\nSummary: ${results.filter((r) => r.status === 'PASS').length} PASS, ${
      results.filter((r) => r.status === 'FAIL').length
    } FAIL`
  )
  process.exitCode = failed ? 1 : 0
}

main().catch((error) => {
  console.error('BLOCKED phase11:local harness error:', error?.message ?? error)
  process.exitCode = 2
})
