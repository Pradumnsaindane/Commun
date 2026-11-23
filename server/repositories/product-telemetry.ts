import type { SupabaseClient } from '@supabase/supabase-js'

export async function insertFeedback(
  supabase: SupabaseClient,
  payload: Record<string, unknown>
) {
  return supabase.from('beta_feedback').insert(payload)
}

export async function insertProductEvent(
  supabase: SupabaseClient,
  payload: Record<string, unknown>
) {
  return supabase.from('product_events').insert(payload)
}
