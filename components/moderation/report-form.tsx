'use client'
import { useState } from 'react'
import { errorMessage } from '@/features/api-client'
import { submitReport, type ReportReason, type ReportTargetType } from '@/features/moderation/api'

export function ReportForm({ targetType, targetId }: { targetType: ReportTargetType; targetId: string }) {
  const [open, setOpen] = useState(false); const [reason, setReason] = useState<ReportReason>('SPAM'); const [description, setDescription] = useState(''); const [message, setMessage] = useState('')
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    try {
      await submitReport({ targetType, targetId, reason, description })
      setMessage('Report submitted for review.')
      setTimeout(() => setOpen(false), 900)
    } catch (requestError) {
      setMessage(errorMessage(requestError, 'Unable to submit report.'))
    }
  }
  if (!open) return <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setOpen(true)}>Report</button>
  return <form onSubmit={submit} className="mt-3 space-y-2 rounded-lg border border-border bg-surface p-3"><label className="block text-xs font-medium">Reason<select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)} className="mt-1 w-full rounded border border-border bg-background p-2 text-sm">{['SPAM','HARASSMENT','ABUSE','MISINFORMATION','COPYRIGHT','MALICIOUS_CONTENT','OTHER'].map((item) => <option key={item}>{item}</option>)}</select></label><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} placeholder="Add context (optional)" className="min-h-20 w-full rounded border border-border bg-background p-2 text-sm" /><div className="flex items-center gap-2"><button className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">Submit</button><button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground">Cancel</button></div>{message && <p className="text-xs text-muted-foreground">{message}</p>}</form>
}
