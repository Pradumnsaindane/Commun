import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/env'

/**
 * Server Supabase client.
 *
 * Fails fast with a clear error when the Supabase environment is missing or
 * still a placeholder, instead of silently building a client that would
 * connect to a fake host.
 */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {}
      },
    },
  })
}
