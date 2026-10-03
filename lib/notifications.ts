import type { SupabaseClient } from '@supabase/supabase-js'

type NotificationInput = { recipientId: string; actorId: string; type: 'LIKE' | 'COMMENT' | 'REPLY' | 'FOLLOW' | 'NEW_POST'; entityId?: string | null; targetSlug?: string | null; targetTitle?: string | null }

export async function createNotification(supabase: SupabaseClient, input: NotificationInput) {
  if (input.recipientId === input.actorId) return
  await supabase.from('notifications').upsert({ recipient_id: input.recipientId, actor_id: input.actorId, type: input.type, entity_id: input.entityId ?? null, target_slug: input.targetSlug ?? null, target_title: input.targetTitle ?? null }, { onConflict: 'recipient_id,actor_id,type,entity_id', ignoreDuplicates: true })
}
