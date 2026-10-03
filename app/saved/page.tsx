import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/saved')
  const { data } = await supabase.from('post_saves').select('created_at,posts!inner(id,title,slug,excerpt,reading_time_minutes,published_at,author_id)').eq('user_id', user.id).order('created_at', { ascending: false })
  const posts = (data ?? []).flatMap((row) => { const post = Array.isArray(row.posts) ? row.posts[0] : row.posts; return post ? [{ created_at: row.created_at, post: post as { id: string; title: string; slug: string; excerpt: string | null; reading_time_minutes: number; published_at: string | null } }] : [] })
  return <main className="min-h-screen bg-background"><div className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><header className="flex items-center justify-between"><Link href="/dashboard" className="font-mono text-lg font-bold">commun<span className="text-accent">.</span></Link><Link href="/discover" className="text-sm text-muted hover:text-foreground">Discover</Link></header><section className="mx-auto max-w-3xl py-14"><p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Your reading list</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Saved articles</h1><p className="mt-3 text-muted">Keep the pieces worth returning to close.</p><div className="mt-10 space-y-3">{posts.length ? posts.map(({ post }) => <Link key={post.id} href={`/post/${post.slug}`} className="block rounded-xl border border-border bg-surface p-5 transition hover:border-accent"><div className="flex items-center justify-between gap-4"><h2 className="font-semibold">{post.title}</h2><span className="shrink-0 font-mono text-xs text-muted">{post.reading_time_minutes} min</span></div>{post.excerpt && <p className="mt-2 text-sm leading-6 text-muted">{post.excerpt}</p>}</Link>) : <div className="rounded-xl border border-dashed border-border p-10 text-center"><p className="font-semibold">Your list is empty</p><p className="mt-2 text-sm text-muted">Save an article while exploring Commun.</p><Link href="/discover" className="mt-5 inline-block text-sm text-accent hover:underline">Discover articles</Link></div>}</div></section></div></main>
}
