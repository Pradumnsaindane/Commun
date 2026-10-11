import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDeveloperNews, NEWS_CATEGORIES } from '@/lib/news'
import { PageContainer, Card } from '@/components/ui/primitives'

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; q?: string; page?: string }>
}) {
  const params = searchParams ? await searchParams : {}
  const activeCategory = params?.category || 'All'
  const searchQuery = params?.q?.trim() || ''
  const page = Math.max(1, Number(params?.page) || 1)
  const limit = 15

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { items, total, lastSynchronizedAt } = await getDeveloperNews({
    supabase,
    category: activeCategory,
    search: searchQuery,
    page,
    limit,
  })

  const hasNextPage = page * limit < total

  return (
    <PageContainer
      eyebrow="Technology Intelligence"
      title="Developer News"
      description="Genuine engineering blogs, architectural announcements, and open-source updates from verified sources."
    >
      {/* Top Controls: Search and Navigation */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <form method="GET" action="/news" className="flex max-w-md flex-1 items-center gap-2">
          {activeCategory !== 'All' && <input type="hidden" name="category" value={activeCategory} />}
          <div className="relative flex-1">
            <span aria-hidden="true" className="absolute left-3 top-2.5 text-muted">
              ⌕
            </span>
            <input
              name="q"
              defaultValue={searchQuery}
              placeholder="Search engineering headlines or topics..."
              className="w-full rounded-lg border border-border bg-surface pl-8 pr-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-accent"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-muted">
          {lastSynchronizedAt && (
            <span className="font-mono text-[11px]">
              Synced {new Date(lastSynchronizedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Link
            href="/dashboard"
            className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface hover:text-foreground"
          >
            Workspace
          </Link>
        </div>
      </div>

      {/* Category Pills */}
      <nav
        aria-label="News categories"
        className="mt-6 flex flex-wrap gap-1.5 overflow-x-auto pb-2 scrollbar-none"
      >
        <Link
          href={`/news${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}
          className={`rounded-full px-3.5 py-1.5 text-xs transition ${
            activeCategory === 'All'
              ? 'bg-accent font-semibold text-background'
              : 'border border-border bg-surface/50 text-muted hover:border-accent/50 hover:text-foreground'
          }`}
        >
          All Stories
        </Link>
        {NEWS_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat
          const queryParams = new URLSearchParams()
          queryParams.set('category', cat)
          if (searchQuery) queryParams.set('q', searchQuery)
          return (
            <Link
              key={cat}
              href={`/news?${queryParams.toString()}`}
              className={`rounded-full px-3.5 py-1.5 text-xs transition ${
                isActive
                  ? 'bg-accent font-semibold text-background'
                  : 'border border-border bg-surface/50 text-muted hover:border-accent/50 hover:text-foreground'
              }`}
            >
              {cat}
            </Link>
          )
        })}
      </nav>

      {/* Layout Grid */}
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main News Stream */}
        <section aria-labelledby="news-stream-heading" className="space-y-4">
          <h2 id="news-stream-heading" className="sr-only">
            Engineering news articles
          </h2>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-12 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">No stories found</p>
              <h3 className="mt-3 text-xl font-semibold">No news matching your filter</h3>
              <p className="mt-2 text-sm text-muted">
                {searchQuery
                  ? `No stories matched "${searchQuery}". Try a broader term or reset category filter.`
                  : 'No stories available in this category right now.'}
              </p>
              <Link
                href="/news"
                className="mt-6 inline-flex rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-background"
              >
                Reset filters
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.canonicalUrl}
                className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 transition hover:border-accent/50 sm:p-6"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-accent/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-accent">
                        {item.sourceName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px] text-muted">{item.category}</span>
                    </div>
                    <time dateTime={item.publishedAt} className="font-mono text-[11px] text-muted">
                      {new Date(item.publishedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  </div>

                  <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground hover:text-accent">
                    <a
                      href={item.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-baseline gap-1"
                    >
                      {item.title}
                      <span aria-hidden="true" className="text-xs text-muted">
                        ↗
                      </span>
                    </a>
                  </h3>

                  {item.summary && (
                    <p className="mt-2 text-sm leading-6 text-muted line-clamp-3">{item.summary}</p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4 text-xs">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
                    <span>Source: {item.sourceDomain}</span>
                    {item.score > 0 && <span>· {item.score} points</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/discussions/new?title=${encodeURIComponent(
                        `Discussion: ${item.title}`
                      )}&content=${encodeURIComponent(
                        `What are your thoughts on this story from ${item.sourceName}?\n\nSource: ${item.canonicalUrl}`
                      )}`}
                      className="rounded-md border border-border px-2.5 py-1 text-xs text-muted transition hover:border-accent hover:text-accent"
                    >
                      Discuss in community
                    </Link>
                    <a
                      href={item.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-background transition hover:brightness-110"
                    >
                      Read original article ↗
                    </a>
                  </div>
                </div>
              </article>
            ))
          )}

          {/* Pagination */}
          {(page > 1 || hasNextPage) && (
            <div className="flex items-center justify-between pt-4">
              {page > 1 ? (
                <Link
                  href={`/news?${new URLSearchParams({
                    ...(activeCategory !== 'All' ? { category: activeCategory } : {}),
                    ...(searchQuery ? { q: searchQuery } : {}),
                    page: String(page - 1),
                  }).toString()}`}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:border-accent"
                >
                  ← Previous page
                </Link>
              ) : (
                <div />
              )}

              <span className="font-mono text-xs text-muted">Page {page}</span>

              {hasNextPage ? (
                <Link
                  href={`/news?${new URLSearchParams({
                    ...(activeCategory !== 'All' ? { category: activeCategory } : {}),
                    ...(searchQuery ? { q: searchQuery } : {}),
                    page: String(page + 1),
                  }).toString()}`}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:border-accent"
                >
                  Next page →
                </Link>
              ) : (
                <div />
              )}
            </div>
          )}
        </section>

        {/* Sidebar: Curated Sources and Context */}
        <aside className="space-y-5">
          <Card className="p-5">
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-accent">Intelligence Policy</p>
            <h3 className="mt-3 text-sm font-semibold">Verified Tech Feeds Only</h3>
            <p className="mt-2 text-xs leading-5 text-muted">
              Commun.dev ingests only verified technical blogs, engineering changelogs, and peer-reviewed discussion feeds.
              We preserve original source attribution and direct all readers to primary author links.
            </p>
          </Card>

          <Card className="p-5">
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-accent">Integrated Sources</p>
            <ul className="mt-3 divide-y divide-border/60 text-xs text-muted">
              <li className="flex justify-between py-2">
                <span>GitHub Engineering</span>
                <span className="font-mono text-[11px] text-accent">RSS</span>
              </li>
              <li className="flex justify-between py-2">
                <span>DEV Community</span>
                <span className="font-mono text-[11px] text-accent">REST API</span>
              </li>
              <li className="flex justify-between py-2">
                <span>Hacker News Top Stories</span>
                <span className="font-mono text-[11px] text-accent">Firebase API</span>
              </li>
              <li className="flex justify-between py-2">
                <span>AWS & Cloud Blogs</span>
                <span className="font-mono text-[11px] text-accent">RSS</span>
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-accent">Community Discussion</p>
            <h3 className="mt-3 text-sm font-semibold">Have architecture thoughts?</h3>
            <p className="mt-2 text-xs leading-5 text-muted">
              Share real-world impact or question design decisions with other developers.
            </p>
            <Link
              href="/community"
              className="mt-4 inline-flex text-xs font-semibold text-accent hover:underline"
            >
              Go to Community Forum →
            </Link>
          </Card>
        </aside>
      </div>
    </PageContainer>
  )
}
