import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DeveloperCard, type Developer } from '@/components/discovery/developer-card'
import { isMembershipActive, membershipFor, type MembershipState } from '@/lib/monetization'
import { canBill } from '@/lib/stripe'
import { SubscribeButton } from '@/components/billing/subscribe-button'
import { normalizeGithub, normalizeUrl, profileCompleteness } from '@/lib/profile'

type ProfileRow = {
  id: string
  display_name: string
  username: string
  bio: string | null
  avatar_url: string | null
  website: string | null
  github: string | null
  interests: string[] | null
  headline?: string | null
  location?: string | null
  portfolio_url?: string | null
  cover_image_path?: string | null
  skills?: string[] | null
  technologies?: string[] | null
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()
  const [{ data: profileData }, { data: { user } }] = await Promise.all([
    supabase.from('profiles').select('*').ilike('username', username).maybeSingle(),
    supabase.auth.getUser(),
  ])
  if (!profileData?.username) notFound()
  const profile = profileData as ProfileRow

  const [{ count: followers }, { count: following }, { data: relationship }, { data: posts }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
    user ? supabase.from('follows').select('following_id').eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('posts').select('id,title,slug,excerpt,reading_time_minutes,published_at').eq('author_id', profile.id).eq('status', 'PUBLISHED').order('published_at', { ascending: false }).limit(20),
  ])

  const developer: Developer = {
    ...profile,
    username: profile.username,
    interests: profile.interests ?? [],
    follower_count: followers ?? 0,
    following: Boolean(relationship),
  }
  const isOwner = user?.id === profile.id
  const membership = await membershipFor(supabase, user?.id ?? null, profile.id)
  const subscribeState: MembershipState = !user ? 'guest' : isOwner ? 'owner' : isMembershipActive(membership) ? 'member' : 'none'

  const cover = normalizeUrl(profile.cover_image_path)
  const avatar = normalizeUrl(profile.avatar_url)
  const links = [
    { label: 'Website', href: normalizeUrl(profile.website) },
    { label: 'GitHub', href: normalizeGithub(profile.github) },
    { label: 'Portfolio', href: normalizeUrl(profile.portfolio_url) },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href))
  const completeness = profileCompleteness(profile as unknown as Record<string, unknown>)

  return (
    <main className="workspace-enter min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/discover" className="font-mono text-lg font-bold">commun<span className="text-accent">.</span></Link>
          <Link href="/discover" className="inline-flex min-h-10 items-center text-sm text-muted hover:text-foreground">Discover developers</Link>
        </div>

        <section className="glass-surface glass-floating mt-7 overflow-hidden rounded-2xl">
          <div
            className="h-28 w-full bg-gradient-to-r from-accent/25 via-accent/10 to-transparent sm:h-36"
            style={cover ? { backgroundImage: `url("${cover}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            aria-hidden="true"
          />
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span
                  className="grid size-16 shrink-0 place-items-center rounded-full bg-accent/15 bg-cover bg-center text-2xl font-semibold text-accent sm:size-20 sm:text-3xl"
                  style={avatar ? { backgroundImage: `url("${avatar}")` } : undefined}
                  aria-label={avatar ? `${profile.display_name}'s profile picture` : undefined}
                >
                  {!avatar && profile.display_name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{profile.display_name}</h1>
                  <p className="mt-1 truncate font-mono text-sm text-muted">@{profile.username}</p>
                  {profile.headline && <p className="mt-2 max-w-xl text-sm leading-6 text-foreground/90">{profile.headline}</p>}
                  {profile.location && <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-subtle">{profile.location}</p>}
                </div>
              </div>
              {isOwner ? (
                <Link href="/settings/profile" className="inline-flex min-h-10 w-fit items-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-accent/40">Edit profile</Link>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <SubscribeButton creatorId={profile.id} state={subscribeState} billingReady={canBill()} profileHref={`/profile/${profile.username}`} />
                  <DeveloperCard developer={developer} authenticated={Boolean(user)} />
                </div>
              )}
            </div>

            <p className="mt-7 max-w-2xl break-words text-sm leading-7 text-muted sm:text-base">
              {profile.bio || 'This developer has not added a bio yet.'}
            </p>

            {links.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {links.map((link) => (
                  <a key={link.label} href={link.href} target="_blank" rel="me noopener noreferrer" className="text-sm font-medium text-accent hover:underline">
                    {link.label} ↗
                  </a>
                ))}
              </div>
            )}

            {(profile.skills?.length || profile.technologies?.length || profile.interests?.length) ? (
              <div className="mt-6 space-y-3">
                {profile.skills && profile.skills.length > 0 && (
                  <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Skills</p><div className="mt-2 flex flex-wrap gap-2">{profile.skills.map((skill) => <span key={skill} className="rounded-full border border-border bg-surface/80 px-3 py-1.5 font-mono text-xs text-foreground/80">{skill}</span>)}</div></div>
                )}
                {profile.technologies && profile.technologies.length > 0 && (
                  <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Technologies</p><div className="mt-2 flex flex-wrap gap-2">{profile.technologies.map((technology) => <span key={technology} className="rounded-full border border-accent/25 bg-accent/5 px-3 py-1.5 font-mono text-xs text-accent">{technology}</span>)}</div></div>
                )}
                {profile.interests && profile.interests.length > 0 && (
                  <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Interests</p><div className="mt-2 flex flex-wrap gap-2">{profile.interests.map((interest) => <span key={interest} className="rounded-full border border-border px-3 py-1.5 font-mono text-xs text-muted">{interest}</span>)}</div></div>
                )}
              </div>
            ) : null}

            {isOwner && completeness.missing.length > 0 && (
              <div className="mt-6 rounded-xl border border-dashed border-border bg-background/60 p-4">
                <p className="text-sm font-medium">Finish your profile</p>
                <p className="mt-1 text-xs leading-5 text-muted">Add {completeness.missing.slice(0, 3).join(', ')} to help other developers find and understand your work.</p>
                <Link href="/settings/profile" className="mt-2 inline-flex text-xs font-semibold text-accent">Edit profile →</Link>
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-muted">
              <span>{followers ?? 0} followers</span>
              <span>{following ?? 0} following</span>
              <span>{posts?.length ?? 0} published</span>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
            <h2 className="text-xl font-semibold tracking-tight">Published work</h2>
            <Link href="/explore" className="text-xs font-semibold text-accent hover:underline">Explore more →</Link>
          </div>
          {posts?.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {posts.map((post) => (
                <Link key={post.id} href={`/post/${post.slug}`} className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/50">
                  <h3 className="font-semibold leading-6">{post.title}</h3>
                  {post.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted">{post.excerpt}</p>}
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Published'} · {post.reading_time_minutes} min read
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-border p-6 text-sm text-muted">
              {isOwner ? 'You have not published anything yet.' : 'No published work yet.'}
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
