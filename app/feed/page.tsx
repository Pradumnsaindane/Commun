import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, PageContainer } from '@/components/ui/primitives'
import { SocialFeed } from '@/components/feed/social-feed'
import { fetchFeedPage, parseFeedTab } from '@/lib/feed'

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/feed')

  const params = searchParams ? await searchParams : {}
  const activeTab = parseFeedTab(params?.tab)
  const page = await fetchFeedPage(supabase, { tab: activeTab, viewerId: user.id })

  // Real data for the discovery rail. No counts, rankings, or suggestions are
  // fabricated when the tables are empty.
  const [{ data: suggestedDevelopers }, { data: topics }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,display_name,username,bio,interests')
      .eq('status', 'ACTIVE')
      .not('username', 'is', null)
      .neq('id', user.id)
      .order('display_name')
      .limit(3),
    supabase.from('topics').select('id,name').order('name').limit(8),
  ])

  return (
    <PageContainer
      eyebrow="Your network"
      title="Feed"
      description="Real posts from developers you follow, plus everything published across Commun."
    >
      <Link
        href="/compose"
        className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 font-mono text-xs font-semibold text-accent">
          {(user.email ?? 'U').slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-foreground">Share a post, snippet, or link</span>
          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
            Text · code · links · long-form articles
          </span>
        </span>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-accent">Compose →</span>
      </Link>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <SocialFeed
          initialItems={page.items}
          initialCursor={page.nextCursor}
          initialTab={activeTab}
          initialError={page.error}
        />

        <aside className="hidden space-y-4 xl:block">
          {suggestedDevelopers && suggestedDevelopers.length > 0 && (
            <Card className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-[.18em] text-accent">Suggested developers</p>
              <div className="mt-4 space-y-3">
                {suggestedDevelopers.map((developer) => {
                  if (!developer.username) return null
                  return (
                    <Link
                      key={developer.id}
                      href={`/profile/${developer.username}`}
                      className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-background"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/10 font-mono text-[10px] font-semibold text-accent">
                        {(developer.display_name || developer.username).slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-foreground">
                          {developer.display_name || developer.username}
                        </span>
                        <span className="block truncate font-mono text-[10px] text-muted">@{developer.username}</span>
                      </span>
                    </Link>
                  )
                })}
              </div>
              <Link href="/discover" className="mt-4 inline-flex text-xs font-semibold text-accent">
                Discover developers →
              </Link>
            </Card>
          )}

          {topics && topics.length > 0 && (
            <Card className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted">Browse topics</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {topics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/explore?topic=${topic.id}`}
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    {topic.name}
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted">In development</p>
            <h2 className="mt-3 text-sm font-semibold">Communities and jobs</h2>
            <p className="mt-2 text-xs leading-5 text-muted">
              Community spaces and the job board are being built. They will appear here when they are available.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['Communities', 'Jobs'].map((item) => (
                <span key={item} className="rounded border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-subtle">
                  {item} · Soon
                </span>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </PageContainer>
  )
}
