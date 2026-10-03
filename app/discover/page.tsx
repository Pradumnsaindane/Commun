import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DeveloperCard, DiscoveryEmpty, type Developer } from '@/components/discovery/developer-card'

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string; interest?: string; page?: string }> }) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const interest = params.interest?.trim() ?? ''
  const page = Math.max(1, Number(params.page) || 1)
  const perPage = 12
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let profileQuery = supabase.from('profiles').select('id,display_name,username,bio,avatar_url,interests').not('username', 'is', null).neq('id', user?.id ?? '')
  if (query) profileQuery = profileQuery.or(`display_name.ilike.%${query}%,username.ilike.%${query}%,bio.ilike.%${query}%`)
  if (interest) profileQuery = profileQuery.contains('interests', [interest])
  const { data: rows, error } = await profileQuery.order('display_name').range((page - 1) * perPage, page * perPage - 1)
  const developers: Developer[] = []
  if (!error && rows?.length) {
    const ids = rows.map((row) => row.id)
    const [{ data: follows }, { data: mine }] = await Promise.all([supabase.from('follows').select('following_id').in('following_id', ids), user ? supabase.from('follows').select('following_id').eq('follower_id', user.id).in('following_id', ids) : Promise.resolve({ data: [] as { following_id: string }[] })])
    const counts = new Map<string, number>(); follows?.forEach((row) => counts.set(row.following_id, (counts.get(row.following_id) ?? 0) + 1))
    const following = new Set((mine ?? []).map((row) => row.following_id))
    rows.forEach((row) => developers.push({ ...row, username: row.username!, interests: row.interests ?? [], follower_count: counts.get(row.id) ?? 0, following: following.has(row.id) }))
  }
  const topics = Array.from(new Set((rows ?? []).flatMap((row) => row.interests ?? []))).slice(0, 12)
  return <main className="min-h-screen bg-background"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10"><div className="flex items-center justify-between gap-4"><Link href="/dashboard" className="font-mono text-lg font-bold">commun<span className="text-accent">.</span></Link><Link href="/dashboard" className="text-sm text-muted hover:text-foreground">Back to dashboard</Link></div><div className="mt-14 max-w-2xl"><p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Developer directory</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Find your people.</h1><p className="mt-4 text-base leading-7 text-muted">Discover developers by what they build, learn, and care about.</p></div><form className="mt-8 flex max-w-3xl gap-2" role="search"><label className="sr-only" htmlFor="developer-search">Search developers</label><input id="developer-search" name="q" defaultValue={query} placeholder="Search by name, username, or bio" className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent" /><button className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-background">Search</button></form><div className="mt-8 flex flex-wrap gap-2" aria-label="Interest filters"><Link href="/discover" className={`rounded-full border px-3 py-1.5 text-xs ${!interest ? 'border-accent text-accent' : 'border-border text-muted'}`}>All developers</Link>{topics.map((topic) => <Link key={topic} href={`/discover?interest=${encodeURIComponent(topic)}`} className={`rounded-full border px-3 py-1.5 text-xs ${interest === topic ? 'border-accent text-accent' : 'border-border text-muted'}`}>{topic}</Link>)}</div><div className="mt-10">{error ? <DiscoveryEmpty /> : developers.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{developers.map((developer) => <DeveloperCard key={developer.id} developer={developer} authenticated={Boolean(user)} />)}</div> : <DiscoveryEmpty search={query || interest} />}</div>{developers.length === perPage && <nav className="mt-8 flex justify-end"><Link href={`/discover?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(interest ? { interest } : {}), page: String(page + 1) })}`} className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground">Next page →</Link></nav>}</div></main>
}
