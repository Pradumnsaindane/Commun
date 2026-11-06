'use client'

import { useState } from 'react'

type User = { id: string; email: string; role: string; status: string }

export function UserAdminTable({ users, loadFailed = false }: { users: User[]; loadFailed?: boolean }) {
  const [items, setItems] = useState(users)
  const [message, setMessage] = useState('')
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  async function update(userId: string, patch: { role?: string; status?: string }) {
    setBusyUserId(userId)
    setMessage('')
    try {
      const response = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId, ...patch }) })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? 'Unable to update this user.')
      setItems((current) => current.map((user) => user.id === userId ? { ...user, ...patch } : user))
      setMessage('User updated. The change was recorded in the audit log.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update this user.')
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface shadow-subtle" aria-label="User administration">
      <div className="hidden grid-cols-[1fr_140px_160px] gap-4 border-b border-border bg-background px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-muted md:grid"><span>User</span><span>Role</span><span>Status</span></div>
      {loadFailed ? <p role="alert" className="p-6 text-sm text-muted">User accounts could not be loaded. Try again later.</p> : items.length ? items.map((user) => <div key={user.id} className="grid gap-3 border-b border-border p-4 last:border-0 sm:p-5 md:grid-cols-[1fr_140px_160px] md:items-center md:gap-4"><div className="min-w-0"><span className="block truncate text-sm font-medium">{user.email}</span><span className="mt-1 block font-mono text-[10px] text-muted">{user.id.slice(0, 12)}…</span></div><select aria-label={`Role for ${user.email}`} value={user.role} disabled={busyUserId === user.id} onChange={(event) => void update(user.id, { role: event.target.value })} className="min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"><option>USER</option><option>MODERATOR</option><option>ADMIN</option></select><select aria-label={`Status for ${user.email}`} value={user.status} disabled={busyUserId === user.id} onChange={(event) => void update(user.id, { status: event.target.value })} className="min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"><option>ACTIVE</option><option>SUSPENDED</option></select></div>) : <div className="p-8 text-center"><p className="text-sm font-semibold">No user accounts to display</p><p className="mt-2 text-xs text-muted">The account list is currently empty.</p></div>}
      {message && <p role="status" aria-live="polite" className="border-t border-border bg-background/70 p-4 text-xs text-muted">{message}</p>}
    </section>
  )
}
