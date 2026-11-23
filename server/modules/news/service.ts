import { createAdminClient, requireAdmin } from '@/lib/admin'
import { logServer } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { getDeveloperNews, ingestDeveloperNews } from '@/lib/news'
import { failure, success } from '@/server/http/result'

export async function getNews(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')?.slice(0, 60) || undefined
  const search = searchParams.get('q')?.slice(0, 120) || undefined
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20))

  const result = await getDeveloperNews({
    supabase: await createClient(),
    category,
    search,
    page,
    limit,
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
