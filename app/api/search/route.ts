import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const querySchema = z.object({
  q: z.string().trim().max(120).default(''),
  type: z.enum(['all', 'developers', 'articles', 'discussions', 'topics']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(12),
})

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&')
const pageMeta = (page: number, limit: number, total: number) => ({ page, limit, total, hasNextPage: page * limit < total })

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid search parameters.' }, { status: 400 })
  const { q, type, page, limit } = parsed.data
  const supabase = await createClient()
  const term = escapeLike(q)
  const from = (page - 1) * limit
  const shouldSearch = Boolean(term)
  const searchDevelopers = type === 'all' || type === 'developers'
  const searchArticles = type === 'all' || type === 'articles'
  const searchDiscussions = type === 'all' || type === 'discussions'
  const searchTopics = type === 'all' || type === 'topics'

  const [developersResult, articlesResult, discussionsResult, topicsResult] = await Promise.all([
    searchDevelopers ? (() => { let query = supabase.from('profiles').select('id,display_name,username,bio,avatar_url,interests', { count: 'exact' }).eq('status', 'ACTIVE').not('username', 'is', null); if (shouldSearch) query = query.or(`display_name.ilike.%${term}%,username.ilike.%${term}%,bio.ilike.%${term}%`); return query.order('display_name').range(from, from + limit - 1) })() : Promise.resolve({ data: [], count: 0, error: null }),
    searchArticles ? (() => { let query = supabase.from('posts').select('id,author_id,title,slug,excerpt,reading_time_minutes,published_at', { count: 'exact' }).eq('status', 'PUBLISHED'); if (shouldSearch) query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%,body.ilike.%${term}%`); return query.order('published_at', { ascending: false }).range(from, from + limit - 1) })() : Promise.resolve({ data: [], count: 0, error: null }),
    searchDiscussions ? (() => { let query = supabase.from('discussions').select('id,author_id,topic_id,title,content,is_closed,is_pinned,created_at', { count: 'exact' }).eq('is_removed', false); if (shouldSearch) query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`); return query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).range(from, from + limit - 1) })() : Promise.resolve({ data: [], count: 0, error: null }),
    searchTopics ? (() => { let query = supabase.from('topics').select('id,name', { count: 'exact' }); if (shouldSearch) query = query.ilike('name', `%${term}%`); return query.order('name').range(from, from + limit - 1) })() : Promise.resolve({ data: [], count: 0, error: null }),
  ])
  const errors = [developersResult.error, articlesResult.error, discussionsResult.error, topicsResult.error].filter(Boolean)
  if (errors.length) return NextResponse.json({ error: 'Unable to search right now.' }, { status: 500 })
  const authorIds = [...new Set([...(articlesResult.data ?? []).map((row) => row.author_id), ...(discussionsResult.data ?? []).map((row) => row.author_id)])]
  const topicIds = [...new Set([...(articlesResult.data ?? []).map(() => null), ...(discussionsResult.data ?? []).map((row) => row.topic_id)].filter(Boolean))] as string[]
  const [{ data: authors }, { data: topics }] = await Promise.all([
    authorIds.length ? supabase.from('profiles').select('id,display_name,username,avatar_url').in('id', authorIds) : Promise.resolve({ data: [] as { id: string }[] }),
    topicIds.length ? supabase.from('topics').select('id,name').in('id', topicIds) : Promise.resolve({ data: [] as { id: string }[] }),
  ])
  const authorMap = new Map((authors ?? []).map((row) => [row.id, row]))
  const topicMap = new Map((topics ?? []).map((row) => [row.id, row]))
  return NextResponse.json({
    query: q,
    type,
    developers: { items: developersResult.data ?? [], ...pageMeta(page, limit, developersResult.count ?? 0) },
    articles: { items: (articlesResult.data ?? []).map((row) => ({ ...row, author: authorMap.get(row.author_id) ?? null })), ...pageMeta(page, limit, articlesResult.count ?? 0) },
    discussions: { items: (discussionsResult.data ?? []).map((row) => ({ ...row, author: authorMap.get(row.author_id) ?? null, topic: row.topic_id ? topicMap.get(row.topic_id) ?? null : null })), ...pageMeta(page, limit, discussionsResult.count ?? 0) },
    topics: { items: topicsResult.data ?? [], ...pageMeta(page, limit, topicsResult.count ?? 0) },
  })
}
