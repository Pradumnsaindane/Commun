import { createBrowserClient } from '@supabase/ssr'
import {
  getBrowserSupabasePublishableKey,
  getBrowserSupabaseUrl,
} from '@/lib/env-browser'

/**
 * Browser Supabase client.
 *
 * Uses statically inlined NEXT_PUBLIC_* values from `@/lib/env-browser` so the
 * browser never relies on a dynamic `process.env` lookup. Fails fast with a
 * clear error when configuration is missing or still a placeholder, instead of
 * silently building a client that would connect to a fake host.
 */
export function createClient() {
  return createBrowserClient(getBrowserSupabaseUrl(), getBrowserSupabasePublishableKey())
}
