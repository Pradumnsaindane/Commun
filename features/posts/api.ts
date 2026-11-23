import { apiRequest } from '@/features/api-client'
import type { FeedPageResponse } from '@shared/index'
import type { SocialPostInput } from '../../lib/social-posts'
import type { postInputSchema } from '../../lib/posts'
import type { z } from 'zod'

type ArticleInput = z.infer<typeof postInputSchema>

export function getFeed(options: { tab: 'following' | 'latest'; cursor?: string | null; limit?: number } = { tab: 'following' }) {
  const query = new URLSearchParams({ tab: options.tab })
  if (options.cursor) query.set('cursor', options.cursor)
  if (options.limit) query.set('limit', String(options.limit))
  return apiRequest<FeedPageResponse>(`/feed?${query}`)
}

export function createSocialPost(input: SocialPostInput) {
  return apiRequest<{ post: { id: string; slug: string }; degraded: boolean }>('/social-posts', {
    method: 'POST',
    body: input,
  })
}

export function updateSocialPost(id: string, input: SocialPostInput) {
  return apiRequest<{ post: { id: string; slug: string } }>(`/social-posts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  })
}

export function deleteSocialPost(id: string) {
  return apiRequest<void>(`/social-posts/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function listArticles(params: { page?: number; limit?: number; author?: string } = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.author) query.set('author', params.author)
  const suffix = query.size ? `?${query}` : ''
  return apiRequest<{ posts: unknown[]; page: number; limit: number; total: number }>(`/posts${suffix}`)
}

export function createArticle(input: ArticleInput) {
  return apiRequest<{ post: { id: string; slug: string } }>('/posts', { method: 'POST', body: input })
}
