import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageContainer, Card, EmptyState } from '@/components/ui/primitives'

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
  const activeTab = params?.tab === 'latest' ? 'latest' : 'following'

  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followedIds = (follows ?? []).map((row) => row.following_id)
  // Include user's own articles alongside followed authors in personalized stream
  const authorIds = [user.id, ...followedIds]

  const baseQuery = supabase
    .from('posts')
    .select('id,title,slug,excerpt,reading_time_minutes,published_at,author_id,profiles!inner(display_name,username,avatar_url)')
    .eq('status', 'PUBLISHED')
    .order('published_at', { ascending: false })
    .limit(30)

  let rows: any[] | null = null
  let queryError: any = null

  if (activeTab === 'following') {
    const res = await baseQuery.in('author_id', authorIds)
    rows = res.data
    queryError = res.error
  } else {
    const res = await baseQuery
    rows = res.data
    queryError = res.error
  }

  const posts = rows ?? []

  return (
    <PageContainer
      eyebrow="Your workspace"
      title="Feed"
      description="A focused stream of ideas from the people and topics you follow."
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div className="flex gap-2">
          <Link
            href="/feed?tab=following"
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              activeTab === 'following'
                ? 'bg-accent text-background'
                : 'text-muted hover:bg-surface hover:text-foreground'
            }`}
          >
            Following & You
          </Link>
          <Link
            href="/feed?tab=latest"
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              activeTab === 'latest'
                ? 'bg-accent text-background'
                : 'text-muted hover:bg-surface hover:text-foreground'
            }`}
          >
            Latest Across Commun
          </Link>
          <Link
            href="/explore"
            className="rounded-lg px-3 py-2 text-xs text-muted hover:bg-surface hover:text-foreground"
          >
            Explore
          </Link>
        </div>
        <Link href="/write" className="text-xs font-semibold text-accent hover:underline">
          Start writing →
        </Link>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="space-y-3">
          {queryError ? (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">
              <p className="font-semibold">Unable to load feed records.</p>
              <p className="mt-1 text-xs text-muted">{queryError.message || 'Please refresh or retry shortly.'}</p>
            </div>
          ) : posts.length ? (
            posts.map((post) => {
              const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
              const isOwnPost = post.author_id === user.id
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
                    {isOwnPost && (
                      <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                        You
                      </span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString()
                        : 'Recently published'}
                    </span>
                  </div>
                  <Link href={`/post/${post.slug}`} className="mt-3 block">
                    <h2 className="text-xl font-semibold tracking-tight hover:text-accent">{post.title}</h2>
                    {post.excerpt && <p className="mt-2 text-sm leading-6 text-muted">{post.excerpt}</p>}
                  </Link>
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted">
                    {post.reading_time_minutes} min read
                  </p>
                </article>
              )
            })
          ) : (
            <EmptyState
              title={
                activeTab === 'following'
                  ? 'No posts from people you follow yet.'
                  : 'No published articles yet.'
              }
              description={
                activeTab === 'following'
                  ? 'Discover developers to follow, or write an article to share with the community.'
                  : 'Be the first to publish an article on Commun.dev.'
              }
              action={activeTab === 'following' ? 'Discover developers' : 'Write an article'}
              href={activeTab === 'following' ? '/discover' : '/write'}
            />
          )}
        </section>

        <aside className="hidden space-y-4 xl:block">
          <Card className="p-5">
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-accent">Next step</p>
            <h2 className="mt-3 text-sm font-semibold">Keep the network useful</h2>
            <p className="mt-2 text-xs leading-5 text-muted">
              Follow people whose work you want to learn from, or share your own engineering experience.
            </p>
            <Link href="/discover" className="mt-4 inline-flex text-xs font-semibold text-accent">
              Browse developers →
            </Link>
          </Card>
        </aside>
      </div>
    </PageContainer>
  )
}
