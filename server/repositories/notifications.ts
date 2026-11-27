import type { SupabaseClient } from '@supabase/supabase-js'

export const NOTIFICATION_COLUMNS =
  'id,actor_id,type,entity_id,target_slug,target_title,read,created_at'

export type NotificationPageArgs = {
  page: number
  limit: number
}

export async function listNotificationsForRecipient(
  supabase: SupabaseClient,
  recipientId: string,
  { page, limit }: NotificationPageArgs
) {
  const from = (page - 1) * limit
  const to = from + limit - 1
  return supabase
    .from('notifications')
    .select(NOTIFICATION_COLUMNS, { count: 'exact' })
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false })
    .range(from, to)
}

export async function countUnreadNotifications(supabase: SupabaseClient, recipientId: string) {
  return supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', recipientId)
    .eq('read', false)
}

export async function findNotificationActors(supabase: SupabaseClient, actorIds: string[]) {
  if (!actorIds.length) {
    return { data: [] as { id: string; username: string | null; display_name: string | null }[], error: null }
  }
  return supabase.from('profiles').select('id,username,display_name').in('id', actorIds)
}

export async function markNotificationsRead(
  supabase: SupabaseClient,
  recipientId: string,
  id?: string
) {
  const query = supabase.from('notifications').update({ read: true }).eq('recipient_id', recipientId)
  return id ? query.eq('id', id) : query
}

export async function deleteNotificationForRecipient(
  supabase: SupabaseClient,
  recipientId: string,
  id: string
) {
  return supabase.from('notifications').delete().eq('recipient_id', recipientId).eq('id', id)
}

export async function clearNotifications(supabase: SupabaseClient, recipientId: string) {
  return supabase.from('notifications').delete().eq('recipient_id', recipientId)
}
