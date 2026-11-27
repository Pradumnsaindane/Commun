'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { clearNotifications, getNotifications, markNotificationsRead } from '@/features/notifications/api'
import { SessionExpiredError } from '@/features/api-client'
import type { NotificationView } from '@shared/index'
import { Button } from '@/components/ui/button'
import {
  notificationHref,
  notificationLabel,
  useNotificationRealtime,
  useNotificationSession,
} from '@/hooks/use-notifications'

type Notification = NotificationView

export function NotificationCenter({ page = false }: { page?: boolean }) {
  const { userId, authenticated, resolved, invalidate } = useNotificationSession()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const pageRef = useRef(1)
  const loadedUserIdRef = useRef<string | null>(null)

  const load = useCallback(
    async (reset = true) => {
      const nextPage = reset ? 1 : pageRef.current + 1
      setError('')
      if (reset) setLoading(true)
      else setLoadingMore(true)
      try {
        const data = await getNotifications({ page: nextPage })
        pageRef.current = data.page
        setItems((current) => (reset ? data.notifications : [...current, ...data.notifications]))
        setHasNextPage(data.hasNextPage)
        setUnreadCount(data.unreadCount)
      } catch (caught) {
        if (caught instanceof SessionExpiredError) {
          invalidate()
          setItems([])
          setUnreadCount(0)
        } else {
          setError('Notifications are temporarily unavailable. Try again shortly.')
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [invalidate]
  )

  // Public pages must not fire authenticated API requests before a session is
  // known to exist; a 401 is a session boundary, not a generic outage.
  useEffect(() => {
    if (!authenticated || !userId) {
      loadedUserIdRef.current = null
      return
    }
    if (loadedUserIdRef.current === userId) return
    loadedUserIdRef.current = userId
    void load(true)
  }, [authenticated, userId, load])

  useNotificationRealtime({
    userId: authenticated ? userId : null,
    channelName: 'notifications',
    onChange: () => {
      void load(true)
    },
  })

  async function markRead(id?: string) {
    setUpdating(true)
    setError('')
    try {
      await markNotificationsRead(id)
      setItems((current) => current.map((item) => (id && item.id !== id ? item : { ...item, read: true })))
      setUnreadCount((current) => (id ? Math.max(0, current - 1) : 0))
    } catch (caught) {
      if (caught instanceof SessionExpiredError) {
        invalidate()
        setItems([])
        setUnreadCount(0)
      } else {
        setError('Your read status could not be saved. Please try again.')
      }
    } finally {
      setUpdating(false)
    }
  }

  async function clearAll() {
    setUpdating(true)
    setError('')
    try {
      await clearNotifications()
      setItems([])
      setUnreadCount(0)
      setHasNextPage(false)
      pageRef.current = 1
    } catch (caught) {
      if (caught instanceof SessionExpiredError) {
        invalidate()
        setItems([])
        setUnreadCount(0)
      } else {
        setError('Notifications could not be cleared. Please try again.')
      }
    } finally {
      setUpdating(false)
    }
  }

  // Keep the skeleton only while a signed-in session is still resolving or
  // loading. Public visitors see the sign-in state instead of a permanent
  // skeleton, without mutating state from inside an effect.
  const showSkeleton = loading && (!resolved || authenticated)

  const body = showSkeleton ? (
    <div className="space-y-3" role="status" aria-label="Loading notifications"><div className="skeleton h-16" /><div className="skeleton h-16" /><div className="skeleton h-16" /></div>
  ) : error ? (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert"><p>{error}</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => { void load(true) }}>Try again</Button></div>
  ) : !authenticated ? (
    <div className="rounded-xl border border-dashed border-border bg-background/70 p-8 text-center"><p className="font-medium">Sign in to view notifications</p><p className="mt-2 text-sm text-muted">Your activity appears here once you are signed in.</p><Link href="/login" className="mt-4 inline-flex rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover">Go to login</Link></div>
  ) : items.length === 0 ? (
    <div className="rounded-xl border border-dashed border-border bg-background/70 p-8 text-center"><p className="font-medium">No notifications yet</p><p className="mt-2 text-sm text-muted">New account and community activity will appear here.</p></div>
  ) : (
    <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {items.map((item) => <li key={item.id}><Link href={notificationHref(item)} onClick={() => { if (!item.read) void markRead(item.id) }} className={`block px-4 py-4 transition-colors hover:bg-surface-hover focus-visible:outline-offset-[-2px] sm:px-5 ${item.read ? 'bg-surface' : 'bg-accent/[.045]'}`}><div className="flex gap-3"><span aria-hidden="true" className={`mt-2 size-2 shrink-0 rounded-full ${item.read ? 'bg-border-strong' : 'bg-accent'}`} /><div className="min-w-0 flex-1"><p className="text-sm leading-6">{notificationLabel(item)}</p>{item.target_title && <p className="mt-1 truncate text-xs text-muted">{item.target_title}</p>}<time className="mt-1 block text-xs text-muted" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></div></div></Link></li>)}
    </ol>
  )

  return (
    <section className={page ? 'workspace-enter mx-auto w-full max-w-5xl space-y-6' : 'w-full'} aria-labelledby={page ? 'notifications-title' : undefined}>
      {page && <header className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">Activity</p><h1 id="notifications-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Notifications</h1><p className="mt-2 text-sm text-muted">{unreadCount ? `${unreadCount} unread updates` : 'You are all caught up.'}</p></div><div className="flex gap-2"><Button type="button" variant="secondary" size="sm" disabled={!unreadCount || updating} onClick={() => void markRead()}>{updating ? 'Saving…' : 'Mark all read'}</Button><Button type="button" variant="outline" size="sm" disabled={!items.length || updating} onClick={() => void clearAll()}>Clear all</Button></div></header>}
      {body}
      {page && hasNextPage && !error && <div className="flex justify-center"><Button type="button" variant="outline" size="sm" disabled={loadingMore} onClick={() => { void load(false) }}>{loadingMore ? 'Loading…' : 'Load more'}</Button></div>}
      {page && userId && !error && <p role="status" aria-live="polite" className="sr-only">{updating ? 'Saving notification updates' : ''}</p>}
      {error && !loading && <p role="status" className="text-xs text-muted">Read status changes are saved by your account. Failed writes remain unchanged.</p>}
    </section>
  )
}
