#!/usr/bin/env node
/**
 * Phase D connectivity preflight.
 *
 * Prints a secret-safe report and exits non-zero when the deployment cannot
 * reach a real Supabase project. Usage:
 *
 *   npm run verify:connectivity
 *   PHASE_D_SUPABASE_URL=... PHASE_D_SUPABASE_ANON_KEY=... \
 *     node scripts/phase-d-connectivity.mjs
 *
 * The script never prints URLs with project refs, keys, tokens, or raw error
 * bodies. It performs read-only requests.
 */

import { existsSync, readFileSync } from 'node:fs'
import dns from 'node:dns/promises'
import tls from 'node:tls'
import { createClient } from '@supabase/supabase-js'

// Load `.env.local` without overriding variables already exported by the
// caller, so CI can provide an isolated project explicitly.
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

function secretValues() {
  return [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.KV_REST_API_TOKEN,
    process.env.UPSTASH_REDIS_REST_TOKEN,
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_WEBHOOK_SECRET,
  ].filter((value) => configured(value))
}

function sanitize(value, max = 240) {
  if (value === undefined || value === null) return value
  let text = String(value)
  for (const secret of secretValues()) {
    if (secret.length > 8) text = text.split(secret).join('<redacted>')
  }
  text = text.replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '<jwt-redacted>')
  text = text.replace(/sb_(publishable|secret)_[A-Za-z0-9_-]+/g, 'sb_$1_<redacted>')
  return text.slice(0, max)
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

function shape(value) {
  if (!configured(value)) return { present: Boolean(value), configured: false }
  return {
    present: true,
    configured: true,
    length: value.length,
    whitespace: value !== value.trim(),
  }
}

async function tlsProbe(host) {
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port: 443, servername: host, timeout: 12_000 }, () => {
      resolve({
        ok: true,
        authorized: socket.authorized,
        protocol: socket.getProtocol(),
      })
      socket.end()
    })
    socket.on('timeout', () => {
      resolve({ ok: false, code: 'TLS_TIMEOUT' })
      socket.destroy()
    })
    socket.on('error', (error) => resolve({ ok: false, code: error.code ?? 'TLS_ERROR' }))
  })
}

async function httpProbe(baseUrl, path, key) {
  try {
    const response = await fetch(new URL(path, baseUrl), {
      headers: { apikey: key, authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    })
    await response.text()
    return { path, status: response.status, ok: response.ok }
  } catch (error) {
    return {
      path,
      error: error.name,
      code: error.cause?.code ?? null,
      message: sanitize(error.message, 160),
    }
  }
}

const url = process.env.PHASE_D_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const anon =
  process.env.PHASE_D_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.PHASE_D_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
const kvUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
const kvToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN

const report = {
  supabase: {
    url: url ? maskedHost(url) : null,
    urlConfigured: configured(url),
    anonKey: shape(anon),
    serviceKey: shape(service),
  },
  upstash: {
    url: kvUrl ? maskedHost(kvUrl) : null,
    configured: configured(kvUrl) && configured(kvToken),
  },
  stripe: {
    secretKey: shape(process.env.STRIPE_SECRET_KEY),
    mode: configured(process.env.STRIPE_SECRET_KEY)
      ? process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')
        ? 'live'
        : 'test'
      : 'unconfigured',
    webhookSecret: shape(process.env.STRIPE_WEBHOOK_SECRET),
    membershipPrice: shape(process.env.STRIPE_PRICE_MEMBERSHIP_MONTHLY),
  },
  nodeVersion: process.version,
}

if (!configured(url) || !configured(anon)) {
  report.verdict = 'blocked'
  report.reason = 'Supabase URL or publishable key is missing or still a placeholder.'
  console.log(JSON.stringify(report, null, 2))
  process.exitCode = 1
} else {
  const host = new URL(url).hostname
  try {
    const addresses = await dns.lookup(host, { all: true })
    report.dns = { ok: true, addresses: addresses.map((entry) => `IPv${entry.family}`) }
  } catch (error) {
    report.dns = { ok: false, code: error.code ?? 'DNS_ERROR' }
  }

  report.tls = report.dns.ok ? await tlsProbe(host) : { ok: false, code: 'SKIPPED' }
  report.http = [
    await httpProbe(url, '/auth/v1/health', anon),
    await httpProbe(url, '/rest/v1/profiles?select=id&limit=1', anon),
  ]

  if (configured(service)) {
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
    try {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
      report.serviceRole = error
        ? { ok: false, error: sanitize(error.message, 160) }
        : { ok: true, usersVisible: data.users.length > 0 }
    } catch (error) {
      report.serviceRole = { ok: false, error: sanitize(error.message, 160) }
    }
  }

  const reachable =
    report.dns.ok &&
    report.tls.ok &&
    report.http.every((probe) => probe.ok !== false) &&
    (!report.serviceRole || report.serviceRole.ok)

  report.verdict = reachable ? 'reachable' : 'unreachable'
  if (!reachable) {
    report.reason = 'One or more network, TLS, REST, or service-role probes failed.'
    process.exitCode = 2
  }

  console.log(JSON.stringify(report, null, 2))
}
