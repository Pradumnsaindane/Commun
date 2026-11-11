import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clampFeedLimit, decodeCursor, fetchFeedPage, parseFeedTab } from '@/lib/feed'

/**
 * Cursor-paginated social feed.
 *
 * Keyset pagination (published_at, id) instead of offset ranges, so new posts
 * cannot cause duplicates or skipped rows while a reader scrolls.
 */

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const url = new URL(request.url)
  const tab = parseFeedTab(url.searchParams.get('tab'))
  const cursor = decodeCursor(url.searchParams.get('cursor'))
  const limit = clampFeedLimit(Number(url.searchParams.get('limit')))

  const page = await fetchFeedPage(supabase, { tab, viewerId: user.id, cursor, limit })
  if (page.error) return NextResponse.json({ error: page.error }, { status: 500 })

  return NextResponse.json(
    { items: page.items, nextCursor: page.nextCursor, tab },
    { headers: { 'cache-control': 'private, no-store' } }
  )
}
