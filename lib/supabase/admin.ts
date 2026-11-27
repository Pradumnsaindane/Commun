import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { getServiceRoleKey, getSupabaseUrl } from '@/lib/env'

/**
 * Service-role client for the few server-only operations that must not be
 * available to a browser session (account-state transitions, availability
 * checks that must not leak through RLS).
 *
 * Returns null when no valid service-role configuration is present; callers
 * must degrade explicitly instead of assuming elevated access.
 */

let cached: SupabaseClient | null = null

export function hasServiceRoleKey(): boolean {
  return createAdminClient() !== null
}

export function createAdminClient(): SupabaseClient | null {
  const key = getServiceRoleKey()
  if (!key) return null
  let url: string
  try {
    url = getSupabaseUrl()
  } catch {
    return null
  }
  if (!cached) {
    cached = createSupabaseClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cached
}
