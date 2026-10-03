'use client'

import { useState } from 'react'

export function BetaFeedbackForm() {
  const [category, setCategory] = useState('GENERAL')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setState('sending')
    const response = await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ category, message, path: window.location.pathname }) })
    setState(response.ok ? 'sent' : 'error'); if (response.ok) setMessage('')
  }
  return <form onSubmit={submit} className="space-y-4"><div className="grid gap-3 sm:grid-cols-[160px_1fr]"><label className="text-sm font-medium" htmlFor="feedback-category">Type</label><select id="feedback-category" value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="GENERAL">General feedback</option><option value="BUG">Bug</option><option value="FEATURE">Feature request</option><option value="CONFUSION">Something confusing</option></select></div><div className="grid gap-3 sm:grid-cols-[160px_1fr]"><label className="pt-2 text-sm font-medium" htmlFor="feedback-message">What should we know?</label><textarea id="feedback-message" required minLength={10} maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} rows={4} placeholder="Tell us what happened or what would make Commun better." className="resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent" /></div><div className="flex items-center gap-4 sm:pl-[172px]"><button disabled={state === 'sending'} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-60">{state === 'sending' ? 'Sending…' : 'Send feedback'}</button>{state === 'sent' && <span role="status" className="text-sm text-accent">Thanks — feedback received.</span>}{state === 'error' && <span role="alert" className="text-sm text-red-400">Could not send feedback. Try again.</span>}</div></form>
}
