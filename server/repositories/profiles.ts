import type { SupabaseClient } from '@supabase/supabase-js'

export async function findProfileById(
  supabase: SupabaseClient,
  id: string,
  columns = '*'
) {
  return supabase.from('profiles').select(columns).eq('id', id).maybeSingle()
}

export async function findProfileStatus(supabase: SupabaseClient, id: string) {
  return supabase.from('profiles').select('status').eq('id', id).maybeSingle()
}

export async function findUsernameOwner(
  supabase: SupabaseClient,
  username: string,
  excludeId?: string
) {
  let query = supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .limit(1)
  if (excludeId) query = query.neq('id', excludeId)
  return query.maybeSingle()
}

export async function updateProfileById(
  supabase: SupabaseClient,
  id: string,
  payload: Record<string, unknown>,
  columns = '*'
) {
  return supabase.from('profiles').update(payload).eq('id', id).select(columns).maybeSingle()
}

export async function updateProfileWithWriter(
  writer: SupabaseClient,
  id: string,
  payload: Record<string, unknown>
) {
  return writer
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .select('id,username,status')
    .maybeSingle()
}
