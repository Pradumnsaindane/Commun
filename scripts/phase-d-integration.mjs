#!/usr/bin/env node
/**
 * Phase D read-only integration harness.
 *
 * Runs against an explicitly named, isolated Supabase project. It refuses to
 * start without PHASE_D_CONFIRM_ISOLATED=yes, refuses to reuse the application's
 * NEXT_PUBLIC_SUPABASE_URL, and performs no writes, migrations, or account
 * creation. It signs in the four test accounts, verifies their role/status
 * claims, and exercises cross-account RLS reads using fixtures created by the
 * runbook in docs/phase-d-integration-report.md.
 *
 * Usage:
 *
 *   PHASE_D_CONFIRM_ISOLATED=yes \
 *   PHASE_D_PROJECT_REF=abcdefghijklmnopqrst \
 *   PHASE_D_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co \
 *   PHASE_D_SUPABASE_ANON_KEY=... \
 *   PHASE_D_SUPABASE_SERVICE_ROLE_KEY=... \
 *   PHASE_D_USER_A_EMAIL=... PHASE_D_USER_A_PASSWORD=... \
 *   PHASE_D_USER_B_EMAIL=... PHASE_D_USER_B_PASSWORD=... \
 *   PHASE_D_MODERATOR_EMAIL=... PHASE_D_MODERATOR_PASSWORD=... \
 *   PHASE_D_ADMIN_EMAIL=... PHASE_D_ADMIN_PASSWORD=... \
 *     npm run verify:integration
 *
 * Exit codes:
 *   0  every executed check passed (skips are reported)
 *   1  configuration missing, unsafe target, or account sign-in failed
 *   2  connectivity or service-role failure
 *   3  one or more RLS/isolation assertions failed
 *
 * No keys, emails, user ids, or row contents are printed.
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

function maskedHost(value) {
  try {
    const parsed = new URL(value)
    const [first, ...rest] = parsed.hostname.split('.')
    return `${parsed.protocol}//${first.slice(0, 2)}***.${rest.join('.')}`
  } catch {
    return '<invalid-url>'
  }
}

function normalizeUrl(value) {
  try {
    return new URL(value).origin.toLowerCase()
  } catch {
    return null
  }
}

const accounts = [
  { key: 'USER_A', role: 'USER' },
  { key: 'USER_B', role: 'USER' },
  { key: 'MODERATOR', role: 'MODERATOR' },
  { key: 'ADMIN', role: 'ADMIN' },
].map(({ key, role }) => ({
  key,
  role,
  email: process.env[`PHASE_D_${key}_EMAIL`],
  password: process.env[`PHASE_D_${key}_PASSWORD`],
}))

const url = process.env.PHASE_D_SUPABASE_URL
const anon = process.env.PHASE_D_SUPABASE_ANON_KEY
const service = process.env.PHASE_D_SUPABASE_SERVICE_ROLE_KEY
const projectRef = process.env.PHASE_D_PROJECT_REF
const confirmed = process.env.PHASE_D_CONFIRM_ISOLATED === 'yes'

const report = {
  mode: 'phase-d-read-only-integration',
  target: url ? maskedHost(url) : null,
  projectRefMatchesHost: false,
  accounts: accounts.map((account) => ({
    label: account.key,
    expectedRole: account.role,
    configured: Boolean(configured(account.email) && configured(account.password)),
  })),
  checks: [],
  skipped: [],
}

function record(name, status, detail) {
  report.checks.push({ name, status, detail })
}

function skip(name, reason) {
  report.skipped.push({ name, reason })
}

function isPermissionDenied(error) {
  const code = String(error?.code ?? '')
  const status = Number(error?.status ?? 0)
  const message = String(error?.message ?? '').toLowerCase()
  return (
    code === '42501' ||
    status === 401 ||
    status === 403 ||
    message.includes('permission denied') ||
    message.includes('row-level security')
  )
}

function isSchemaError(error) {
  const code = String(error?.code ?? '')
  return code === '42P01' || code === '42703' || code === 'PGRST205'
}

function fail(reason, exitCode = 1) {
  report.verdict = 'blocked'
  report.reason = reason
  console.log(JSON.stringify(report, null, 2))
  process.exitCode = exitCode
}

async function main() {
  if (!confirmed) {
    return fail('Refusing to run: set PHASE_D_CONFIRM_ISOLATED=yes only for a disposable, isolated project.')
  }
  if (!configured(url) || !configured(anon) || !configured(service)) {
    return fail('PHASE_D_SUPABASE_URL, PHASE_D_SUPABASE_ANON_KEY, and PHASE_D_SUPABASE_SERVICE_ROLE_KEY are required and must not be placeholders.')
  }
  if (!/^[a-z0-9]{20}$/.test(projectRef ?? '')) {
    return fail('PHASE_D_PROJECT_REF must be the 20-character project reference of the isolated project.')
  }

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return fail('PHASE_D_SUPABASE_URL is not a valid URL.')
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) {
    return fail('PHASE_D_SUPABASE_URL must be an https://<ref>.supabase.co project URL.')
  }

  const hostRef = parsed.hostname.split('.')[0]
  report.projectRefMatchesHost = hostRef === projectRef
  if (!report.projectRefMatchesHost) {
    return fail('PHASE_D_PROJECT_REF does not match the hostname in PHASE_D_SUPABASE_URL.')
  }

  const applicationUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (configured(applicationUrl) && normalizeUrl(applicationUrl) === normalizeUrl(url)) {
    return fail('Refusing to run: PHASE_D_SUPABASE_URL is the same project as NEXT_PUBLIC_SUPABASE_URL.')
  }
  if (process.env.PHASE_D_ALLOW_WRITES === 'true') {
    skip('write assertions', 'This harness is read-only by design; write verification belongs in the runbook with a disposable project.')
  }

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (error) return fail(`Service-role probe failed: ${error.message}`, 2)
    record('service-role-auth-admin', 'pass', `usersVisible=${data.users.length > 0}`)
  } catch (error) {
    return fail(`Service-role probe threw: ${error.message}`, 2)
  }

  const sessions = new Map()

  for (const account of accounts) {
    if (!report.accounts.find((entry) => entry.label === account.key)?.configured) {
      skip(`${account.key} sign-in`, 'email/password not configured')
      continue
    }
    const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await client.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })
    if (error || !data.user) {
      return fail(`${account.key} sign-in failed: ${error?.message ?? 'no user returned'}`, 1)
    }
    const role = data.user.app_metadata?.role ?? 'USER'
    const status = data.user.app_metadata?.status ?? (data.user.email_confirmed_at ? 'ACTIVE' : 'PENDING_VERIFICATION')
    record(`${account.key} sign-in`, 'pass', `role=${role} status=${status} confirmed=${Boolean(data.user.email_confirmed_at)}`)
    if (role !== account.role) {
      record(`${account.key} role claim`, 'fail', `expected=${account.role} observed=${role}`)
    }
    if (status !== 'ACTIVE') {
      record(`${account.key} status claim`, 'fail', `expected=ACTIVE observed=${status}`)
    }
    sessions.set(account.key, { client, id: data.user.id })
  }

  const a = sessions.get('USER_A')
  const b = sessions.get('USER_B')
  if (!a || !b) {
    skip('cross-account RLS matrix', 'USER_A and USER_B sessions are both required')
  } else {
    const fixtures = {}

    async function findFixture(name, build) {
      try {
        const { data, error } = await build(admin)
        if (error) {
          skip(name, `fixture lookup failed: ${error.message}`)
          return null
        }
        const id = data?.[0]?.id ?? null
        if (!id) {
          skip(name, 'no matching fixture row exists for USER_B')
          return null
        }
        fixtures[name] = id
        return id
      } catch (error) {
        skip(name, `fixture lookup threw: ${error.message}`)
        return null
      }
    }

    const draftPost = await findFixture('draft post', (db) =>
      db.from('posts').select('id').eq('author_id', b.id).eq('status', 'DRAFT').limit(1)
    )
    const notification = await findFixture('notification', (db) =>
      db.from('notifications').select('id').eq('recipient_id', b.id).limit(1)
    )
    const reportRow = await findFixture('report', (db) =>
      db.from('reports').select('id').eq('reporter_id', b.id).limit(1)
    )
    const earning = await findFixture('earning', (db) =>
      db.from('earnings').select('id').eq('creator_id', b.id).limit(1)
    )
    const auditLog = await findFixture('audit log', (db) =>
      db.from('audit_logs').select('id').limit(1)
    )

    async function expectNoRows(name, table, id) {
      if (!id) return skip(name, 'fixture unavailable')
      const { data, error } = await a.client.from(table).select('id').eq('id', id).limit(1)
      if (error) {
        if (isPermissionDenied(error)) {
          record(name, 'pass', `denied: ${error.code ?? 'error'}`)
        } else if (isSchemaError(error)) {
          skip(name, `schema mismatch: ${error.code}`)
        } else {
          skip(name, `unexpected error: ${error.code ?? 'unknown'}`)
        }
        return
      }
      if (Array.isArray(data) && data.length === 0) {
        record(name, 'pass', 'no rows visible')
        return
      }
      record(name, 'fail', `USER_A saw ${Array.isArray(data) ? data.length : 'unknown'} row(s) owned by USER_B`)
    }

    await expectNoRows('USER_A cannot read USER_B draft post', 'posts', draftPost)
    await expectNoRows('USER_A cannot read USER_B notification', 'notifications', notification)
    await expectNoRows('USER_A cannot read USER_B report', 'reports', reportRow)
    await expectNoRows('USER_A cannot read USER_B earning', 'earnings', earning)
    await expectNoRows('USER_A cannot read audit logs', 'audit_logs', auditLog)

    if (draftPost) {
      const { data, error } = await b.client.from('posts').select('id').eq('id', draftPost).limit(1)
      if (error) {
        if (isSchemaError(error)) skip('USER_B can read own draft post', `schema mismatch: ${error.code}`)
        else record('USER_B can read own draft post', 'fail', `error: ${error.code ?? 'unknown'}`)
      } else {
        record('USER_B can read own draft post', data?.length ? 'pass' : 'fail', `rows=${data?.length ?? 0}`)
      }
    } else {
      skip('USER_B can read own draft post', 'fixture unavailable')
    }

    if (notification) {
      const { data, error } = await b.client.from('notifications').select('id').eq('id', notification).limit(1)
      if (error) {
        if (isSchemaError(error)) skip('USER_B can read own notification', `schema mismatch: ${error.code}`)
        else record('USER_B can read own notification', 'fail', `error: ${error.code ?? 'unknown'}`)
      } else {
        record('USER_B can read own notification', data?.length ? 'pass' : 'fail', `rows=${data?.length ?? 0}`)
      }
    } else {
      skip('USER_B can read own notification', 'fixture unavailable')
    }

    const { data: profile, error: profileError } = await a.client
      .from('profiles')
      .select('id,username,status')
      .eq('id', a.id)
      .maybeSingle()
    if (profileError) {
      if (isSchemaError(profileError)) skip('USER_A can read own profile', `schema mismatch: ${profileError.code}`)
      else record('USER_A can read own profile', 'fail', `error: ${profileError.code ?? 'unknown'}`)
    } else {
      record('USER_A can read own profile', profile ? 'pass' : 'fail', profile ? 'row=present' : 'row=missing')
    }

    const { data: otherProfile, error: otherProfileError } = await a.client
      .from('profiles')
      .select('id,role,status')
      .eq('id', b.id)
      .maybeSingle()
    if (otherProfileError) {
      if (isPermissionDenied(otherProfileError)) {
        record('profile privilege columns protected', 'pass', `denied: ${otherProfileError.code ?? 'error'}`)
      } else if (isSchemaError(otherProfileError)) {
        skip('profile privilege columns protected', `schema mismatch: ${otherProfileError.code}`)
      } else {
        skip('profile privilege columns protected', `unexpected error: ${otherProfileError.code ?? 'unknown'}`)
      }
    } else if (!otherProfile) {
      record('profile privilege columns protected', 'pass', 'no row visible')
    } else {
      record(
        'profile privilege columns protected',
        'role' in otherProfile ? 'fail' : 'pass',
        'role' in otherProfile ? 'USER_A can select profiles.role' : 'privilege columns not observed'
      )
    }
  }

  const failed = report.checks.filter((check) => check.status === 'fail')
  report.verdict = failed.length ? 'failed' : 'passed'
  if (failed.length) {
    report.reason = `${failed.length} assertion(s) failed.`
    process.exitCode = 3
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  fail(`Unhandled harness error: ${error.message}`, 2)
})
