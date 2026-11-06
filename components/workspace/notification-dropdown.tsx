'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface NotificationItem {
  id: string
  type: string
  target_title: string | null
  target_slug: string | null
  read: boolean
  created_at: string
  actor: { username: string | null; name: string | null } | null
}

export function NotificationDropdown({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)

  useEffect(() => {
    let ignore = false
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await fetch('/api/notifications')
        if (!res.ok) throw new Error('Unable to load notifications')
        const data = await res.json()
        if (!ignore) setItems(data?.notifications ?? [])
      } catch {
        if (!ignore) setError('Notifications are unavailable right now.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    if (open) {
      void fetchNotifications()
    } else {
      // Background check for unread count
      void fetchNotifications()
    }

    return () => {
      ignore = true
    }
  }, [open, refreshVersion])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const unreadCount = items.filter((i) => !i.read).length

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="workspace-notification-panel"
        aria-haspopup="dialog"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
      >
        <span className="text-base" aria-hidden="true">
          🔔
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-accent font-mono text-[9px] font-bold text-background shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
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
              {unreadCount > 0 ? (
                <Badge variant="accent">{unreadCount} new</Badge>
              ) : (
                <span className="font-mono text-[11px] text-muted">All caught up</span>
              )}
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-border/60">
              {loading ? (
                <div className="space-y-3 py-3" role="status" aria-label="Loading notifications">
                  <div className="skeleton h-12" />
                  <div className="skeleton h-12" />
                </div>
              ) : error ? (
                <div role="alert" className="py-6 text-center text-xs text-muted">
                  <p>{error}</p>
                  <button type="button" onClick={() => setRefreshVersion((value) => value + 1)} className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 font-medium text-foreground hover:border-accent/40">Try again</button>
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
                  <div key={item.id} className="py-2.5 text-xs">
                    <p className="font-medium text-foreground">
                      {item.actor?.name || item.actor?.username || 'Team member'} {item.type}
                    </p>
                    {item.target_title && (
                      <p className="text-muted truncate mt-0.5">{item.target_title}</p>
                    )}
                    <span className="font-mono text-[10px] text-subtle mt-1 block">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
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

