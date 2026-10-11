import { NextResponse } from 'next/server'
import { createAdminClient, requireAdmin } from '@/lib/admin'
import { ingestDeveloperNews } from '@/lib/news'

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  // Allow scheduled ingestion only with a configured, matching secret.
  const isCronAuthorized =
    typeof cronSecret === 'string' &&
    cronSecret.length > 0 &&
    authHeader === `Bearer ${cronSecret}`

  // Otherwise, require a verified administrator.
  if (!isCronAuthorized) {
    const { response } = await requireAdmin()

    if (response) {
      return NextResponse.json(
        { error: 'Unauthorized or insufficient permissions.' },
        { status: response.status }
      )
    }
  }

  try {
    const dbClient = createAdminClient()
    const result = await ingestDeveloperNews(dbClient)

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })
  } catch (error) {
    console.error('Developer news ingestion failed:', error)

    return NextResponse.json(
      { error: 'Developer news ingestion failed.' },
      { status: 500 }
    )
  }
}