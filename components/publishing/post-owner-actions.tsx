'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { HIGHLIGHT_LANGUAGES, LANGUAGE_LABELS } from '@/lib/highlight'
import type { SocialPostType } from '@/lib/social-posts'

export function PostOwnerActions({
  postId,
  initialBody,
  initialType,
  initialLanguage,
  initialLinkUrl,
}: {
  postId: string
  initialBody: string
  initialType: SocialPostType
  initialLanguage?: string | null
  initialLinkUrl?: string | null
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(initialType === 'LINK' && initialLinkUrl ? initialBody.replace(initialLinkUrl, '').trim() : initialBody)
  const [language, setLanguage] = useState(initialLanguage ?? 'typescript')
  const [linkUrl, setLinkUrl] = useState(initialLinkUrl ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setPending(true)
    setError('')
    try {
      const payload =
        initialType === 'LINK'
          ? { type: initialType, linkUrl, body }
          : initialType === 'SNIPPET'
            ? { type: initialType, body, language }
            : { type: initialType, body }
      const response = await fetch(`/api/social-posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? 'Unable to update this post.')
      setEditing(false)
      router.refresh()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update this post.')
    } finally {
      setPending(false)
    }
  }

  async function remove() {
    if (!window.confirm('Remove this post? It will no longer appear in feeds.')) return
    setPending(true)
    setError('')
    try {
      const response = await fetch(`/api/social-posts/${postId}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? 'Unable to remove this post.')
      }
      router.push('/feed')
      router.refresh()
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Unable to remove this post.')
      setPending(false)
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-border bg-surface p-4" aria-label="Post owner actions">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Your post</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing((value) => !value)} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:border-accent/50">
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button type="button" onClick={() => void remove()} disabled={pending} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-500 disabled:opacity-60">
            Remove
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-4 space-y-3">
          {initialType === 'LINK' && (
            <input
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              type="url"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-accent"
              aria-label="Link URL"
            />
          )}
          {initialType === 'SNIPPET' && (
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
              aria-label="Code language"
            >
              {HIGHLIGHT_LANGUAGES.map((option) => <option key={option} value={option}>{LANGUAGE_LABELS[option]}</option>)}
            </select>
          )}
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={initialType === 'SNIPPET' ? 10 : 5}
            className={`w-full resize-y rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent ${initialType === 'SNIPPET' ? 'font-mono text-[13px] leading-6' : ''}`}
            aria-label="Post content"
          />
          <div className="flex justify-end">
            <button type="button" onClick={() => void save()} disabled={pending} className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-60">
              {pending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}
    </section>
  )
}
