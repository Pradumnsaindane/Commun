import { apiRequest } from '@/features/api-client'
import type { SearchResponse } from '@shared/index'
import { SEARCH_TYPES } from '@shared/index'

export type SearchType = (typeof SEARCH_TYPES)[number]

export function searchCommun<T = SearchResponse>(input: {
  q: string
  type?: SearchType
  page?: number
  limit?: number
}) {
  const query = new URLSearchParams({ q: input.q })
  if (input.type) query.set('type', input.type)
  if (input.page) query.set('page', String(input.page))
  if (input.limit) query.set('limit', String(input.limit))
  return apiRequest<T>(`/search?${query}`)
}
