import { createClient } from '@supabase/supabase-js'

const supabaseUrl = __COMMUN_SUPABASE_URL__ || import.meta.env.VITE_SUPABASE_URL
const supabaseKey = __COMMUN_SUPABASE_KEY__ || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase configuration is missing. Configure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the project environment.')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export function getRedirectUrl() {
  return __COMMUN_REDIRECT_URL__ || import.meta.env.VITE_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`
}
