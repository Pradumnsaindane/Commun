import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({ discussionId: z.string().uuid(), content: z.string().trim().min(1).max(5000), parentId: z.string().uuid().optional().nullable() })

export async function GET(request: Request) {
  const discussionId = new URL(request.url).searchParams.get('discussionId')
  if (!discussionId) return NextResponse.json({ error: 'Discussion is required.' }, { status: 400 })
  const supabase = await createClient()
  const { data, error } = await supabase.from('replies').select('id,discussion_id,author_id,parent_id,depth,content,is_solution,created_at,updated_at').eq('discussion_id', discussionId).eq('is_removed', false).order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: 'Unable to load replies.' }, { status: 500 })
  return NextResponse.json({ replies: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid reply.' }, { status: 400 })
  const depth = parsed.data.parentId ? 1 : 0
  const { data, error } = await supabase.from('replies').insert({ discussion_id: parsed.data.discussionId, author_id: user.id, parent_id: parsed.data.parentId ?? null, depth, content: parsed.data.content }).select('id,discussion_id,author_id,parent_id,depth,content,is_solution,created_at').single()
  if (error) return NextResponse.json({ error: 'Unable to add reply.' }, { status: 400 })
  return NextResponse.json({ reply: data }, { status: 201 })
}
