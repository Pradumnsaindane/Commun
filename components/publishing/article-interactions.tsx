'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createComment, listComments } from '@/features/comments/api'
import { getPostInteraction, togglePostInteraction } from '@/features/interactions/api'

type Author = { display_name: string | null; username: string | null; avatar_url: string | null }
type Comment = { id: string; author_id: string; parent_id: string | null; content: string; pinned: boolean; created_at: string; author?: Author | null }
type Stats = { likes: number; saves: number; liked: boolean; saved: boolean }

export function ArticleInteractions({ postId, viewerId }: { postId: string; postAuthorId?: string; viewerId?: string | null }) {
  const [stats, setStats] = useState<Stats>({ likes: 0, saves: 0, liked: false, saved: false })
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  const load = useCallback(async () => {
    try {
      const [interactionState, commentPage] = await Promise.all([
        getPostInteraction(postId),
        listComments(postId),
      ])
      setStats(interactionState)
      setComments(commentPage.comments)
    } catch (loadError) {
      setMessage(loadError instanceof Error ? loadError.message : 'Unable to load discussion activity.')
    }
  }, [postId])

  // The panel hydrates its server-backed counters after the article shell is interactive.
  useEffect(() => { void load() }, [load])

  async function toggle(action: 'like' | 'unlike' | 'save' | 'unsave') {
    setPending(true); setMessage('')
    const previous = stats
    const liking = action === 'like' || action === 'unlike'
    const active = action === 'like' || action === 'save'
    setStats({
      ...stats,
      liked: liking ? active : stats.liked,
      saved: liking ? stats.saved : active,
      likes: action === 'like' ? stats.likes + 1 : action === 'unlike' ? Math.max(0, stats.likes - 1) : stats.likes,
      saves: action === 'save' ? stats.saves + 1 : action === 'unsave' ? Math.max(0, stats.saves - 1) : stats.saves,
    })
    try {
      await togglePostInteraction(postId, action)
      await load()
    } catch (error) {
      setStats(previous)
      setMessage(error instanceof Error ? error.message : 'Unable to update this interaction.')
    } finally {
      setPending(false)
    }
  }

  async function submit(event: FormEvent, parentId: string | null) {
    event.preventDefault()
    const text = parentId ? replyContent : content
    if (!text.trim()) return
    setPending(true); setMessage('')
    try {
      await createComment({ postId, content: text, parentId })
      if (parentId) { setReplyContent(''); setReplyTo(null) } else { setContent('') }
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to comment.')
    } finally {
      setPending(false)
    }
  }

  const topLevel = comments.filter((comment) => comment.parent_id === null)
  const repliesFor = (parentId: string) => comments.filter((comment) => comment.parent_id === parentId)

  function CommentBody({ comment }: { comment: Comment }) {
    const name = comment.author?.display_name ?? 'Community member'
    const href = comment.author?.username ? `/profile/${comment.author.username}` : null
    return (
      <article className="rounded-xl border border-border bg-surface/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-accent/10 font-mono text-[10px] font-semibold text-accent">
              {name.slice(0, 1).toUpperCase()}
            </span>
            {href ? <Link href={href} className="text-xs font-semibold hover:text-accent">{name}</Link> : <span className="text-xs font-semibold">{name}</span>}
            {comment.pinned && <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent">Pinned</span>}
          </div>
          <time className="font-mono text-[10px] text-muted" dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleDateString()}</time>
        </div>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">{comment.content}</p>
        {comment.parent_id === null && (
          <button
            type="button"
            onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyContent('') }}
            className="mt-2 min-h-8 rounded-md px-2 text-[11px] font-semibold text-muted hover:text-accent"
          >
            {replyTo === comment.id ? 'Cancel reply' : 'Reply'}
          </button>
        )}
        {replyTo === comment.id && (
          <form onSubmit={(event) => void submit(event, comment.id)} className="mt-2 flex flex-col gap-2">
            <label htmlFor={`reply-${comment.id}`} className="sr-only">Reply to {name}</label>
            <textarea
              id={`reply-${comment.id}`}
              value={replyContent}
              onChange={(event) => setReplyContent(event.target.value)}
              rows={2}
              maxLength={2000}
              placeholder={`Reply to ${name}…`}
              className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent"
            />
            <button disabled={pending || !replyContent.trim()} className="self-end rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-50">Post reply</button>
          </form>
        )}
        {repliesFor(comment.id).length > 0 && (
          <div className="mt-3 space-y-2 border-l border-border pl-3">
            {repliesFor(comment.id).map((reply) => <CommentBody key={reply.id} comment={reply} />)}
          </div>
        )}
      </article>
    )
  }

  return (
    <section id="discussion" className="mt-14 scroll-mt-24 border-t border-border pt-8" aria-label="Article interactions">
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} onClick={() => void toggle(stats.liked ? 'unlike' : 'like')} className={`min-h-9 rounded-full border px-4 text-sm transition ${stats.liked ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-accent hover:text-foreground'}`} aria-pressed={stats.liked}>
          {stats.liked ? 'Liked' : 'Like'} · {stats.likes}
        </button>
        <button disabled={pending} onClick={() => void toggle(stats.saved ? 'unsave' : 'save')} className={`min-h-9 rounded-full border px-4 text-sm transition ${stats.saved ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-accent hover:text-foreground'}`} aria-pressed={stats.saved}>
          {stats.saved ? 'Saved' : 'Save'} · {stats.saves}
        </button>
        {!viewerId && <Link href="/login" className="text-sm text-muted hover:text-accent">Sign in to interact</Link>}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold">Discussion <span className="font-mono text-sm text-muted">{comments.length}</span></h2>
        {viewerId ? (
          <form onSubmit={(event) => void submit(event, null)} className="mt-4 flex flex-col gap-3">
            <label htmlFor="comment" className="sr-only">Write a comment</label>
            <textarea id="comment" value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} rows={3} placeholder="Share a thoughtful response. Mention people with @username." className="w-full resize-y rounded-xl border border-border bg-surface p-4 text-sm outline-none placeholder:text-muted/60 focus:border-accent" />
            <button disabled={pending || !content.trim()} className="self-end rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50">Post comment</button>
          </form>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            <Link href="/login" className="font-semibold text-accent">Sign in</Link> to join the discussion.
          </p>
        )}
        {message && <p role="status" className="mt-3 text-sm text-red-600">{message}</p>}
        <div className="mt-6 space-y-3">
          {topLevel.length ? topLevel.map((comment) => <CommentBody key={comment.id} comment={comment} />) : (
            <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted">No comments yet. Start the discussion.</p>
          )}
        </div>
      </div>
    </section>
  )
}
