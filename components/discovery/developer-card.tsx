'use client'

import Link from 'next/link'
import { useState } from 'react'

export type Developer = { id: string; display_name: string; username: string; bio: string | null; avatar_url: string | null; interests: string[]; follower_count: number; following: boolean }

export function DeveloperCard({ developer, authenticated }: { developer: Developer; authenticated: boolean }) {
  const [following, setFollowing] = useState(developer.following)
  const [count, setCount] = useState(developer.follower_count)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function toggleFollow() {
    if (!authenticated) { window.location.href = `/login?next=/profile/${developer.username}`; return }
    setBusy(true); setError('')
    const response = await fetch('/api/interactions/follow', { method: following ? 'DELETE' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ followingId: developer.id }) })
    const result = await response.json()
    if (response.ok) { setFollowing(result.following); setCount((value) => value + (result.following ? 1 : -1)) } else setError(result.error ?? 'Something went wrong')
    setBusy(false)
  }
  return <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent/50"><div className="flex items-start justify-between gap-3"><Link href={`/profile/${developer.username}`} className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/15 text-lg font-semibold text-accent">{developer.display_name.slice(0, 1).toUpperCase()}</span><span className="min-w-0"><span className="block truncate font-medium">{developer.display_name}</span><span className="block truncate font-mono text-xs text-muted">@{developer.username}</span></span></Link><button type="button" disabled={busy} onClick={toggleFollow} aria-label={`${following ? 'Unfollow' : 'Follow'} ${developer.display_name}`} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${following ? 'border-border text-muted hover:text-foreground' : 'border-accent bg-accent text-background hover:brightness-110'}`}>{busy ? '...' : following ? 'Following' : 'Follow'}</button></div><p className="mt-4 min-h-10 text-sm leading-5 text-muted">{developer.bio || 'No bio added yet.'}</p><div className="mt-4 flex flex-wrap gap-1.5">{developer.interests.slice(0, 4).map((interest) => <span key={interest} className="rounded-md border border-border px-2 py-1 font-mono text-[10px] text-muted">{interest}</span>)}</div><div className="mt-auto flex items-center gap-3 pt-5 font-mono text-xs text-muted"><span>{count} {count === 1 ? 'follower' : 'followers'}</span>{error && <span role="status" className="text-red-400">{error}</span>}</div></article>
}

export function DiscoveryEmpty({ search }: { search?: string }) { return <div className="rounded-xl border border-dashed border-border bg-surface/50 p-10 text-center"><p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">No developers found</p><h2 className="mt-3 text-xl font-semibold">{search ? 'Try a different search.' : 'The network is just getting started.'}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Commun shows real people from the database only. Check back as developers complete their profiles.</p></div> }
