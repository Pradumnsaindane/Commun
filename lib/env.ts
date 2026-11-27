/**
 * Environment configuration guards for Commun.dev.
 *
 * Provides strict, environment-aware access to Supabase and related
 * configuration. Known placeholder markers are treated as absent so the
 * application fails fast with a clear error instead of silently connecting
 * to a fake host or fabricating credentials.
 *
 * Environment names (NEXT_PUBLIC_APP_ENV):
 *   - local     disposable local Supabase CLI stack (loopback HTTP allowed)
 *   - staging   dedicated isolated Supabase project (https only)
 *   - production production project (https only; never touched by Phase 11)
 */

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

// Hard-coded fallback values that must never be used as real configuration.
const FALLBACK_URL = 'https://placeholder.supabase.co'
const FALLBACK_ANON_KEY = 'placeholder-anon-key'

export type EnvName = 'local' | 'staging' | 'production'

export type EnvLike = Record<string, string | undefined>

/** True only for a non-empty value that is not a documented placeholder. */
export function isConfiguredValue(value: string | null | undefined): value is string {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false
  const lowered = trimmed.toLowerCase()
  return !PLACEHOLDER_MARKERS.some((marker) => lowered.includes(marker))
}

/** Reads the `role` claim of a JWT without verifying it (format detection only). */
function jwtRole(value: string): string | null {
  const parts = value.split('.')
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded)) as { role?: unknown }
    return typeof payload.role === 'string' ? payload.role : null
  } catch {
    return null
  }
}

/**
 * True when a value looks like a privileged Supabase key. Such a value must
 * never be placed in a NEXT_PUBLIC_* variable, which is bundled into browser
 * JavaScript by Next.js.
 */
export function isSecretSupabaseKey(value: string | null | undefined): boolean {
  if (typeof value !== 'string' || !value.trim()) return false
  const trimmed = value.trim()
  return /^sb_secret_/i.test(trimmed) || jwtRole(trimmed) === 'service_role'
}

/** Plain HTTP is acceptable only for a loopback staging stack (local CLI). */
export function isLoopbackHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase()
    return parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(host)
  } catch {
    return false
  }
}

export function resolveEnvName(env: EnvLike = process.env): EnvName {
  const raw = (env.NEXT_PUBLIC_APP_ENV ?? 'local').trim().toLowerCase()
  switch (raw) {
    case 'local':
      return 'local'
    case 'staging':
      return 'staging'
    case 'production':
      return 'production'
    default:
      throw new Error(
        `Unrecognized NEXT_PUBLIC_APP_ENV "${raw}". Expected one of: local, staging, production.`
      )
  }
}

export function isLocal(env: EnvLike = process.env): boolean {
  try {
    return resolveEnvName(env) === 'local'
  } catch {
    return true
  }
}

export function isStaging(env: EnvLike = process.env): boolean {
  try {
    return resolveEnvName(env) === 'staging'
  } catch {
    return false
  }
}

export function isProduction(env: EnvLike = process.env): boolean {
  try {
    return resolveEnvName(env) === 'production'
  } catch {
    return false
  }
}

/**
 * Validated Supabase project URL for the current environment.
 *
 * Throws a clear, actionable error when the URL is missing, a placeholder,
 * the old hard-coded fallback, or a loopback URL used outside of local.
 * Never silently falls back to a placeholder or production URL.
 */
export function getSupabaseUrl(env: EnvLike = process.env): string {
  const envName = resolveEnvName(env)
  const raw = env.NEXT_PUBLIC_SUPABASE_URL
  const trimmed = (raw ?? '').trim()

  if (!trimmed) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL. Copy .env.local.example to .env.local and set it for your environment.'
    )
  }
  if (!isConfiguredValue(trimmed)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL is still a placeholder ("${trimmed}"). Set a real Supabase project URL for the ${envName} environment.`
    )
  }
  if (trimmed === FALLBACK_URL) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is using the removed placeholder fallback. Set a real Supabase project URL.'
    )
  }

  const isLoopback = isLoopbackHttpUrl(trimmed)
  if (isLoopback && envName !== 'local') {
    throw new Error(
      'Loopback Supabase URL (http://localhost:54321 or http://127.0.0.1:54321) is only allowed in the local environment.'
    )
  }
  if (!isLoopback && !/^https:\/\//i.test(trimmed)) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must use https:// in staging and production.')
  }
  if (envName !== 'local') {
    let host: string
    try {
      host = new URL(trimmed).hostname
    } catch {
      throw new Error(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${trimmed}".`)
    }
    if (host !== 'supabase.co' && !host.endsWith('.supabase.co')) {
      throw new Error(
        `NEXT_PUBLIC_SUPABASE_URL must be a *.supabase.co project URL in ${envName}, got "${host}".`
      )
    }
  }

  return trimmed
}

/**
 * Validated client-safe Supabase key for the current environment.
 *
 * `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is preferred. The deprecated
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains a fallback for deployments that have
 * not been migrated yet. Blank or placeholder values do not block the fallback;
 * the first genuinely configured value wins. Secret/service-role keys are
 * rejected so they can never be bundled into browser code.
 */
export function getSupabasePublishableKey(env: EnvLike = process.env): string {
  const envName = resolveEnvName(env)
  const candidates = [
    { name: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', raw: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', raw: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
  ] as const

  const configured = candidates.find(({ raw }) => isConfiguredValue(raw))
  if (configured) {
    const trimmed = (configured.raw as string).trim()
    if (isSecretSupabaseKey(trimmed)) {
      throw new Error(
        `${configured.name} contains a service-role/secret key. Secret keys must never be exposed in NEXT_PUBLIC_* variables.`
      )
    }
    if (trimmed === FALLBACK_ANON_KEY) {
      throw new Error(
        `${configured.name} is using the removed placeholder fallback. Set a real publishable key.`
      )
    }
    return trimmed
  }

  const placeholder = candidates.find(({ raw }) => typeof raw === 'string' && raw.trim())
  if (placeholder) {
    throw new Error(
      `${placeholder.name} is still a placeholder ("${(placeholder.raw as string).trim()}"). Set a real publishable key for the ${envName} environment (the legacy NEXT_PUBLIC_SUPABASE_ANON_KEY is accepted as a fallback).`
    )
  }
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY). Copy .env.local.example to .env.local and set it for your environment.'
  )
}

/**
 * Backward-compatible alias for callers using the legacy name.
 * Both names resolve to the same validated, client-safe key.
 */
export function getSupabaseAnonKey(env: EnvLike = process.env): string {
  return getSupabasePublishableKey(env)
}

/**
 * Server-only service-role key. Returns null when not configured so optional
 * privileged operations can degrade explicitly instead of throwing.
 */
export function getServiceRoleKey(env: EnvLike = process.env): string | null {
  const raw = env.SUPABASE_SERVICE_ROLE_KEY
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return null
  if (!isConfiguredValue(trimmed)) return null
  return trimmed
}

export function getAppUrl(env: EnvLike = process.env): string | null {
  const trimmed = (env.NEXT_PUBLIC_SITE_URL ?? '').trim()
  return trimmed || null
}

/**
 * Full environment validation report. Never throws; callers can render the
 * problems list as actionable setup instructions.
 */
export interface EnvValidation {
  envName: EnvName
  supabase: {
    configured: boolean
    url?: string
    /** Valid client-safe key present under either the publishable or legacy name. */
    publishableKey?: boolean
    /** Deprecated field retained for existing callers. */
    anonKey?: boolean
  }
  serviceRole: boolean
  appUrl?: string | null
  problems: string[]
}

export function validateEnv(env: EnvLike = process.env): EnvValidation {
  const problems: string[] = []
  let envName: EnvName = 'local'
  try {
    envName = resolveEnvName(env)
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error))
  }

  let supabaseConfigured = false
  let url: string | undefined
  let publishableKey = false
  try {
    url = getSupabaseUrl(env)
    getSupabasePublishableKey(env)
    supabaseConfigured = true
    publishableKey = true
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error))
  }

  const serviceRole = getServiceRoleKey(env) !== null
  if (!serviceRole && envName !== 'local') {
    problems.push(
      `SUPABASE_SERVICE_ROLE_KEY is not configured for the ${envName} environment.`
    )
  }

  const appUrl = getAppUrl(env)

  return {
    envName,
    supabase: {
      configured: supabaseConfigured,
      url,
      publishableKey,
      anonKey: publishableKey,
    },
    serviceRole,
    appUrl,
    problems,
  }
}

/**
 * Requires a fully configured Supabase client environment. Throws with a
 * clear, actionable error when any required value is missing or a placeholder.
 */
export function requireSupabaseConfiguration(env: EnvLike = process.env): void {
  getSupabaseUrl(env)
  getSupabasePublishableKey(env)
  if (!getServiceRoleKey(env) && !isLocal(env)) {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY is required for the ${resolveEnvName(env)} environment.`
    )
  }
}

/** Existing detection helpers, preserved for backward compatibility. */

export function hasSupabaseConfiguration(env: EnvLike = process.env): boolean {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const secureUrl = /^https:\/\//i.test(url ?? '') || isLoopbackHttpUrl(url ?? '')
  if (!isConfiguredValue(url) || !secureUrl) return false
  try {
    getSupabasePublishableKey(env)
    return true
  } catch {
    return false
  }
}

export function hasServiceRoleConfiguration(env: EnvLike = process.env): boolean {
  return hasSupabaseConfiguration(env) && isConfiguredValue(env.SUPABASE_SERVICE_ROLE_KEY)
}

export function hasUpstashConfiguration(env: EnvLike = process.env): boolean {
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN
  return isConfiguredValue(url) && /^https:\/\//i.test(url) && isConfiguredValue(token)
}
