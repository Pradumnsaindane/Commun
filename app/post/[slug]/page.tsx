import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { renderMarkdown, type PostRecord } from '@/lib/posts'
import { ArticleInteractions } from '@/components/publishing/article-interactions'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('posts').select('title,excerpt').eq('slug', slug).eq('status', 'PUBLISHED').maybeSingle()
  return data ? { title: `${data.title} — Commun`, description: data.excerpt ?? undefined } : { title: 'Article not found — Commun' }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase.from('posts').select('id,author_id,title,slug,excerpt,body,cover_image_path,status,reading_time_minutes,published_at,created_at,updated_at').eq('slug', slug).eq('status', 'PUBLISHED').maybeSingle() as { data: PostRecord | null }
  if (!post) notFound()
  const { data: author } = await supabase.from('profiles').select('display_name,username,bio').eq('id', post.author_id).maybeSingle()
  return <main className="min-h-screen bg-background"><div className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><header className="flex items-center justify-between"><Link href="/dashboard" className="font-mono text-lg font-bold">commun<span className="text-accent">.</span></Link><Link href="/discover" className="text-sm text-muted hover:text-foreground">Discover</Link></header><article className="mx-auto max-w-3xl py-16"><div className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Technical article</div><h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">{post.title}</h1>{post.excerpt && <p className="mt-6 text-xl leading-8 text-muted">{post.excerpt}</p>}<div className="mt-8 flex items-center gap-3 border-y border-border py-5"><span className="grid size-10 place-items-center rounded-full bg-accent/15 font-semibold text-accent">{author?.display_name?.slice(0, 1).toUpperCase() ?? '?'}</span><div><Link href={author?.username ? `/profile/${author.username}` : '/discover'} className="text-sm font-semibold hover:text-accent">{author?.display_name ?? 'Commun member'}</Link><p className="font-mono text-xs text-muted">{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Article'} · {post.reading_time_minutes} min read</p></div></div><div className="article-body mt-12" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} /><ArticleInteractions postId={post.id} /></article></div></main>
}
