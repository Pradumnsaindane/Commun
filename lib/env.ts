/**
 * Environment configuration guards.
 *
 * The repository ships `.env.example` with readable placeholders. Copying that
 * file to `.env.local` without replacing the values used to look "configured"
 * to feature checks, which produced DNS failures against fake hosts and
 * disabled safe fallbacks. Treat known placeholder markers as absent.
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

export type EnvLike = Record<string, string | undefined>

/** True only for a non-empty value that is not a documented placeholder. */
export function isConfiguredValue(value: string | null | undefined): value is string {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false
  const lowered = trimmed.toLowerCase()
  return !PLACEHOLDER_MARKERS.some((marker) => lowered.includes(marker))
}

export function hasSupabaseConfiguration(env: EnvLike = process.env): boolean {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return isConfiguredValue(url) && /^https:\/\//i.test(url) && isConfiguredValue(key)
}

export function hasServiceRoleConfiguration(env: EnvLike = process.env): boolean {
  return hasSupabaseConfiguration(env) && isConfiguredValue(env.SUPABASE_SERVICE_ROLE_KEY)
}

export function hasUpstashConfiguration(env: EnvLike = process.env): boolean {
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN
  return isConfiguredValue(url) && /^https:\/\//i.test(url) && isConfiguredValue(token)
}
