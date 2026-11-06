'use client'

import Link from 'next/link'
import { useState } from 'react'

export function BetaFeedbackForm() {
  const [category, setCategory] = useState<'GENERAL' | 'BUG' | 'FEATURE' | 'CONFUSION'>('GENERAL')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isUnauthenticated, setIsUnauthenticated] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setState('sending')
    setErrorMessage('')
    setIsUnauthenticated(false)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message: message.trim(),
          path: typeof window !== 'undefined' ? window.location.pathname : '/',
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        setState('sent')
        setMessage('')
      } else {
        setState('error')
        if (response.status === 401) {
          setIsUnauthenticated(true)
          setErrorMessage('You must be signed in to submit beta feedback.')
        } else if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          setErrorMessage(
            `Rate limit reached. Please wait ${retryAfter ? `${retryAfter} seconds` : 'a moment'} before sending another feedback message.`
          )
        } else {
          setErrorMessage(data.error ?? 'Could not submit feedback. Please check your connection and retry.')
        }
      }
    } catch {
      setState('error')
      setErrorMessage('Network error occurred. Please verify your connection and retry.')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <label className="text-sm font-medium" htmlFor="feedback-category">
          Feedback type
        </label>
        <select
          id="feedback-category"
          value={category}
          onChange={(event) => setCategory(event.target.value as any)}
          className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          <option value="GENERAL">General feedback</option>
          <option value="BUG">Bug report</option>
          <option value="FEATURE">Feature request</option>
          <option value="CONFUSION">Something confusing</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <label className="pt-2 text-sm font-medium" htmlFor="feedback-message">
          What should we know?
        </label>
        <div>
          <textarea
            id="feedback-message"
            required
            minLength={10}
            maxLength={2000}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder="Tell us what happened or what would make Commun better (minimum 10 characters)..."
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <div className="mt-1 flex justify-between text-[11px] text-muted">
            <span>Minimum 10 characters</span>
            <span>{message.trim().length}/2000</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:pl-[172px]">
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={state === 'sending' || message.trim().length < 10}
            className="min-h-11 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state === 'sending' ? 'Sending…' : 'Send feedback'}
          </button>
          {state === 'sent' && (
            <span role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              ✓ Thanks — your feedback has been received.
            </span>
          )}
        </div>

        {state === 'error' && (
          <div role="alert" className="mt-2 rounded-lg border border-red-500/30 bg-red-50 p-3 text-xs text-red-800 dark:bg-red-400/10 dark:text-red-200">
            <p>{errorMessage}</p>
            {isUnauthenticated ? (
              <Link href="/login?next=/settings" className="mt-2 inline-block font-semibold text-accent underline">
                Sign in to your account →
              </Link>
            ) : (
              <button
                type="button"
                onClick={submit}
                className="mt-2 text-xs font-semibold underline hover:text-white"
              >
                Click here to retry
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  )
}
