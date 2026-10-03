'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  const load = async () => { const response = await fetch('/api/notifications'); if (!response.ok) return; const data = await response.json(); setItems(data.notifications ?? []); setLoading(false) }
  // Initial fetch and Realtime subscription synchronize this client with Supabase.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { const client = createClient(); void load(); let channel: ReturnType<typeof client.channel> | undefined; void client.auth.getUser().then(({ data }) => { if (!data.user) return; setUserId(data.user.id); channel = client.channel(`notifications:${data.user.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${data.user.id}` }, () => { void load() }).subscribe() }); return () => { if (channel) void client.removeChannel(channel) } }, [])
  const markRead = async (id?: string) => { await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(id ? { id } : {}) }); setItems((current) => current.map((item) => id && item.id !== id ? item : { ...item, read: true })) }
  const unread = items.filter((item) => !item.read).length
  return <section className={page ? 'mx-auto max-w-3xl px-5 py-10 sm:px-8' : 'w-80'} aria-labelledby={page ? 'notifications-title' : undefined}>
    {page && <div className="mb-8 flex items-end justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-accent">Activity</p><h1 id="notifications-title" className="mt-2 text-3xl font-semibold tracking-tight">Notifications</h1><p className="mt-2 text-sm text-muted">{unread ? `${unread} unread updates` : 'You are all caught up.'}</p></div><button type="button" onClick={() => void markRead()} className="rounded-md border border-border px-3 py-2 text-xs text-muted hover:text-foreground">Mark all read</button></div>}
    {loading ? <p className="text-sm text-muted">Loading notifications…</p> : items.length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-center"><p className="font-medium">No notifications yet.</p><p className="mt-2 text-sm text-muted">Follow developers and publish articles to see activity here.</p></div> : <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">{items.map((item) => <Link key={item.id} href={item.target_slug ? `/post/${item.target_slug}` : item.type === 'FOLLOW' && item.actor?.username ? `/profile/${item.actor.username}` : '/notifications'} onClick={() => { if (!item.read) void markRead(item.id) }} className={`block px-4 py-4 transition-colors hover:bg-surface ${item.read ? 'bg-background' : 'bg-accent/5'}`}><div className="flex gap-3"><span aria-hidden className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-border' : 'bg-accent'}`} /><div><p className="text-sm leading-6">{label(item)}</p>{item.target_title && <p className="mt-1 truncate text-xs text-muted">{item.target_title}</p>}<time className="mt-1 block text-xs text-muted" dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString()}</time></div></div></Link>)}</div>}
    {userId && !page && <Link href="/notifications" className="mt-3 block text-center text-xs text-accent hover:underline">View all notifications</Link>}
  </section>
}
