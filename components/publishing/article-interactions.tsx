'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'

type Comment = { id: string; author_id: string; parent_id: string | null; content: string; pinned: boolean; created_at: string }
type Stats = { likes: number; saves: number; liked: boolean; saved: boolean }

export function ArticleInteractions({ postId }: { postId: string }) {
  const [stats, setStats] = useState<Stats>({ likes: 0, saves: 0, liked: false, saved: false })
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function load() {
    const [statsResponse, commentsResponse] = await Promise.all([fetch(`/api/interactions/post?postId=${postId}`), fetch(`/api/comments?postId=${postId}`)])
    if (statsResponse.ok) setStats(await statsResponse.json())
    if (commentsResponse.ok) setComments((await commentsResponse.json()).comments)
  }
  // The panel hydrates its server-backed counters after the article shell is interactive.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load() }, [postId])

  async function toggle(action: 'like' | 'unlike' | 'save' | 'unsave') {
    setPending(true); setMessage('')
    const previous = stats
    const liking = action === 'like' || action === 'unlike'
    const active = action === 'like' || action === 'save'
    setStats({ ...stats, liked: liking ? active : stats.liked, saved: liking ? stats.saved : active, likes: action === 'like' ? stats.likes + 1 : action === 'unlike' ? Math.max(0, stats.likes - 1) : stats.likes, saves: action === 'save' ? stats.saves + 1 : action === 'unsave' ? Math.max(0, stats.saves - 1) : stats.saves })
    try {
      const response = await fetch('/api/interactions/post', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, action }) })
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'Please sign in first.')
      await load()
    } catch (error) { setStats(previous); setMessage(error instanceof Error ? error.message : 'Unable to update this interaction.') }
    finally { setPending(false) }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!content.trim()) return
    setPending(true); setMessage('')
    try {
      const response = await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, content }) })
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'Unable to comment.')
      setContent(''); await load()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to comment.') }
    finally { setPending(false) }
  }

  return <section className="mt-14 border-t border-border pt-8" aria-label="Article interactions">
    <div className="flex flex-wrap items-center gap-3">
      <button disabled={pending} onClick={() => void toggle(stats.liked ? 'unlike' : 'like')} className={`rounded-full border px-4 py-2 text-sm transition ${stats.liked ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-accent hover:text-foreground'}`} aria-pressed={stats.liked}>{stats.liked ? 'Liked' : 'Like'} · {stats.likes}</button>
      <button disabled={pending} onClick={() => void toggle(stats.saved ? 'unsave' : 'save')} className={`rounded-full border px-4 py-2 text-sm transition ${stats.saved ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-accent hover:text-foreground'}`} aria-pressed={stats.saved}>{stats.saved ? 'Saved' : 'Save'} · {stats.saves}</button>
      <div className="ml-auto flex flex-wrap items-center gap-3"><Link href={`/discussions?post=${postId}`} className="text-sm text-muted hover:text-accent">Open discussions</Link><Link href="/login" className="text-sm text-muted hover:text-accent">Sign in to join the conversation</Link></div>
    </div>
    <div className="mt-10"><h2 className="text-xl font-semibold">Discussion <span className="font-mono text-sm text-muted">{comments.length}</span></h2>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3"><label htmlFor="comment" className="sr-only">Write a comment</label><textarea id="comment" value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} rows={3} placeholder="Share a thoughtful response..." className="w-full resize-y rounded-xl border border-border bg-surface p-4 text-sm outline-none placeholder:text-muted/60 focus:border-accent" /><button disabled={pending || !content.trim()} className="self-end rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50">Post comment</button></form>
      {message && <p className="mt-3 text-sm text-rose-400">{message}</p>}
      <div className="mt-6 space-y-3">{comments.length ? comments.map((comment) => <article key={comment.id} className="rounded-xl border border-border bg-surface/50 p-4"><div className="flex items-center justify-between"><span className="font-mono text-xs text-muted">{comment.pinned ? 'Pinned discussion' : 'Community member'}</span><time className="font-mono text-xs text-muted">{new Date(comment.created_at).toLocaleDateString()}</time></div><p className="mt-2 text-sm leading-6 text-foreground/90">{comment.content}</p></article>) : <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted">No comments yet. Start the discussion.</p>}</div>
    </div>
  </section>
}
