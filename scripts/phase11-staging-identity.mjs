/**
 * Phase 11M — shared staging identity gate.
 *
 * No hosted request may be made until every check here passes. This module is
 * pure: it never reads .env.local, never contacts a network, and never logs
 * secret values. Callers pass an explicit environment object.
 */

// This ref was previously linked in supabase/.temp and is treated as
// production until an operator proves otherwise. Never stage against it.
const BLOCKED_PRODUCTION_REFS = new Set(['gmhhvrbyjidfhdxakkkm'])

const PLACEHOLDER_MARKERS = [
  'your-project',
  'your-publishable-key',
  'your-anon-key',
  'server-only',
  'placeholder',
  'replace-with',
  'example.supabase.co',
  'changeme',
  'ci_mock',
  'supabase-demo',
]

const REQUIRED_TABLES = [
  'profiles',
  'posts',
  'comments',
  'notifications',
  'reports',
  'audit_logs',
  'discussions',
  'replies',
  'developer_news',
  'saved_news',
  'creator_accounts',
  'memberships',
  'earnings',
  'product_events',
  'billing_customers',
  'stripe_webhook_events',
]

export { REQUIRED_TABLES }

function value(env, name) {
  const raw = env[name]
  return typeof raw === 'string' ? raw.trim() : ''
}

function configured(raw) {
  if (!raw) return false
  const lowered = raw.toLowerCase()
  return !PLACEHOLDER_MARKERS.some((marker) => lowered.includes(marker))
}

function jwtIssuer(token) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return ''
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return typeof decoded.iss === 'string' ? decoded.iss : ''
  } catch {
    return ''
  }
}

function jwtRole(token) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return ''
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return typeof decoded.role === 'string' ? decoded.role : ''
  } catch {
    return ''
  }
}

function isSecretKey(token) {
  return /^sb_secret_/i.test(token) || jwtRole(token) === 'service_role'
}

function hostOf(raw) {
  try {
    return new URL(raw).hostname.toLowerCase()
  } catch {
    return ''
  }
}

/**
 * Returns { results, ok }. Statuses are PASS or BLOCKED only: a missing or
 * unsafe target is a safety block, never a failed test against a real project.
 */
export function checkStagingIdentity(env = process.env) {
  const results = []
  const add = (name, ok, detail) => results.push({ name, status: ok ? 'PASS' : 'BLOCKED', detail })

  const confirmed = value(env, 'PHASE11_STAGING_CONFIRMED').toLowerCase() === 'yes'
  add('explicit staging write confirmation', confirmed, 'PHASE11_STAGING_CONFIRMED=yes')

  const appEnv = value(env, 'NEXT_PUBLIC_APP_ENV').toLowerCase()
  add('environment identity is staging', appEnv === 'staging', `NEXT_PUBLIC_APP_ENV=${appEnv || '<empty>'}`)

  const ref = value(env, 'PHASE11_STAGING_PROJECT_REF')
  const refFormatOk = /^[a-z0-9]{20}$/.test(ref)
  add('staging project ref format', refFormatOk, ref ? `ref=${ref}` : 'ref missing')

  const notProductionRef = Boolean(ref) && !BLOCKED_PRODUCTION_REFS.has(ref)
  add(
    'staging ref is not the previously linked (production) ref',
    notProductionRef,
    notProductionRef ? 'distinct ref confirmed' : 'ref matches blocked production ref'
  )

  const url = value(env, 'NEXT_PUBLIC_SUPABASE_URL')
  let urlOk = false
  try {
    const parsed = new URL(url)
    urlOk = parsed.protocol === 'https:' && parsed.host === `${ref}.supabase.co`
  } catch {
    urlOk = false
  }
  add('Supabase URL matches the confirmed staging ref', urlOk, urlOk ? `host=${hostOf(url)}` : 'URL/ref mismatch or non-HTTPS')

  const anonKey =
    [value(env, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'), value(env, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')].find(
      configured
    ) || ''
  const anonOk = configured(anonKey) && jwtIssuer(anonKey) !== 'supabase-demo' && !isSecretKey(anonKey)
  add(
    'staging publishable key is configured, not local, and not a secret key',
    anonOk,
    anonOk ? 'set' : 'missing/placeholder/local/secret key'
  )

  const serviceKey = value(env, 'SUPABASE_SERVICE_ROLE_KEY')
  const serviceOk = configured(serviceKey) && jwtIssuer(serviceKey) !== 'supabase-demo' && serviceKey !== anonKey
  add('staging service-role key is configured and distinct', serviceOk, serviceOk ? 'set' : 'missing/placeholder/local key or equal to anon key')

  const appUrl = value(env, 'NEXT_PUBLIC_SITE_URL')
  let appUrlOk = false
  try {
    const parsed = new URL(appUrl)
    const host = parsed.hostname.toLowerCase()
    appUrlOk = parsed.protocol === 'https:' && host !== 'commun.dev' && host !== 'www.commun.dev'
  } catch {
    appUrlOk = false
  }
  add('public app URL is HTTPS and not production', appUrlOk, appUrlOk ? `host=${hostOf(appUrl)}` : 'missing/HTTP/production host')

  const vercelProject = value(env, 'PHASE11_STAGING_VERCEL_PROJECT')
  const vercelOk = vercelProject.toLowerCase().includes('staging')
  add(
    'dedicated Vercel staging project declared',
    vercelOk,
    vercelOk ? `project=${vercelProject}` : 'missing or not staging-specific'
  )

  const aEmail = value(env, 'PHASE11_STAGING_USER_A_EMAIL')
  const bEmail = value(env, 'PHASE11_STAGING_USER_B_EMAIL')
  const aPassword = value(env, 'PHASE11_STAGING_USER_A_PASSWORD')
  const bPassword = value(env, 'PHASE11_STAGING_USER_B_PASSWORD')
  const accountsOk =
    configured(aEmail) &&
    configured(bEmail) &&
    aEmail !== bEmail &&
    configured(aPassword) &&
    configured(bPassword) &&
    aPassword !== 'LocalTest123!' &&
    bPassword !== 'LocalTest123!'
  add(
    'two distinct staging test accounts with non-seed passwords',
    accountsOk,
    accountsOk ? 'accounts supplied' : 'missing, identical, or using shared local seed password'
  )

  return {
    results,
    ok: results.every((r) => r.status === 'PASS'),
    context: { ref, url, appUrl, vercelProject },
  }
}
