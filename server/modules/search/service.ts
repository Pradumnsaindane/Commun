import { z } from 'zod'
import { getRequestContext } from '@/server/http/auth'
import { failure, success } from '@/server/http/result'
import { searchCommun } from '@/server/repositories/search'

const querySchema = z.object({
  q: z.string().trim().max(120).default(''),
  type: z.enum(['all', 'developers', 'articles', 'discussions', 'topics']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(12),
})

export async function search(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsed.success) return failure('Invalid search parameters.', 400)

  const { supabase } = await getRequestContext()
  const result = await searchCommun(supabase, parsed.data)
  if (result.error) return failure(result.error, 500)

  return success(result.data)
}
