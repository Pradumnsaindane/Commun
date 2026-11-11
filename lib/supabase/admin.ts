import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client for the few server-only operations that must not be
 * available to a browser session (account-state transitions, availability
 * checks that must not leak through RLS).
 *
 * Returns null when no service-role key is configured; callers must degrade
 * explicitly instead of assuming elevated access.
 */

let cached: SupabaseClient | null = null

export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL)
}

export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  if (!cached) {
    cached = createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  }
  return cached
}
