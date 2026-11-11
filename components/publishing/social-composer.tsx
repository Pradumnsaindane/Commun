'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CodeBlock } from '@/components/ui/code-block'
import { HIGHLIGHT_LANGUAGES, LANGUAGE_LABELS, normalizeLanguage } from '@/lib/highlight'
import { hostnameOf, MAX_POST_LENGTH, MAX_SNIPPET_LENGTH, SOCIAL_POST_TYPES, type SocialPostType } from '@/lib/social-posts'

type Result = { slug: string; degraded: boolean } | null

export function SocialComposer({ authorName }: { authorName: string }) {
  const [type, setType] = useState<SocialPostType>('POST')
  const [body, setBody] = useState('')
  const [language, setLanguage] = useState('typescript')
  const [linkUrl, setLinkUrl] = useState('')
  const [title, setTitle] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result>(null)

  const limit = type === 'SNIPPET' ? MAX_SNIPPET_LENGTH : MAX_POST_LENGTH
  const canPublish = type === 'LINK' ? linkUrl.trim().length > 0 : body.trim().length > 0

  async function publish() {
    setPending(true)
    setError('')
    try {
      const payload =
        type === 'LINK'
          ? { type, linkUrl: linkUrl.trim(), body: body.trim(), title: title.trim() || undefined }
          : type === 'SNIPPET'
            ? { type, body, language, title: title.trim() || undefined }
            : { type, body, title: title.trim() || undefined }
      const response = await fetch('/api/social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? 'Unable to publish your post.')
      setResult({ slug: data.post.slug, degraded: Boolean(data.degraded) })
      setBody('')
      setLinkUrl('')
      setTitle('')
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Unable to publish your post.')
    } finally {
      setPending(false)
    }
  }

  if (result) {
    return (
      <section className="rounded-2xl border border-accent/30 bg-accent/5 p-6 sm:p-8" aria-live="polite">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Published</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">Your post is live.</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {result.degraded
            ? 'It was stored in the current article schema. Post-type metadata will appear after the Phase 1B database update is applied.'
            : 'It is visible in the Latest feed and on your profile.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/post/${result.slug}`} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">View post</Link>
          <Link href="/feed" className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:border-accent/50">Back to feed</Link>
          <button type="button" onClick={() => setResult(null)} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:border-accent/50">Write another</button>
        </div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Composer</p>
          <p className="mt-1 text-sm text-muted">Publishing as {authorName}</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Post type">
          {SOCIAL_POST_TYPES.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={type === option}
              onClick={() => { setType(option); setError('') }}
              className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors ${type === option ? 'bg-accent text-accent-foreground' : 'border border-border text-muted hover:text-foreground'}`}
            >
              {option === 'POST' ? 'Text' : option === 'SNIPPET' ? 'Code' : 'Link'}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-4 p-5">
        <label className="block text-sm">
          <span className="font-medium">Title <span className="text-muted">(optional)</span></span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            placeholder="A short headline"
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>

        {type === 'LINK' && (
          <label className="block text-sm">
            <span className="font-medium">Link <span className="text-accent">*</span></span>
            <input
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              type="url"
              inputMode="url"
              placeholder="https://example.dev/article"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-accent"
            />
          </label>
        )}

        {type === 'SNIPPET' && (
          <label className="block text-sm">
            <span className="font-medium">Language</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
            >
              {HIGHLIGHT_LANGUAGES.map((option) => (
                <option key={option} value={option}>{LANGUAGE_LABELS[option]}</option>
              ))}
            </select>
          </label>
        )}

        <label className="block text-sm">
          <span className="font-medium">
            {type === 'SNIPPET' ? 'Code' : type === 'LINK' ? 'Commentary' : 'Post'}
            {type !== 'LINK' && <span className="text-accent"> *</span>}
          </span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value.slice(0, limit))}
            rows={type === 'SNIPPET' ? 12 : 6}
            placeholder={
              type === 'SNIPPET'
                ? 'export async function getProfile(id: string) { … }'
                : type === 'LINK'
                  ? 'Why is this worth another developer’s time?'
                  : 'What are you building, learning, or thinking about?'
            }
            className={`mt-1.5 w-full resize-y rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent ${type === 'SNIPPET' ? 'font-mono text-[13px] leading-6' : ''}`}
          />
          <span className="mt-1 block text-right font-mono text-[10px] text-muted">{body.length}/{limit}</span>
        </label>

        {type === 'SNIPPET' && body.trim() && (
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Preview</p>
            <CodeBlock code={body} language={normalizeLanguage(language)} />
          </div>
        )}

        {type === 'LINK' && linkUrl.trim() && (
          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Link preview</p>
            <p className="mt-1.5 font-medium text-accent">{hostnameOf(linkUrl)}</p>
          </div>
        )}

        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="max-w-sm text-xs leading-5 text-muted">Posts publish immediately and can be edited or removed by you.</p>
          <button
            type="button"
            onClick={() => void publish()}
            disabled={pending || !canPublish}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Publishing…' : 'Publish post'}
          </button>
        </div>
      </div>
    </section>
  )
}
