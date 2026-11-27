'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { NotificationView } from '@shared/index'
import { createClient } from '@/lib/supabase/client'

/**
 * Shared client-side session state for notification surfaces.
 *
 * Public routes render notification UI too, so an authenticated request must
 * never be fired before a real Supabase session is known to exist. Both the
 * full notification center and the workspace dropdown use this hook so the
 * 401-as-session-boundary behaviour stays identical.
 */
export type NotificationSession = {
  userId: string | null
  authenticated: boolean
  resolved: boolean
  invalidate: () => void
}

export function useNotificationSession(): NotificationSession {
  const [userId, setUserId] = useState<string | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [resolved, setResolved] = useState(false)

  const invalidate = useCallback(() => {
    setUserId(null)
    setAuthenticated(false)
    setResolved(true)
  }, [])

  useEffect(() => {
    const client = createClient()
    let ignore = false

    void client.auth.getUser().then(({ data }) => {
      if (ignore) return
      setUserId(data.user?.id ?? null)
      setAuthenticated(Boolean(data.user))
      setResolved(true)
    })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (ignore) return
      setUserId(session?.user?.id ?? null)
      setAuthenticated(Boolean(session?.user))
      setResolved(true)
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  return { userId, authenticated, resolved, invalidate }
}

/** Subscribe to notification row changes for one recipient, if signed in. */
export function useNotificationRealtime({
  userId,
  channelName,
  onChange,
}: {
  userId: string | null
  channelName: string
  onChange: () => void
}) {
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!userId) return
    const client = createClient()
    const channel = client
      .channel(`${channelName}:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        () => {
          onChangeRef.current()
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onChangeRef.current()
      })

    return () => {
      void client.removeChannel(channel)
    }
  }, [userId, channelName])
}

/** Human-readable copy for a notification, shared by every surface. */
export function notificationLabel(item: NotificationView): string {
  const actor = item.actor?.name || item.actor?.username || 'Someone'
  switch (item.type) {
    case 'LIKE':
      return `${actor} liked your article.`
    case 'COMMENT':
      return `${actor} commented on your article.`
    case 'REPLY':
      return `${actor} replied to your comment.`
    case 'FOLLOW':
      return `${actor} followed you.`
    case 'NEW_POST':
      return `${actor} published a new article.`
    case 'REPOST':
      return `${actor} reposted your article.`
    case 'MENTION':
      return `${actor} mentioned you.`
    case 'MODERATION':
      return 'A moderator updated your content.'
    default:
      return `${actor} sent you a notification.`
  }
}

/** Destination for a notification row. */
export function notificationHref(item: NotificationView): string {
  if (item.target_slug) return `/post/${item.target_slug}`
  if (item.type === 'FOLLOW' && item.actor?.username) return `/profile/${item.actor.username}`
  return '/notifications'
}
