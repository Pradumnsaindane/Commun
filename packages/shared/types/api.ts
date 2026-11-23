/**
 * Public contracts for the Commun.dev API.
 *
 * These types describe the JSON boundary between the frontend and the
 * versioned API. They deliberately avoid Supabase/PostgREST implementation
 * types so neither side depends on the other's database details.
 */

export type ApiIssue = { path: string; message: string }

export type ApiErrorPayload = {
  error: string
  issues?: ApiIssue[]
  code?: string
  skipped?: string[]
  elevated?: boolean
}

export type Paginated<T> = {
  items: T[]
  page: number
  limit: number
  total: number
  hasNextPage: boolean
}

export type FeedPageResponse = {
  items: FeedItemView[]
  nextCursor: string | null
  tab: 'following' | 'latest'
}

export type FeedItemView = {
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
  author: {
    id: string
    username: string | null
    displayName: string
    avatarUrl: string | null
  } | null
  topics: { id: string; name: string }[]
  likeCount: number
  commentCount: number
  liked: boolean
  saved: boolean
  isOwn: boolean
}

export type ProfileSummaryView = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  headline?: string | null
}

export type CommentView = {
  id: string
  post_id?: string | null
  author_id: string
  parent_id: string | null
  content: string
  pinned: boolean
  created_at: string
  author?: {
    display_name: string | null
    username: string | null
    avatar_url: string | null
  } | null
}

export type InteractionState = {
  likes: number
  saves: number
  liked: boolean
  saved: boolean
}

export type NotificationView = {
  id: string
  actor_id: string | null
  type: string
  entity_id?: string | null
  target_slug: string | null
  target_title: string | null
  read: boolean
  created_at: string
  actor: { username: string | null; name: string | null } | null
}

export type SearchResponse = {
  query: string
  type: 'all' | 'developers' | 'articles' | 'discussions' | 'topics'
  developers: Paginated<Record<string, unknown>>
  articles: Paginated<Record<string, unknown>>
  discussions: Paginated<Record<string, unknown>>
  topics: Paginated<Record<string, unknown>>
}

export type DiscussionView = {
  id: string
  title: string
  content: string
  is_pinned: boolean
  is_closed: boolean
  created_at: string
  updated_at: string
  author_id: string
  topic_id: string | null
}

export type ReplyView = {
  id: string
  discussion_id: string
  author_id: string
  parent_id: string | null
  depth: number
  content: string
  is_solution: boolean
  created_at: string
  updated_at?: string
}
