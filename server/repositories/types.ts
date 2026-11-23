import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Narrow repository result types.
 *
 * Supabase's untyped client widens `select('a,b,c')` to `string`, which turns
 * `.single()` data into a `GenericStringError` union. Repositories declare the
 * row shape they actually read so services get a precise contract instead of
 * leaking the PostgREST builder types across layers.
 */
export type RepositoryResult<T> = {
  data: T | null
  error: PostgrestError | null
}

export type RepositoryListResult<T> = {
  data: T[] | null
  error: PostgrestError | null
  count?: number | null
}

export function repositoryResult<T>(result: {
  data: unknown
  error: PostgrestError | null
}): RepositoryResult<T> {
  return result as RepositoryResult<T>
}

export function repositoryListResult<T>(result: {
  data: unknown
  error: PostgrestError | null
  count?: number | null
}): RepositoryListResult<T> {
  return result as RepositoryListResult<T>
}
