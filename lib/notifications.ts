import type { SupabaseClient } from '@supabase/supabase-js'
import { TRUSTED_NOTIFICATION_TYPES, type TrustedNotificationType } from '@/lib/security-validation'

type NotificationInput = {
  recipientId: string
  actorId: string
  type: TrustedNotificationType
  entityId?: string | null
  targetSlug?: string | null
  targetTitle?: string | null
}

export const NOTIFICATION_PAGE_DEFAULT_LIMIT = 20
export const NOTIFICATION_PAGE_MAX_LIMIT = 50

/**
 * Parse the public notification page contract. Invalid values fall back to
 * safe defaults rather than rejecting an otherwise valid session.
 */
export function parseNotificationPage(url: URL) {
  const parsePositive = (value: string | null, fallback: number, max: number) => {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 1) return fallback
    return Math.min(parsed, max)
  }

  return {
    page: parsePositive(url.searchParams.get('page'), 1, Number.MAX_SAFE_INTEGER),
    limit: parsePositive(url.searchParams.get('limit'), NOTIFICATION_PAGE_DEFAULT_LIMIT, NOTIFICATION_PAGE_MAX_LIMIT),
  }
}

export async function createNotification(supabase: SupabaseClient, input: NotificationInput) {
  if (input.recipientId === input.actorId) return

  const { error } = await supabase.from('notifications').upsert(
    {
      recipient_id: input.recipientId,
      actor_id: input.actorId,
      type: input.type,
      entity_id: input.entityId ?? null,
      target_slug: input.targetSlug ?? null,
      target_title: input.targetTitle ?? null,
    },
    { onConflict: 'recipient_id,actor_id,type,entity_id', ignoreDuplicates: true }
  )

  if (error) {
    console.error('Notification write failed', { code: error.code ?? null })
  }
}

/** Keep the public constants and the trusted producer allowlist in sync. */
export const SUPPORTED_NOTIFICATION_TYPES: readonly string[] = TRUSTED_NOTIFICATION_TYPES
