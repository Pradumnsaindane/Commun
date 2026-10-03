'use client'

import Link from 'next/link'
import { useState } from 'react'

export function AuthorPresence({ author, authorId, username, bio, followers, following, authenticated }: { author: string; authorId: string; username: string | null; bio: string | null; followers: number; following: boolean; authenticated: boolean }) {
  const [isFollowing, setIsFollowing] = useState(following)
  const [pending, setPending] = useState(false)
  async function toggle() {
    if (!authenticated || !username || pending) return
    setPending(true)
    const response = await fetch('/api/interactions/follow', { method: isFollowing ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ followingId: authorId }) })
    if (response.ok) setIsFollowing(!isFollowing)
    setPending(false)
  }
  return <div className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-surface/60 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/10 text-lg font-semibold text-accent">{author.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2"><Link href={username ? `/profile/${username}` : '/explore'} className="text-sm font-semibold hover:text-accent">{author}</Link>{username && <span className="font-mono text-[10px] text-muted">@{username}</span>}</div><p className="mt-1 max-w-xl truncate text-xs text-muted">{bio || 'Building and sharing with Commun.'}</p><p className="mt-1 font-mono text-[10px] text-muted">{followers} followers</p></div></div>{username && <button type="button" onClick={() => void toggle()} disabled={!authenticated || pending} className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${isFollowing ? 'border border-border text-muted hover:border-accent hover:text-accent' : 'bg-accent text-background hover:brightness-110'} disabled:cursor-not-allowed disabled:opacity-50`}>{isFollowing ? 'Following' : authenticated ? 'Follow author' : 'Sign in to follow'}</button>}</div>
}
