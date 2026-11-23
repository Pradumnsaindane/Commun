'use client'

import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import type { FeedItem, FeedTab } from '@/lib/feed'
import { getFeed } from '@/features/posts/api'
import { FeedCard } from './feed-card'

type Props = {
  initialItems: FeedItem[]
  initialCursor: string | null
  initialTab: FeedTab
  initialError?: string | null
}

export function SocialFeed({ initialItems, initialCursor, initialTab, initialError = null }: Props) {
  const [tab, setTab] = useState<FeedTab>(initialTab)
  const [items, setItems] = useState<FeedItem[]>(initialItems)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const requestId = useRef(0)

  const load = useCallback(async (nextTab: FeedTab, nextCursor: string | null) => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const payload = await getFeed({ tab: nextTab, cursor: nextCursor })
      if (id !== requestId.current) return
      const incoming: FeedItem[] = payload.items
      setItems((current) => (nextCursor ? [...current, ...incoming.filter((item) => !current.some((existing) => existing.id === item.id))] : incoming))
      setCursor(payload.nextCursor)
    } catch (loadError) {
      if (id === requestId.current) setError(loadError instanceof Error ? loadError.message : 'Unable to load the feed.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  function changeTab(nextTab: FeedTab) {
    if (nextTab === tab) return
    setTab(nextTab)
    setItems([])
    setCursor(null)
    void load(nextTab, null)
  }

  return (
    <section className="space-y-4" aria-label="Social feed">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Feed filters">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'following'}
            onClick={() => changeTab('following')}
            className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors ${tab === 'following' ? 'bg-accent text-accent-foreground' : 'text-muted hover:bg-surface hover:text-foreground'}`}
          >
            Following
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'latest'}
            onClick={() => changeTab('latest')}
            className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors ${tab === 'latest' ? 'bg-accent text-accent-foreground' : 'text-muted hover:bg-surface hover:text-foreground'}`}
          >
            Latest
          </button>
          <span className="inline-flex min-h-9 items-center rounded-lg border border-dashed border-border px-3 text-xs text-subtle" title="Ranking requires a scored read model">
            For you · in development
          </span>
        </div>
        <Link href="/compose" className="text-xs font-semibold text-accent hover:underline">New post →</Link>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">
          <p className="font-semibold">The feed could not load.</p>
          <p className="mt-1 text-xs">{error}</p>
          <button type="button" onClick={() => void load(tab, null)} className="mt-3 rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-semibold">Try again</button>
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="space-y-3" role="status" aria-label="Loading feed">
          {[0, 1, 2].map((key) => <div key={key} className="h-40 animate-pulse rounded-xl border border-border bg-surface" />)}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface/60 p-8 text-center">
          <h2 className="text-base font-semibold">{tab === 'following' ? 'Your following feed is quiet.' : 'No published posts yet.'}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            {tab === 'following'
              ? 'Follow developers from Explore, or publish a post to start your feed.'
              : 'Be the first to publish a technical post on Commun.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {tab === 'following' && <Link href="/discover" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-accent/50">Discover developers</Link>}
            <Link href="/compose" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Write a post</Link>
          </div>
        </div>
      )}

      <div className="space-y-3" aria-busy={loading}>
        {items.map((item) => <FeedCard key={item.id} item={item} />)}
      </div>

      {cursor && !error && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => void load(tab, cursor)}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:border-accent/50 disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </section>
  )
}
