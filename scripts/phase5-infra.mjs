#!/usr/bin/env node
/**
 * Phase 5 provider verification.
 *
 * Validates the isolated Supabase project, Stripe test-mode resources, and KV
 * namespace without charging anyone or printing secrets. Every check is
 * read-only except the KV write/TTL/rate-limit probes, which are gated behind
 * PHASE5_ALLOW_KV_WRITE=true and use a unique namespaced key.
 *
 * Required environment:
 *
 *   PHASE5_CONFIRM_ISOLATED=yes
 *   PHASE5_PROJECT_REF=<20-character project ref>
 *   PHASE5_SUPABASE_URL=https://<ref>.supabase.co
 *   PHASE5_SUPABASE_ANON_KEY=...
 *   PHASE5_SUPABASE_SERVICE_ROLE_KEY=...
 *   PHASE5_STRIPE_SECRET_KEY=sk_test_...
 *   PHASE5_STRIPE_WEBHOOK_SECRET=whsec_...
 *   PHASE5_STRIPE_PRICE_ID=price_...
 *   PHASE5_KV_URL=https://<isolated-db>.upstash.io
 *   PHASE5_KV_TOKEN=...
 *   PHASE5_ALLOW_KV_WRITE=true   # required for full KV verification
 *
 * PHASE_D_SUPABASE_* and PHASE_D_PROJECT_REF are accepted as fallbacks for the
 * Supabase values so the existing Phase D runbook keeps working.
 *
 * Exit codes:
 *   0  all required checks passed
 *   1  configuration missing or unsafe target
 *   2  checks passed but KV write verification was skipped
 *   3  one or more checks failed
 *
 * No keys, tokens, project refs, price ids, or raw provider error bodies are
 * printed.
 */

import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

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
  'your-kv',
  'server-only-kv-token',
  'replace-with',
  'sk_test_your',
  'whsec_your',
  'price_your',
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

const secretValues = [
  process.env.PHASE5_SUPABASE_ANON_KEY,
  process.env.PHASE5_SUPABASE_SERVICE_ROLE_KEY,
  process.env.PHASE5_STRIPE_SECRET_KEY,
  process.env.PHASE5_STRIPE_WEBHOOK_SECRET,
  process.env.PHASE5_KV_TOKEN,
].filter((value) => configured(value))

function sanitize(value, max = 200) {
  if (value === undefined || value === null) return value
  let text = String(value)
  for (const secret of secretValues) {
    if (secret.length > 8) text = text.split(secret).join('<redacted>')
  }
  text = text.replace(/sk_(test|live)_[A-Za-z0-9]+/g, 'sk_$1_<redacted>')
  text = text.replace(/whsec_[A-Za-z0-9]+/g, 'whsec_<redacted>')
  text = text.replace(/price_[A-Za-z0-9]+/g, 'price_<redacted>')
  text = text.replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '<jwt-redacted>')
  return text.slice(0, max)
}

const url = firstConfigured('PHASE5_SUPABASE_URL', 'PHASE_D_SUPABASE_URL')
const anon = firstConfigured('PHASE5_SUPABASE_ANON_KEY', 'PHASE_D_SUPABASE_ANON_KEY')
const service = firstConfigured('PHASE5_SUPABASE_SERVICE_ROLE_KEY', 'PHASE_D_SUPABASE_SERVICE_ROLE_KEY')
const projectRef = firstConfigured('PHASE5_PROJECT_REF', 'PHASE_D_PROJECT_REF')
const stripeKey = configured(process.env.PHASE5_STRIPE_SECRET_KEY)
  ? process.env.PHASE5_STRIPE_SECRET_KEY
  : undefined
const webhookSecret = configured(process.env.PHASE5_STRIPE_WEBHOOK_SECRET)
  ? process.env.PHASE5_STRIPE_WEBHOOK_SECRET
  : undefined
const priceId = configured(process.env.PHASE5_STRIPE_PRICE_ID)
  ? process.env.PHASE5_STRIPE_PRICE_ID
  : undefined
const kvUrl = configured(process.env.PHASE5_KV_URL) ? process.env.PHASE5_KV_URL : undefined
const kvToken = configured(process.env.PHASE5_KV_TOKEN) ? process.env.PHASE5_KV_TOKEN : undefined
const confirmed =
  process.env.PHASE5_CONFIRM_ISOLATED === 'yes' || process.env.PHASE_D_CONFIRM_ISOLATED === 'yes'
const allowKvWrite = process.env.PHASE5_ALLOW_KV_WRITE === 'true'

const checks = []
const runId = `phase5-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

function record(name, status, detail) {
  checks.push({ name, status, detail })
}

function skip(name, reason) {
  checks.push({ name, status: 'skip', detail: reason })
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
        mode: 'phase5-provider-verification',
        target: {
          supabase: url ? maskedHost(url) : null,
          kv: kvUrl ? maskedHost(kvUrl) : null,
          stripe: {
            configured: Boolean(stripeKey),
            testMode: Boolean(stripeKey?.startsWith('sk_test_')),
            priceConfigured: Boolean(priceId),
            webhookSecretConfigured: Boolean(webhookSecret),
          },
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

function assertSafeTarget() {
  if (!confirmed) return 'Refusing to run: set PHASE5_CONFIRM_ISOLATED=yes only for a disposable staging project.'
  const missing = []
  if (!url) missing.push('PHASE5_SUPABASE_URL')
  if (!anon) missing.push('PHASE5_SUPABASE_ANON_KEY')
  if (!service) missing.push('PHASE5_SUPABASE_SERVICE_ROLE_KEY')
  if (!stripeKey) missing.push('PHASE5_STRIPE_SECRET_KEY')
  if (!webhookSecret) missing.push('PHASE5_STRIPE_WEBHOOK_SECRET')
  if (!priceId) missing.push('PHASE5_STRIPE_PRICE_ID')
  if (!kvUrl) missing.push('PHASE5_KV_URL')
  if (!kvToken) missing.push('PHASE5_KV_TOKEN')
  if (!projectRef) missing.push('PHASE5_PROJECT_REF')
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
    return 'Refusing to run: the verification project is the application Supabase project.'
  }
  const applicationKv =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  if (configured(applicationKv) && normalizeUrl(applicationKv) === normalizeUrl(kvUrl)) {
    return 'Refusing to run: the verification KV is the application KV namespace.'
  }
  if (stripeKey.startsWith('sk_live_')) {
    return 'Refusing to run: PHASE5_STRIPE_SECRET_KEY is a live key.'
  }
  if (!stripeKey.startsWith('sk_test_')) {
    return 'PHASE5_STRIPE_SECRET_KEY must be a test-mode key (sk_test_...).'
  }
  if (!webhookSecret.startsWith('whsec_')) {
    return 'PHASE5_STRIPE_WEBHOOK_SECRET must start with whsec_.'
  }
  if (!priceId.startsWith('price_')) {
    return 'PHASE5_STRIPE_PRICE_ID must start with price_.'
  }
  let kv
  try {
    kv = new URL(kvUrl)
  } catch {
    return 'PHASE5_KV_URL is not a valid URL.'
  }
  if (kv.protocol !== 'https:') return 'PHASE5_KV_URL must use https.'
  return null
}

async function checkSupabase() {
  const headers = { apikey: anon, authorization: `Bearer ${anon}` }
  try {
    const health = await fetch(new URL('/auth/v1/health', url), {
      headers,
      signal: AbortSignal.timeout(15_000),
    })
    await health.text()
    record('supabase-auth-health', health.status === 200 ? 'pass' : 'fail', `http=${health.status}`)
  } catch (error) {
    record('supabase-auth-health', 'fail', sanitize(error.message))
  }

  try {
    const profiles = await fetch(new URL('/rest/v1/profiles?select=id&limit=1', url), {
      headers,
      signal: AbortSignal.timeout(15_000),
    })
    await profiles.text()
    record('supabase-rest-anon-profiles', profiles.status === 200 ? 'pass' : 'fail', `http=${profiles.status}`)
  } catch (error) {
    record('supabase-rest-anon-profiles', 'fail', sanitize(error.message))
  }

  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    record(
      'supabase-service-role',
      error ? 'fail' : 'pass',
      error ? sanitize(error.message) : `usersVisible=${data.users.length > 0}`
    )
  } catch (error) {
    record('supabase-service-role', 'fail', sanitize(error.message))
  }

  const tables = [
    'profiles',
    'posts',
    'comments',
    'notifications',
    'reports',
    'creator_accounts',
    'billing_customers',
    'memberships',
    'earnings',
    'stripe_webhook_events',
  ]
  const results = await Promise.all(
    tables.map(async (table) => {
      try {
        const { error } = await admin.from(table).select('*').limit(1)
        return { table, error }
      } catch (error) {
        return { table, error }
      }
    })
  )
  for (const result of results) {
    record(
      `schema-table-${result.table}`,
      result.error ? 'fail' : 'pass',
      result.error ? sanitize(result.error.message) : 'reachable'
    )
  }
}

async function checkStripe() {
  const stripe = new Stripe(stripeKey, { maxNetworkRetries: 0, timeout: 15_000 })

  try {
    const balance = await stripe.balance.retrieve()
    record(
      'stripe-key-test-mode',
      balance.livemode === false ? 'pass' : 'fail',
      `livemode=${Boolean(balance.livemode)}`
    )
  } catch (error) {
    record('stripe-key-test-mode', 'fail', sanitize(error.message))
  }

  try {
    const price = await stripe.prices.retrieve(priceId)
    const valid =
      price.active === true &&
      price.type === 'recurring' &&
      price.recurring?.interval === 'month' &&
      price.livemode === false
    record(
      'stripe-membership-price',
      valid ? 'pass' : 'fail',
      `active=${Boolean(price.active)} type=${price.type ?? 'unknown'} interval=${price.recurring?.interval ?? 'none'} livemode=${Boolean(price.livemode)} currency=${price.currency ?? 'unknown'}`
    )
  } catch (error) {
    record('stripe-membership-price', 'fail', sanitize(error.message))
  }

  try {
    const payload = JSON.stringify({
      id: `evt_${runId}`,
      object: 'event',
      type: 'phase5.verification',
      data: { object: {} },
    })
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret })
    const event = stripe.webhooks.constructEvent(payload, header, webhookSecret)
    record('stripe-webhook-signature', event.id === `evt_${runId}` ? 'pass' : 'fail', 'local signature round-trip')
  } catch (error) {
    record('stripe-webhook-signature', 'fail', sanitize(error.message))
  }

  try {
    const endpoints = await stripe.webhookEndpoints.list({ limit: 10 })
    if (endpoints.data.length) {
      record(
        'stripe-webhook-endpoints',
        'pass',
        `count=${endpoints.data.length} enabled=${endpoints.data.filter((endpoint) => endpoint.status === 'enabled').length}`
      )
    } else {
      skip('stripe-webhook-endpoints', 'no dashboard endpoint; use stripe listen or create the staging endpoint')
    }
  } catch (error) {
    skip('stripe-webhook-endpoints', sanitize(error.message))
  }

  const cli = spawnSync('stripe', ['--version'], { encoding: 'utf8', timeout: 5_000 })
  if (cli.status === 0) {
    record('stripe-cli', 'pass', sanitize((cli.stdout || '').trim() || 'available'))
  } else {
    skip('stripe-cli', 'stripe CLI not found on PATH; dashboard or CI delivery is still required')
  }
}

async function kvRequest(path, init = {}) {
  const response = await fetch(`${kvUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${kvToken}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(15_000),
  })
  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { response, json }
}

async function kvCommand(command) {
  const response = await fetch(kvUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${kvToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(15_000),
  })
  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { response, json }
}

async function checkKv() {
  try {
    const ping = await kvRequest('/ping')
    record(
      'kv-connectivity',
      ping.response.ok && ping.json?.result === 'PONG' ? 'pass' : 'fail',
      `http=${ping.response.status}`
    )
  } catch (error) {
    record('kv-connectivity', 'fail', sanitize(error.message))
  }

  const missingKey = `${runId}:missing:${Math.random().toString(36).slice(2, 8)}`
  try {
    const missing = await kvRequest(`/get/${encodeURIComponent(missingKey)}`)
    record(
      'kv-read-missing',
      missing.response.ok && missing.json?.result === null ? 'pass' : 'fail',
      `http=${missing.response.status}`
    )
  } catch (error) {
    record('kv-read-missing', 'fail', sanitize(error.message))
  }

  try {
    const invalid = await fetch(`${kvUrl}/get/${encodeURIComponent(missingKey)}`, {
      headers: { authorization: 'Bearer phase5-invalid-token' },
      signal: AbortSignal.timeout(15_000),
    })
    await invalid.text()
    record(
      'kv-invalid-token-handling',
      invalid.status === 401 || invalid.status === 403 ? 'pass' : 'fail',
      `http=${invalid.status}`
    )
  } catch (error) {
    record('kv-invalid-token-handling', 'fail', sanitize(error.message))
  }

  if (!allowKvWrite) {
    skip('kv-write-roundtrip', 'PHASE5_ALLOW_KV_WRITE is not true')
    skip('kv-ttl-expiration', 'PHASE5_ALLOW_KV_WRITE is not true')
    skip('kv-rate-limit', 'PHASE5_ALLOW_KV_WRITE is not true')
    return
  }

  const writeKey = `${runId}:roundtrip`
  try {
    const set = await kvCommand(['SET', writeKey, 'phase5-ok', 'EX', 30])
    const get = await kvRequest(`/get/${encodeURIComponent(writeKey)}`)
    const ttl = await kvRequest(`/ttl/${encodeURIComponent(writeKey)}`)
    const del = await kvRequest(`/del/${encodeURIComponent(writeKey)}`)
    const after = await kvRequest(`/get/${encodeURIComponent(writeKey)}`)
    const passed =
      set.response.ok &&
      set.json?.result === 'OK' &&
      get.response.ok &&
      get.json?.result === 'phase5-ok' &&
      ttl.response.ok &&
      Number(ttl.json?.result) > 0 &&
      del.response.ok &&
      Number(del.json?.result) === 1 &&
      after.response.ok &&
      after.json?.result === null
    record('kv-write-roundtrip', passed ? 'pass' : 'fail', `ttlObserved=${ttl.json?.result ?? 'none'}`)
  } catch (error) {
    record('kv-write-roundtrip', 'fail', sanitize(error.message))
  }

  const expiryKey = `${runId}:expiry`
  try {
    const set = await kvCommand(['SET', expiryKey, 'phase5-expiry', 'EX', 2])
    await new Promise((resolve) => setTimeout(resolve, 2_500))
    const after = await kvRequest(`/get/${encodeURIComponent(expiryKey)}`)
    record(
      'kv-ttl-expiration',
      set.response.ok && after.response.ok && after.json?.result === null ? 'pass' : 'fail',
      `http=${after.response.status}`
    )
  } catch (error) {
    record('kv-ttl-expiration', 'fail', sanitize(error.message))
  }

  try {
    const redis = new Redis({ url: kvUrl, token: kvToken })
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(2, '10 s'),
      prefix: `commun:phase5:verify:${runId}`,
    })
    const results = []
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await limiter.limit(`probe-${attempt}`)
      results.push(result.success)
    }
    record(
      'kv-rate-limit',
      results[0] === true && results[1] === true && results[2] === false ? 'pass' : 'fail',
      `successes=${results.filter(Boolean).length}/3`
    )
  } catch (error) {
    record('kv-rate-limit', 'fail', sanitize(error.message))
  }
}

async function main() {
  const unsafe = assertSafeTarget()
  if (unsafe) return blocked(unsafe)

  await checkSupabase()
  await checkStripe()
  await checkKv()

  const summary = summarize()
  if (summary.failed > 0) {
    return emit('failed', `${summary.failed} provider check(s) failed.`, 3)
  }
  if (!allowKvWrite) {
    return emit('partial', 'KV write/TTL/rate-limit checks were skipped; set PHASE5_ALLOW_KV_WRITE=true for full verification.', 2)
  }
  return emit('passed', null, 0)
}

main().catch((error) => {
  blocked(`Unhandled verification error: ${sanitize(error.message)}`, 2)
})
