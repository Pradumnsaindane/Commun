'use client'

import { FormEvent, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function DiscussionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTitle = searchParams.get('title') ?? ''
  const initialContent = searchParams.get('content') ?? ''

  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? 'Unable to create discussion.')
        setSaving(false)
        return
      }
      router.push(`/discussions/${data.discussion.id}`)
    } catch {
      setError('Network error occurred. Please check your connection and retry.')
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-accent">Community</p>
      <h1 className="text-4xl font-semibold tracking-tight">Start a discussion</h1>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Title</span>
          <input
            required
            minLength={3}
            maxLength={180}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[.04] px-4 py-3 outline-none focus:border-accent"
            placeholder="What would you like to discuss?"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Details</span>
          <textarea
            required
            maxLength={10000}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-52 w-full rounded-lg border border-white/10 bg-white/[.04] px-4 py-3 outline-none focus:border-accent"
            placeholder="Share context, examples, or your question..."
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button
          disabled={saving}
          className="rounded-lg bg-accent px-5 py-3 font-semibold text-background transition hover:brightness-110 disabled:opacity-50"
        >
          {saving ? 'Publishing…' : 'Publish discussion'}
        </button>
      </form>
    </main>
  )
}

export default function NewDiscussionPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-6 py-12 text-muted">Loading discussion composer…</div>}>
      <DiscussionForm />
    </Suspense>
  )
}
