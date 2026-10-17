'use client'

import { useState } from 'react'
import Link from 'next/link'

type State = 'guest' | 'owner' | 'member' | 'none'

export function SubscribeButton({ creatorId, state, billingReady, profileHref = '/settings' }: { creatorId: string; state: State; billingReady: boolean; profileHref?: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (state === 'owner') return <Link href={profileHref} className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-accent">Your publication</Link>

  async function startCheckout() {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creatorId }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.url) {
        setError(result.error ?? 'Unable to start checkout.')
        setBusy(false)
        return
      }
      window.location.href = result.url
    } catch {
      setError('Unable to start checkout.')
      setBusy(false)
    }
  }

  async function openPortal() {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.url) {
        setError(result.error ?? 'Billing portal unavailable.')
        setBusy(false)
        return
      }
      window.location.href = result.url
    } catch {
      setError('Billing portal unavailable.')
      setBusy(false)
    }
  }

  if (state === 'member') {
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="inline-flex rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">Member</span>
        <button type="button" onClick={() => void openPortal()} disabled={busy} className="font-mono text-[10px] uppercase tracking-wider text-muted hover:text-accent disabled:opacity-50">
          {busy ? 'Opening…' : 'Manage membership'}
        </button>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    )
  }

  if (state === 'guest') {
    return (
      <Link href={`/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/explore')}`} className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-accent">
        Sign in to subscribe
      </Link>
    )
  }

  if (!billingReady) return null

  return (
    <div className="flex flex-col items-start gap-1">
      <button type="button" onClick={() => void startCheckout()} disabled={busy} className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-60">
        {busy ? 'Redirecting…' : 'Become a member'}
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  )
}