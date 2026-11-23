import { clampFeedLimit, decodeCursor, fetchFeedPage, parseFeedTab } from '@/lib/feed'
import { getRequestContext } from '@/server/http/auth'
import { failure, success } from '@/server/http/result'

/** Cursor-paginated social feed read model. */
export async function getFeed(request: Request) {
  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Authentication required.', 401)

  const url = new URL(request.url)
  const tab = parseFeedTab(url.searchParams.get('tab'))
  const cursor = decodeCursor(url.searchParams.get('cursor'))
  const limit = clampFeedLimit(Number(url.searchParams.get('limit')))

  const page = await fetchFeedPage(supabase, { tab, viewerId: user.id, cursor, limit })
  if (page.error) return failure(page.error, 500)

  return success(
    { items: page.items, nextCursor: page.nextCursor, tab },
    200,
    { 'cache-control': 'private, no-store' }
  )
}
