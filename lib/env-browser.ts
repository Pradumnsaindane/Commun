/**
 * Browser-safe public environment access.
 *
 * Next.js only inlines *direct static references* such as
 * `process.env.NEXT_PUBLIC_SUPABASE_URL`. It does not inline dynamic lookups
 * through an object like `env.NEXT_PUBLIC_SUPABASE_URL`, and `process.env` is
 * not a populated object in the browser bundle. These module-level constants
 * therefore have to live in their own browser-facing module.
 *
 * Validation stays in `@/lib/env`; this module only supplies the statically
 * inlined values to those existing guards. No server-only variable is read.
 */
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  resolveEnvName,
  type EnvLike,
  type EnvName,
} from '@/lib/env'

// Direct static references: required for Next.js public variable inlining.
const browserSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const browserSupabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const browserLegacySupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const browserAppEnv = process.env.NEXT_PUBLIC_APP_ENV

/**
 * Explicit browser environment object. Keeping both publishable and legacy
 * key fields preserves the existing placeholder/fallback behavior in
 * `getSupabasePublishableKey`.
 */
export const browserEnv: EnvLike = {
  NEXT_PUBLIC_APP_ENV: browserAppEnv,
  NEXT_PUBLIC_SUPABASE_URL: browserSupabaseUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: browserSupabasePublishableKey,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: browserLegacySupabaseAnonKey,
}

/** Validated URL for browser clients, using statically inlined values. */
export function getBrowserSupabaseUrl(env: EnvLike = browserEnv): string {
  return getSupabaseUrl(env)
}

/** Validated client-safe key for browser clients, using statically inlined values. */
export function getBrowserSupabasePublishableKey(env: EnvLike = browserEnv): string {
  return getSupabasePublishableKey(env)
}

/** Validated environment name for browser code that needs environment-aware behavior. */
export function getBrowserEnvName(env: EnvLike = browserEnv): EnvName {
  return resolveEnvName(env)
}
