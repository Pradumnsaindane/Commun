import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDeveloperNews } from '@/lib/news'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || undefined
  const search = searchParams.get('q') || undefined
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20))

  const supabase = await createClient()
  const result = await getDeveloperNews({
    supabase,
    category,
    search,
    page,
    limit,
  })

  return NextResponse.json(result)
}