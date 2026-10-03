import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({ title: z.string().trim().min(3).max(180), content: z.string().trim().min(1).max(10000), topicId: z.string().uuid().optional().nullable() })

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('discussions').select('id,title,content,is_pinned,is_closed,created_at,updated_at,author_id,topic_id').eq('is_removed', false).order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Unable to load discussions.' }, { status: 500 })
  return NextResponse.json({ discussions: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid title and discussion.' }, { status: 400 })
  const { data, error } = await supabase.from('discussions').insert({ author_id: user.id, title: parsed.data.title, content: parsed.data.content, topic_id: parsed.data.topicId ?? null }).select('id,title,content,created_at').single()
  if (error) return NextResponse.json({ error: 'Unable to create discussion.' }, { status: 400 })
  return NextResponse.json({ discussion: data }, { status: 201 })
}
