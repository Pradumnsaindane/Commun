'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type Notification = { id: string; actor_id: string | null; type: string; target_slug: string | null; target_title: string | null; read: boolean; created_at: string; actor: { username: string | null; name: string | null } | null }

function label(item: Notification) {
  const actor = item.actor?.name || item.actor?.username || 'Someone'
  if (item.type === 'LIKE') return `${actor} liked your article.`
  if (item.type === 'COMMENT') return `${actor} commented on your article.`
  if (item.type === 'REPLY') return `${actor} replied to your comment.`
  if (item.type === 'FOLLOW') return `${actor} followed you.`
  if (item.type === 'NEW_POST') return `${actor} published a new article.`
  return `${actor} sent you a notification.`
}

export function NotificationCenter({ page = false }: { page?: boolean }) {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? 'Unable to load notifications.')
      setItems(data?.notifications ?? [])
    } catch {
      setError('Notifications are temporarily unavailable. Try again shortly.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const client = createClient()
    void Promise.resolve().then(load)
    let channel: ReturnType<typeof client.channel> | undefined
    void client.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)
      channel = client.channel(`notifications:${data.user.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${data.user.id}` }, () => { void load() }).subscribe()
    })
    return () => { if (channel) void client.removeChannel(channel) }
  }, [load])

  async function markRead(id?: string) {
    setUpdating(true)
    setError('')
    try {
      const response = await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(id ? { id } : {}) })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? 'Unable to update notifications.')
      setItems((current) => current.map((item) => id && item.id !== id ? item : { ...item, read: true }))
    } catch {
      setError('Your read status could not be saved. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const unread = items.filter((item) => !item.read).length
  const body = loading ? (
    <div className="space-y-3" role="status" aria-label="Loading notifications"><div className="skeleton h-16" /><div className="skeleton h-16" /><div className="skeleton h-16" /></div>
  ) : error ? (
    <div className="rounded-xl border border-red-500/25 bg-red-50 p-5 text-sm text-red-800 dark:bg-red-400/5 dark:text-red-200" role="alert"><p>{error}</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => { setLoading(true); void load() }}>Try again</Button></div>
  ) : items.length === 0 ? (
    <div className="rounded-xl border border-dashed border-border bg-background/70 p-8 text-center"><p className="font-medium">No notifications yet</p><p className="mt-2 text-sm text-muted">New account and community activity will appear here.</p></div>
  ) : (
    <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {items.map((item) => <li key={item.id}><Link href={item.target_slug ? `/post/${item.target_slug}` : item.type === 'FOLLOW' && item.actor?.username ? `/profile/${item.actor.username}` : '/notifications'} onClick={() => { if (!item.read) void markRead(item.id) }} className={`block px-4 py-4 transition-colors hover:bg-surface-hover focus-visible:outline-offset-[-2px] sm:px-5 ${item.read ? 'bg-surface' : 'bg-accent/[.045]'}`}><div className="flex gap-3"><span aria-hidden="true" className={`mt-2 size-2 shrink-0 rounded-full ${item.read ? 'bg-border-strong' : 'bg-accent'}`} /><div className="min-w-0 flex-1"><p className="text-sm leading-6">{label(item)}</p>{item.target_title && <p className="mt-1 truncate text-xs text-muted">{item.target_title}</p>}<time className="mt-1 block text-xs text-muted" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></div></div></Link></li>)}
    </ol>
  )

  return (
    <section className={page ? 'workspace-enter mx-auto w-full max-w-5xl space-y-6' : 'w-full'} aria-labelledby={page ? 'notifications-title' : undefined}>
      {page && <header className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">Activity</p><h1 id="notifications-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Notifications</h1><p className="mt-2 text-sm text-muted">{unread ? `${unread} unread updates` : 'You are all caught up.'}</p></div><Button type="button" variant="secondary" size="sm" disabled={!unread || updating} onClick={() => void markRead()}>{updating ? 'Saving…' : 'Mark all read'}</Button></header>}
      {body}
      {page && userId && !error && <p role="status" aria-live="polite" className="sr-only">{updating ? 'Saving notification updates' : ''}</p>}
      {error && !loading && <p role="status" className="text-xs text-muted">Read status changes are saved by your account. Failed writes remain unchanged.</p>}
    </section>
  )
}
