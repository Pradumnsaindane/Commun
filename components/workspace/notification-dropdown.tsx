'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { SessionExpiredError } from '@/features/api-client'
import { getNotifications, markNotificationsRead } from '@/features/notifications/api'
import { cn } from '@/lib/utils'
import type { NotificationView } from '@shared/index'
import {
  notificationLabel,
  useNotificationRealtime,
  useNotificationSession,
} from '@/hooks/use-notifications'

export function NotificationDropdown({ className }: { className?: string }) {
  const { userId, authenticated, resolved, invalidate } = useNotificationSession()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [refreshVersion, setRefreshVersion] = useState(0)

  // Only request notifications when a real Supabase session exists. Public
  // routes render this dropdown too, so fetching unconditionally produced
  // expected 401 responses on every unauthenticated page view.
  useEffect(() => {
    if (!authenticated) return

    let ignore = false
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await getNotifications({ limit: 20 })
        if (ignore) return
        setItems(data.notifications)
        setUnreadCount(data.unreadCount)
      } catch (caught) {
        if (ignore) return
        if (caught instanceof SessionExpiredError) {
          invalidate()
          setItems([])
          setUnreadCount(0)
          setError('')
          return
        }
        setError('Notifications are unavailable right now.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    void fetchNotifications()
    return () => {
      ignore = true
    }
  }, [authenticated, refreshVersion, invalidate])

  useNotificationRealtime({
    userId: authenticated ? userId : null,
    channelName: 'dropdown-notifications',
    onChange: () => {
      setRefreshVersion((value) => value + 1)
    },
  })

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  async function markRead(id?: string) {
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
        setError('Your read status could not be saved.')
      }
    }
  }

  const badgeCount = authenticated ? unreadCount : 0

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="workspace-notification-panel"
        aria-haspopup="dialog"
        aria-label={`Notifications ${badgeCount > 0 ? `(${badgeCount} unread)` : ''}`}
        className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:text-foreground hover:bg-surface-hover transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="text-base" aria-hidden="true">
          🔔
        </span>
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-accent font-mono text-[9px] font-bold text-background shadow">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div id="workspace-notification-panel" role="dialog" aria-label="Recent notifications" className="glass-surface glass-floating dropdown-enter absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-1rem))] rounded-2xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              <div className="flex items-center gap-2">
                {authenticated && unreadCount > 0 ? (
                  <Badge variant="accent">{unreadCount} new</Badge>
                ) : (
                  <span className="font-mono text-[11px] text-muted">All caught up</span>
                )}
                {authenticated && unreadCount > 0 && (
                  <button type="button" onClick={() => void markRead()} className="text-[11px] font-semibold text-accent hover:underline">Mark all read</button>
                )}
              </div>
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-border/60">
              {resolved && !authenticated ? (
                <div className="py-6 text-center" role="status">
                  <p className="text-xs font-medium text-foreground">Sign in to view notifications</p>
                  <Link href="/login" onClick={() => setOpen(false)} className="mt-2 inline-block text-xs font-semibold text-accent hover:underline">
                    Go to login
                  </Link>
                </div>
              ) : loading ? (
                <div className="space-y-3 py-3" role="status" aria-label="Loading notifications">
                  <div className="skeleton h-12" />
                  <div className="skeleton h-12" />
                </div>
              ) : error ? (
                <div role="alert" className="py-6 text-center text-xs text-muted">
                  <p>{error}</p>
                  <button type="button" onClick={() => setRefreshVersion((value) => value + 1)} className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 font-medium text-foreground hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Try again</button>
                </div>
              ) : items.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs font-medium text-foreground">No notifications yet</p>
                  <p className="mt-1 text-[11px] text-muted">
                    Team mentions and workspace activities will appear here.
                  </p>
                </div>
              ) : (
                items.slice(0, 5).map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => { if (!item.read) void markRead(item.id) }}
                    className={cn('block w-full py-2.5 text-left transition-colors hover:bg-surface-hover/60', !item.read && 'bg-accent/[.035]')}
                  >
                    <p className="font-medium text-foreground">{notificationLabel(item)}</p>
                    {item.target_title && (
                      <p className="text-muted truncate mt-0.5">{item.target_title}</p>
                    )}
                    <span className="font-mono text-[10px] text-subtle mt-1 block">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-border/80 text-center">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-accent hover:underline"
              >
                View all notifications in center →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
