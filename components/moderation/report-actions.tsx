'use client'
import { useState } from 'react'

export function ReportActions({ reportId, status }: { reportId: string; status: string }) { const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function act(action: string) { setBusy(true); const response = await fetch(`/api/moderation/reports/${reportId}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }) }); const data = await response.json(); setMessage(response.ok ? 'Action recorded. Refresh to see the updated state.' : data.error ?? 'Action failed.'); setBusy(false) }
  return <div className="mt-4 space-y-3">{['OPEN','IN_REVIEW'].includes(status) && <><button disabled={busy} onClick={() => act('RESOLVE')} className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50">Resolve report</button><button disabled={busy} onClick={() => act('DISMISS')} className="w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50">Dismiss report</button><button disabled={busy} onClick={() => act('REMOVE')} className="w-full rounded-lg border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive disabled:opacity-50">Remove reported content</button></>}{message && <p className="text-xs text-muted-foreground">{message}</p>}</div>
}
