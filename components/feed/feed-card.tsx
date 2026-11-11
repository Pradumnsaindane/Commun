'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { FeedItem } from '@/lib/feed'
import { hostnameOf } from '@/lib/social-posts'

function formatDate(value: string | null) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

export function FeedCard({ item }: { item: FeedItem }) {
  const [likes, setLikes] = useState(item.likeCount)
  const [liked, setLiked] = useState(item.liked)
  const [saved, setSaved] = useState(item.saved)
  const [pending, setPending] = useState<'like' | 'save' | null>(null)
  const [message, setMessage] = useState('')

  async function toggle(kind: 'like' | 'save') {
    const active = kind === 'like' ? liked : saved
    const action = kind === 'like' ? (active ? 'unlike' : 'like') : active ? 'unsave' : 'save'
    const previous = { liked, saved, likes }

    setMessage('')
    setPending(kind)
    if (kind === 'like') {
      setLiked(!active)
      setLikes((count) => Math.max(0, count + (active ? -1 : 1)))
    } else {
      setSaved(!active)
    }

    try {
      const response = await fetch('/api/interactions/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: item.id, action }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'Unable to update this interaction.')
      }
    } catch (error) {
      setLiked(previous.liked)
      setSaved(previous.saved)
      setLikes(previous.likes)
      setMessage(error instanceof Error ? error.message : 'Unable to update this interaction.')
    } finally {
      setPending(null)
    }
  }

  async function share() {
    const url = `${window.location.origin}/post/${item.slug}`
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setMessage('Link copied.')
    } catch {
      setMessage('Unable to share right now.')
    }
  }

  const authorHref = item.author?.username ? `/profile/${item.author.username}` : '/explore'
  const typeLabel = item.postType === 'SNIPPET' ? `Code · ${item.language ?? 'text'}` : item.postType === 'LINK' ? 'Link' : 'Article'

  return (
    <article className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/40">
      <header className="flex items-start gap-3">
        <Link href={authorHref} className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/10 font-mono text-xs font-semibold text-accent" aria-label={item.author?.displayName ?? 'Developer'}>
          {(item.author?.displayName ?? 'C').slice(0, 1).toUpperCase()}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <Link href={authorHref} className="font-medium text-foreground hover:text-accent">{item.author?.displayName ?? 'Commun member'}</Link>
            {item.author?.username && <span className="font-mono text-[11px] text-muted">@{item.author.username}</span>}
            {item.isOwn && <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent">You</span>}
            <span aria-hidden="true" className="text-muted">·</span>
            <time dateTime={item.publishedAt ?? undefined} className="text-muted">{formatDate(item.publishedAt)}</time>
          </div>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-subtle">{typeLabel}</p>
        </div>
      </header>

      <Link href={`/post/${item.slug}`} className="mt-4 block">
        <h2 className="text-lg font-semibold leading-snug tracking-tight hover:text-accent">{item.title}</h2>
        {item.preview && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{item.preview}</p>}
      </Link>

      {item.postType === 'LINK' && item.linkUrl && (
        <a href={item.linkUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline">
          {hostnameOf(item.linkUrl)} <span aria-hidden="true">↗</span>
        </a>
      )}

      {item.topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.topics.map((topic) => (
            <Link key={topic.id} href={`/explore?topic=${topic.id}`} className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] text-muted hover:border-accent/40 hover:text-foreground">
              {topic.name}
            </Link>
          ))}
        </div>
      )}

      <footer className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
        <button
          type="button"
          onClick={() => void toggle('like')}
          disabled={pending !== null}
          aria-pressed={liked}
          aria-label={`${liked ? 'Unlike' : 'Like'} this post, ${likes} likes`}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors disabled:opacity-60 ${liked ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-foreground'}`}
        >
          <span aria-hidden="true">{liked ? '♥' : '♡'}</span> {likes}
        </button>
        <Link href={`/post/${item.slug}#discussion`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted transition-colors hover:text-foreground" aria-label={`View ${item.commentCount} comments`}>
          <span aria-hidden="true">◌</span> {item.commentCount}
        </Link>
        <button
          type="button"
          onClick={() => void toggle('save')}
          disabled={pending !== null}
          aria-pressed={saved}
          className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-medium transition-colors disabled:opacity-60 ${saved ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-foreground'}`}
        >
          {saved ? 'Saved' : 'Save'}
        </button>
        <button type="button" onClick={() => void share()} className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-xs font-medium text-muted transition-colors hover:text-foreground">
          Share
        </button>
        <Link href={`/post/${item.slug}`} className="ml-auto text-xs font-semibold text-accent hover:underline">
          Open →
        </Link>
      </footer>
      {message && <p role="status" className="mt-2 text-xs text-muted">{message}</p>}
    </article>
  )
}
