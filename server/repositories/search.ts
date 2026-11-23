import type { SupabaseClient } from '@supabase/supabase-js'
import { ilikeFilter, isSearchableTerm, orIlikeFilter, sanitizeSearchTerm } from '@/lib/search-query'

export type SearchType = 'all' | 'developers' | 'articles' | 'discussions' | 'topics'

export type SearchInput = {
  q: string
  type: SearchType
  page: number
  limit: number
}

const pageMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  hasNextPage: page * limit < total,
})

/**
 * Read model for global search.
 *
 * Every user-supplied term is sanitised before it reaches PostgREST. The
 * grammar characters `,`, `(`, `)`, and `*` are removed entirely, so a term can
 * never add a clause, reference an unexpected column, or neutralise a filter
 * such as `status = 'ACTIVE'`.
 */
export async function searchCommun(supabase: SupabaseClient, input: SearchInput) {
  const { q, type, page, limit } = input
  const term = sanitizeSearchTerm(q)
  const searching = isSearchableTerm(term)
  const developerFilter = orIlikeFilter(['display_name', 'username', 'bio'], term)
  const articleFilter = orIlikeFilter(['title', 'excerpt', 'body'], term)
  const discussionFilter = orIlikeFilter(['title', 'content'], term)
  const topicFilter = ilikeFilter(term)

  const from = (page - 1) * limit
  const searchDevelopers = type === 'all' || type === 'developers'
  const searchArticles = type === 'all' || type === 'articles'
  const searchDiscussions = type === 'all' || type === 'discussions'
  const searchTopics = type === 'all' || type === 'topics'

  const [developersResult, articlesResult, discussionsResult, topicsResult] = await Promise.all([
    searchDevelopers
      ? (() => {
          let query = supabase
            .from('profiles')
            .select('id,display_name,username,bio,avatar_url,interests', { count: 'exact' })
            .eq('status', 'ACTIVE')
            .not('username', 'is', null)
          if (searching && developerFilter) query = query.or(developerFilter)
          return query.order('display_name').range(from, from + limit - 1)
        })()
      : Promise.resolve({ data: [], count: 0, error: null }),
    searchArticles
      ? (() => {
          let query = supabase
            .from('posts')
            .select('id,author_id,title,slug,excerpt,reading_time_minutes,published_at', { count: 'exact' })
            .eq('status', 'PUBLISHED')
          if (searching && articleFilter) query = query.or(articleFilter)
          return query.order('published_at', { ascending: false }).range(from, from + limit - 1)
        })()
      : Promise.resolve({ data: [], count: 0, error: null }),
    searchDiscussions
      ? (() => {
          let query = supabase
            .from('discussions')
            .select('id,author_id,topic_id,title,content,is_closed,is_pinned,created_at', { count: 'exact' })
            .eq('is_removed', false)
          if (searching && discussionFilter) query = query.or(discussionFilter)
          return query
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1)
        })()
      : Promise.resolve({ data: [], count: 0, error: null }),
    searchTopics
      ? (() => {
          let query = supabase.from('topics').select('id,name', { count: 'exact' })
          if (searching && topicFilter) query = query.ilike('name', topicFilter)
          return query.order('name').range(from, from + limit - 1)
        })()
      : Promise.resolve({ data: [], count: 0, error: null }),
  ])

  const errors = [
    developersResult.error,
    articlesResult.error,
    discussionsResult.error,
    topicsResult.error,
  ].filter(Boolean)
  if (errors.length) return { error: 'Unable to search right now.' as const }

  const authorIds = [
    ...new Set([
      ...(articlesResult.data ?? []).map((row) => row.author_id),
      ...(discussionsResult.data ?? []).map((row) => row.author_id),
    ]),
  ]
  const topicIds = [
    ...new Set([...(discussionsResult.data ?? []).map((row) => row.topic_id)].filter(Boolean)),
  ] as string[]

  const [{ data: authors }, { data: topics }] = await Promise.all([
    authorIds.length
      ? supabase.from('profiles').select('id,display_name,username,avatar_url').in('id', authorIds)
      : Promise.resolve({ data: [] as { id: string }[] }),
    topicIds.length
      ? supabase.from('topics').select('id,name').in('id', topicIds)
      : Promise.resolve({ data: [] as { id: string }[] }),
  ])

  const authorMap = new Map((authors ?? []).map((row) => [row.id, row]))
  const topicMap = new Map((topics ?? []).map((row) => [row.id, row]))

  return {
    error: null,
    data: {
      query: term,
      type,
      developers: {
        items: developersResult.data ?? [],
        ...pageMeta(page, limit, developersResult.count ?? 0),
      },
      articles: {
        items: (articlesResult.data ?? []).map((row) => ({
          ...row,
          author: authorMap.get(row.author_id) ?? null,
        })),
        ...pageMeta(page, limit, articlesResult.count ?? 0),
      },
      discussions: {
        items: (discussionsResult.data ?? []).map((row) => ({
          ...row,
          author: authorMap.get(row.author_id) ?? null,
          topic: row.topic_id ? topicMap.get(row.topic_id) ?? null : null,
        })),
        ...pageMeta(page, limit, discussionsResult.count ?? 0),
      },
      topics: {
        items: topicsResult.data ?? [],
        ...pageMeta(page, limit, topicsResult.count ?? 0),
      },
    },
  }
}
