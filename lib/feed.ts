import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Social feed read model.
 *
 * Phase 1B ships two real tabs — Following and Latest — over the existing
 * `posts` table. Ranking ("For You") is intentionally not faked: it is shown as
 * in development until a scored read model exists.
 *
 * Pagination is keyset (published_at, id), never offset, so concurrent inserts
 * cannot duplicate or skip rows.
 */

export const FEED_TABS = ['following', 'latest'] as const
export type FeedTab = (typeof FEED_TABS)[number]

export const FEED_PAGE_SIZE = 10
export const FEED_MAX_PAGE_SIZE = 20

export type FeedCursor = { publishedAt: string; id: string }

export type FeedItem = {
  id: string
  slug: string
  title: string
  preview: string
  postType: string
  language: string | null
  linkUrl: string | null
  readingTimeMinutes: number
  publishedAt: string | null
  createdAt: string | null
  author: { id: string; username: string | null; displayName: string; avatarUrl: string | null } | null
  topics: { id: string; name: string }[]
  likeCount: number
  commentCount: number
  liked: boolean
  saved: boolean
  isOwn: boolean
}

export type FeedPage = { items: FeedItem[]; nextCursor: string | null; error: string | null }

const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

export function parseFeedTab(value: string | null | undefined): FeedTab {
  return value === 'latest' ? 'latest' : 'following'
}

export function clampFeedLimit(value: number | null | undefined): number {
  const limit = Number(value)
  if (!Number.isFinite(limit)) return FEED_PAGE_SIZE
  return Math.min(FEED_MAX_PAGE_SIZE, Math.max(1, Math.floor(limit)))
}

export function encodeCursor(cursor: FeedCursor): string {
  return Buffer.from(`${cursor.publishedAt}|${cursor.id}`, 'utf8').toString('base64url')
}

export function decodeCursor(raw: string | null | undefined): FeedCursor | null {
  if (!raw) return null
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8')
    const separator = decoded.indexOf('|')
    if (separator <= 0) return null
    const publishedAt = decoded.slice(0, separator)
    const id = decoded.slice(separator + 1)
    if (!UUID.test(id)) return null
    const timestamp = Date.parse(publishedAt)
    if (!Number.isFinite(timestamp)) return null
    return { publishedAt: new Date(timestamp).toISOString(), id }
  } catch {
    return null
  }
}

/** Keyset predicate built only from a validated cursor, never from raw input. */
export function buildKeysetFilter(cursor: FeedCursor): string {
  const timestamp = new Date(cursor.publishedAt).toISOString()
  return `published_at.lt.${timestamp},and(published_at.eq.${timestamp},id.lt.${cursor.id})`
}

export function previewFrom(body: string | null | undefined, limit = 280): string {
  if (!body) return ''
  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text
}

type FeedRow = {
  id: string
  slug: string | null
  title: string | null
  excerpt: string | null
  body: string | null
  post_type?: string | null
  language?: string | null
  link_url?: string | null
  reading_time_minutes: number | null
  published_at: string | null
  created_at: string | null
  author_id: string
}

export async function fetchFeedPage(
  supabase: SupabaseClient,
  options: { tab: FeedTab; viewerId: string | null; cursor?: FeedCursor | null; limit?: number }
): Promise<FeedPage> {
  const limit = clampFeedLimit(options.limit)
  let authorIds: string[] | null = null

  if (options.tab === 'following') {
    if (!options.viewerId) return { items: [], nextCursor: null, error: null }
    const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', options.viewerId)
    authorIds = [options.viewerId, ...((follows ?? []) as { following_id: string }[]).map((row) => row.following_id)]
  }

  let query = supabase.from('posts').select('*').eq('status', 'PUBLISHED').not('published_at', 'is', null)
  if (authorIds) query = query.in('author_id', authorIds)
  if (options.cursor) query = query.or(buildKeysetFilter(options.cursor))

  const { data, error } = await query
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (error) return { items: [], nextCursor: null, error: 'Unable to load the feed right now.' }

  const rows = (data ?? []) as FeedRow[]
  const hasMore = rows.length > limit
  const pageRows = hasMore ? rows.slice(0, limit) : rows
  const ids = pageRows.map((row) => row.id)

  if (!ids.length) return { items: [], nextCursor: null, error: null }

  const [authorsResult, linksResult, likesResult, savesResult, commentsResult, myLikesResult, mySavesResult] =
    await Promise.all([
      supabase.from('profiles').select('id,username,display_name,avatar_url').in('id', [...new Set(pageRows.map((row) => row.author_id))]),
      supabase.from('post_topics').select('post_id,topic_id').in('post_id', ids),
      supabase.from('post_likes').select('post_id').in('post_id', ids),
      supabase.from('post_saves').select('post_id').in('post_id', ids),
      supabase.from('comments').select('post_id').in('post_id', ids).eq('is_removed', false),
      options.viewerId ? supabase.from('post_likes').select('post_id').eq('user_id', options.viewerId).in('post_id', ids) : Promise.resolve({ data: [] }),
      options.viewerId ? supabase.from('post_saves').select('post_id').eq('user_id', options.viewerId).in('post_id', ids) : Promise.resolve({ data: [] }),
    ])

  const topicIds = [...new Set(((linksResult.data ?? []) as { topic_id: string }[]).map((link) => link.topic_id))]
  const { data: topicRows } = topicIds.length
    ? await supabase.from('topics').select('id,name').in('id', topicIds)
    : { data: [] as { id: string; name: string }[] }

  const authorMap = new Map(((authorsResult.data ?? []) as { id: string; username: string | null; display_name: string | null; avatar_url: string | null }[]).map((author) => [author.id, author]))
  const topicMap = new Map(((topicRows ?? []) as { id: string; name: string }[]).map((topic) => [topic.id, topic]))
  const linksByPost = new Map<string, string[]>()
  for (const link of (linksResult.data ?? []) as { post_id: string; topic_id: string }[]) {
    linksByPost.set(link.post_id, [...(linksByPost.get(link.post_id) ?? []), link.topic_id])
  }
  const tally = (rowsValue: unknown) => {
    const map = new Map<string, number>()
    for (const row of (rowsValue ?? []) as { post_id: string }[]) map.set(row.post_id, (map.get(row.post_id) ?? 0) + 1)
    return map
  }
  const likeCounts = tally(likesResult.data)
  const commentCounts = tally(commentsResult.data)
  const myLikes = new Set(((myLikesResult.data ?? []) as { post_id: string }[]).map((row) => row.post_id))
  const mySaves = new Set(((mySavesResult.data ?? []) as { post_id: string }[]).map((row) => row.post_id))

  const items: FeedItem[] = pageRows.map((row) => {
    const author = authorMap.get(row.author_id)
    return {
      id: row.id,
      slug: row.slug ?? row.id,
      title: row.title ?? 'Untitled post',
      preview: row.excerpt?.trim() || previewFrom(row.body),
      postType: row.post_type ?? 'ARTICLE',
      language: row.language ?? null,
      linkUrl: row.link_url ?? null,
      readingTimeMinutes: row.reading_time_minutes ?? 1,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      author: author
        ? { id: author.id, username: author.username ?? null, displayName: author.display_name ?? author.username ?? 'Commun member', avatarUrl: author.avatar_url ?? null }
        : null,
      topics: (linksByPost.get(row.id) ?? []).map((topicId) => topicMap.get(topicId)).filter(Boolean) as { id: string; name: string }[],
      likeCount: likeCounts.get(row.id) ?? 0,
      commentCount: commentCounts.get(row.id) ?? 0,
      liked: myLikes.has(row.id),
      saved: mySaves.has(row.id),
      isOwn: Boolean(options.viewerId && row.author_id === options.viewerId),
    }
  })

  const last = pageRows[pageRows.length - 1]
  const nextCursor = hasMore && last?.published_at ? encodeCursor({ publishedAt: last.published_at, id: last.id }) : null
  return { items, nextCursor, error: null }
}
