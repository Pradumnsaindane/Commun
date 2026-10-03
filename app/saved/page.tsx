import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/primitives'
import { SectionHeader, Surface } from '@/components/ui/product-surfaces'

export default async function SavedPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login?next=/saved')
  const { data } = await supabase.from('post_saves').select('created_at,posts!inner(id,title,slug,excerpt,reading_time_minutes,published_at,author_id)').eq('user_id', user.id).order('created_at', { ascending: false })
  const posts = (data ?? []).flatMap((row) => { const post = Array.isArray(row.posts) ? row.posts[0] : row.posts; return post ? [{ post: post as { id: string; title: string; slug: string; excerpt: string | null; reading_time_minutes: number } }] : [] })
  return <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-10"><SectionHeader eyebrow="Reading list" title="Saved" description="Keep the ideas worth returning to close." action={<Link href="/explore" className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:border-accent hover:text-accent">Explore articles</Link>} /><div className="mt-8">{posts.length ? <div className="grid gap-3 md:grid-cols-2">{posts.map(({ post }) => <Link key={post.id} href={`/post/${post.slug}`}><Surface className="h-full p-5 transition hover:-translate-y-0.5 hover:border-accent/50"><div className="flex items-start justify-between gap-4"><h2 className="font-semibold leading-6">{post.title}</h2><span className="shrink-0 font-mono text-[10px] text-muted">{post.reading_time_minutes} min</span></div>{post.excerpt && <p className="mt-3 text-sm leading-6 text-muted">{post.excerpt}</p>}<p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-accent">Open article →</p></Surface></Link>)}</div> : <EmptyState title="Your reading list is empty" description="Save an article from Explore or an article page and it will appear here." action="Discover articles" href="/explore" />}</div></main>
}
