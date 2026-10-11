'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export type DashboardProfile = {
  display_name: string
  username: string | null
  bio: string | null
  avatar_url: string | null
}

export type AuthorPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  status: 'DRAFT' | 'PUBLISHED' | string
  reading_time_minutes: number
  published_at: string | null
  created_at: string
  author_id: string
}

export type FeedPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  reading_time_minutes: number
  published_at: string | null
  author_id: string
  profiles?: {
    display_name: string | null
    username: string | null
  } | {
    display_name: string | null
    username: string | null
  }[]
}

const navItems = [
  ['Dashboard', '/dashboard'],
  ['News', '/news'],
  ['Discover', '/discover'],
  ['Feed', '/feed'],
  ['Discussions', '/community'],
  ['Saved', '/saved'],
  ['Notifications', '/notifications'],
] as const

function EmptyCard({
  title,
  description,
  href,
  action,
}: {
  title: string
  description: string
  href?: string
  action?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/70 p-5">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">{title}</p>
      <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
      {href && action && (
        <Link href={href} className="mt-4 inline-flex text-sm font-semibold text-accent hover:underline">
          {action} <span aria-hidden="true" className="ml-1">→</span>
        </Link>
      )}
    </div>
  )
}

function Sidebar({ profile }: { profile: DashboardProfile }) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border/80 px-4 py-6 lg:block">
      <div className="flex h-full min-h-[calc(100vh-73px)] flex-col">
        <Link href="/dashboard" className="px-3 font-mono text-lg font-bold tracking-tight">
          commun<span className="text-accent">.</span>
        </Link>
        <p className="mb-6 mt-8 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          Workspace
        </p>
        <nav aria-label="Dashboard navigation" className="flex flex-col gap-1">
          {navItems.map(([label, href], index) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-surface hover:text-foreground ${
                index === 0 ? 'bg-surface font-medium text-foreground' : 'text-muted'
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="my-5 border-t border-border/80" />
          <Link
            href="/write"
            className="rounded-lg bg-accent px-3 py-2.5 text-center text-sm font-semibold text-background transition hover:brightness-110"
          >
            Write article
          </Link>
          <div className="my-5 border-t border-border/80" />
          <Link
            href="/settings"
            className="rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-surface hover:text-foreground"
          >
            Settings
          </Link>
        </nav>
        <div className="mt-auto border-t border-border/80 pt-5">
          <Link
            href={profile.username ? `/profile/${profile.username}` : '/settings'}
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface"
          >
            <span className="grid size-9 place-items-center rounded-full bg-accent/15 font-semibold text-accent">
              {profile.display_name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{profile.display_name}</span>
              <span className="block truncate font-mono text-xs text-muted">
                @{profile.username ?? 'member'}
              </span>
            </span>
          </Link>
        </div>
      </div>
    </aside>
  )
}

function Header({ profile }: { profile: DashboardProfile }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="flex h-[73px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/dashboard" className="font-mono text-lg font-bold tracking-tight lg:hidden">
          commun<span className="text-accent">.</span>
        </Link>
        <form onSubmit={handleSearch} className="hidden min-w-0 flex-1 max-w-md items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted sm:flex">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Search Commun</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search developers, articles, topics"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
          />
        </form>
        <div className="ml-auto flex items-center gap-2">
          <Link
            aria-label="Notifications"
            href="/notifications"
            className="rounded-lg px-3 py-2 text-muted hover:bg-surface hover:text-foreground"
          >
            ◌
          </Link>
          <div className="relative">
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="menu"
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-surface"
            >
              <span className="grid size-8 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                {profile.display_name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium">{profile.display_name}</span>
                <span className="block font-mono text-[11px] text-muted">@{profile.username ?? 'member'}</span>
              </span>
            </button>
            {open && (
              <div
                role="menu"
                className="absolute right-0 top-12 w-48 rounded-lg border border-border bg-surface p-1 shadow-2xl z-30"
              >
                {profile.username && (
                  <Link
                    role="menuitem"
                    href={`/profile/${profile.username}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm hover:bg-background"
                  >
                    View profile
                  </Link>
                )}
                <Link
                  role="menuitem"
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-background"
                >
                  Settings
                </Link>
                <button
                  role="menuitem"
                  onClick={logout}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-muted hover:bg-background hover:text-foreground"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export function Dashboard({
  profile,
  myPosts,
  feedPosts,
}: {
  profile: DashboardProfile
  myPosts: AuthorPost[]
  feedPosts: FeedPost[]
}) {
  const firstName = profile.display_name.split(' ')[0]

  return (
    <div className="min-h-screen bg-background">
      <Header profile={profile} />
      <div className="mx-auto flex max-w-[1500px]">
        <Sidebar profile={profile} />
        <main className="min-w-0 flex-1 px-4 py-8 pb-28 sm:px-6 lg:px-10">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Commun / workspace</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Good to see you, {firstName}.
              </h1>
              <p className="mt-2 text-sm text-muted">
                Here&apos;s what&apos;s happening in your developer network.
              </p>
            </div>
            <Link
              href="/write"
              className="inline-flex w-fit rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition hover:brightness-110"
            >
              Write an article <span aria-hidden="true" className="ml-2">↗</span>
            </Link>
          </div>

          <section aria-labelledby="quick-actions" className="mb-8">
            <h2 id="quick-actions" className="mb-3 text-sm font-semibold">
              Quick actions
            </h2>
            <div className="grid gap-3 sm:grid-cols-4">
              <Link
                href="/news"
                className="rounded-xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent/50"
              >
                <p className="text-sm font-semibold">Developer news</p>
                <p className="mt-1 text-xs text-muted">Real engineering blogs & updates.</p>
              </Link>
              <Link
                href="/explore"
                className="rounded-xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent/50"
              >
                <p className="text-sm font-semibold">Explore developers</p>
                <p className="mt-1 text-xs text-muted">Find people building interesting things.</p>
              </Link>
              <Link
                href="/community"
                className="rounded-xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent/50"
              >
                <p className="text-sm font-semibold">Start a discussion</p>
                <p className="mt-1 text-xs text-muted">Ask questions and learn together.</p>
              </Link>
              <Link
                href="/saved"
                className="rounded-xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent/50"
              >
                <p className="text-sm font-semibold">Saved library</p>
                <p className="mt-1 text-xs text-muted">Return to knowledge worth keeping.</p>
              </Link>
            </div>
          </section>

          {/* Section: Author's Own Articles (Guarantees newly published articles appear immediately) */}
          <section aria-labelledby="your-articles-heading" className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Creator studio</p>
                <h2 id="your-articles-heading" className="mt-1 text-xl font-semibold">
                  Your articles & drafts
                </h2>
              </div>
              <Link href="/write" className="text-sm text-accent hover:underline">
                New draft +
              </Link>
            </div>

            {myPosts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface/40 p-6 text-center">
                <p className="text-sm font-medium">You haven&apos;t written any articles yet.</p>
                <p className="mt-1 text-xs text-muted">
                  Share what you are building or learning to establish your developer identity.
                </p>
                <Link
                  href="/write"
                  className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-background"
                >
                  Write your first article
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {myPosts.map((post) => (
                  <article
                    key={post.id}
                    className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 transition hover:border-accent/50"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                            post.status === 'PUBLISHED'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {post.status}
                        </span>
                        <time className="font-mono text-[11px] text-muted">
                          {new Date(post.published_at || post.created_at).toLocaleDateString()}
                        </time>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold tracking-tight hover:text-accent">
                        <Link href={post.status === 'PUBLISHED' ? `/post/${post.slug}` : `/write`}>
                          {post.title}
                        </Link>
                      </h3>
                      {post.excerpt && (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{post.excerpt}</p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-border/80 pt-3 text-xs text-muted">
                      <span>{post.reading_time_minutes} min read</span>
                      <Link
                        href={post.status === 'PUBLISHED' ? `/post/${post.slug}` : `/write`}
                        className="font-medium text-accent hover:underline"
                      >
                        {post.status === 'PUBLISHED' ? 'View live →' : 'Continue writing →'}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Section: Community Network Feed */}
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
            <section aria-labelledby="feed-heading">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Personalized feed</p>
                  <h2 id="feed-heading" className="mt-1 text-xl font-semibold">
                    For you
                  </h2>
                </div>
                <Link href="/feed" className="text-sm text-muted hover:text-foreground">
                  Open feed →
                </Link>
              </div>

              {feedPosts.length === 0 ? (
                <EmptyCard
                  title="Your feed is empty"
                  description="Follow developers and topics to start building your feed. Your posts and conversations will appear here as the network grows."
                  href="/discover"
                  action="Discover developers"
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {feedPosts.map((post) => {
                    const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
                    return (
                      <article
                        key={post.id}
                        className="rounded-xl border border-border bg-surface p-5 transition hover:border-accent/50"
                      >
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <Link
                            href={author?.username ? `/profile/${author.username}` : '/explore'}
                            className="font-medium text-foreground hover:text-accent"
                          >
                            {author?.display_name ?? 'Commun member'}
                          </Link>
                          <span aria-hidden="true">·</span>
                          <span>
                            {post.published_at
                              ? new Date(post.published_at).toLocaleDateString()
                              : 'Recently'}
                          </span>
                        </div>
                        <Link href={`/post/${post.slug}`} className="mt-2 block">
                          <h3 className="text-lg font-semibold tracking-tight hover:text-accent">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted">
                              {post.excerpt}
                            </p>
                          )}
                        </Link>
                        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted">
                          {post.reading_time_minutes} min read
                        </p>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            <aside className="flex flex-col gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Context</p>
                <h2 className="mt-1 text-xl font-semibold">Discover</h2>
              </div>
              <EmptyCard
                title="Developer News"
                description="Read verified engineering updates from official engineering blogs."
                href="/news"
                action="Read news"
              />
              <EmptyCard
                title="Discussions"
                description="Ask technical questions or share architecture trade-offs."
                href="/community"
                action="Open discussions"
              />
            </aside>
          </div>
        </main>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-surface/95 p-3 backdrop-blur lg:hidden"
      >
        <Link href="/dashboard" className="text-xs font-semibold text-accent">
          Home
        </Link>
        <Link href="/news" className="text-xs text-muted">
          News
        </Link>
        <Link href="/write" className="text-xs text-muted">
          Create
        </Link>
        <Link href="/community" className="text-xs text-muted">
          Discuss
        </Link>
        <Link href="/settings" className="text-xs text-muted">
          Profile
        </Link>
      </nav>
    </div>
  )
}

export function DashboardError() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24">
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Dashboard unavailable</p>
        <h1 className="mt-3 text-2xl font-semibold">We couldn&apos;t load your workspace.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Your session may have expired. Please sign in again to continue.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background"
        >
          Return to login
        </Link>
      </div>
    </div>
  )
}
