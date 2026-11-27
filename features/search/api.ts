import { apiRequest } from '@/features/api-client'
import type { SearchResponse } from '@shared/index'
import { SEARCH_TYPES } from '@shared/index'

export type SearchType = (typeof SEARCH_TYPES)[number]

export type SearchInput = {
  q: string
  type?: SearchType
  page?: number
  limit?: number
}

/** Typed browser client for the versioned global-search endpoint. */
export function searchCommun(input: SearchInput): Promise<SearchResponse> {
  const query = new URLSearchParams({ q: input.q })
  if (input.type) query.set('type', input.type)
  if (input.page) query.set('page', String(input.page))
  if (input.limit) query.set('limit', String(input.limit))
  return apiRequest<SearchResponse>(`/search?${query}`)
}
