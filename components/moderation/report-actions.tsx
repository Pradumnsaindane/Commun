'use client'

import { useState } from 'react'

export function ReportActions({ reportId, status }: { reportId: string; status: string }) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function act(action: string) {
    if (action === 'REMOVE' && !window.confirm('Remove the reported content? This action affects the published item.')) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/moderation/reports/${reportId}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }) })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? 'Unable to complete this moderation action.')
      setMessage('Action recorded. Reload the report to view its updated status.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to complete this moderation action.')
    } finally {
      setBusy(false)
    }
  }

  if (!['OPEN', 'IN_REVIEW'].includes(status)) return <p className="mt-4 rounded-xl border border-border bg-background p-4 text-xs text-muted">This report is closed. No actions are available.</p>

  return (
    <div className="mt-4 space-y-3">
      <button type="button" disabled={busy} onClick={() => void act('RESOLVE')} className="min-h-10 w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Saving…' : 'Resolve report'}</button>
      <button type="button" disabled={busy} onClick={() => void act('DISMISS')} className="min-h-10 w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50">Dismiss report</button>
      <button type="button" disabled={busy} onClick={() => void act('REMOVE')} className="min-h-10 w-full rounded-lg border border-red-500/30 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-400/5 dark:text-red-200 dark:hover:bg-red-400/10">Remove reported content</button>
      {message && <p role="status" aria-live="polite" className="rounded-lg border border-border bg-background p-3 text-xs text-muted">{message}</p>}
    </div>
  )
}
