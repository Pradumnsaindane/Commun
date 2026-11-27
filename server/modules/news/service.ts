import { createAdminClient, requireAdmin } from '@/lib/admin'
import { logServer } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { getDeveloperNews, ingestDeveloperNews, parseNewsQuery } from '@/lib/news'
import { failure, success } from '@/server/http/result'

export async function getNews(request: Request) {
  // One validated query shape is shared with the RSC page. Invalid values are
  // clamped to safe defaults and search terms are sanitised in getDeveloperNews
  // before they can reach a PostgREST filter.
  const parsed = parseNewsQuery(Object.fromEntries(new URL(request.url).searchParams))

  const result = await getDeveloperNews({
    supabase: await createClient(),
    category: parsed.category,
    search: parsed.q || undefined,
    page: parsed.page,
    limit: parsed.limit,
  })
  return success(result)
}

export async function ingestNews(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const isCronAuthorized =
    typeof cronSecret === 'string' &&
    cronSecret.length > 0 &&
    authHeader === `Bearer ${cronSecret}`

  if (!isCronAuthorized) {
    const { response } = await requireAdmin()
    if (response) {
      const body = await response.json().catch(() => null)
      return failure(
        typeof body?.error === 'string' ? body.error : 'Unauthorized or insufficient permissions.',
        response.status
      )
    }
  }

  try {
    const result = await ingestDeveloperNews(createAdminClient())
    return result.success ? success(result) : failure('Developer news ingestion failed.', 500)
  } catch (error) {
    logServer('error', 'news.ingest.failed', {
      message: error instanceof Error ? error.message.slice(0, 200) : 'unknown',
    })
    return failure('Developer news ingestion failed.', 500)
  }
}
