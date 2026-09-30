import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase configuration is missing. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export function getRedirectUrl() {
  return import.meta.env.VITE_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`
}
