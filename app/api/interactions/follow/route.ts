import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({ followingId: z.string().uuid() })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid target user' }, { status: 422 })
  if (parsed.data.followingId === user.id) return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 409 })
  const { data: target } = await supabase.from('profiles').select('id').eq('id', parsed.data.followingId).maybeSingle()
  if (!target) return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
  const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: parsed.data.followingId })
  if (error?.code === '23505') return NextResponse.json({ error: 'Already following' }, { status: 409 })
  if (error) return NextResponse.json({ error: 'Could not follow developer' }, { status: 500 })
  return NextResponse.json({ following: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid target user' }, { status: 422 })
  const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', parsed.data.followingId)
  if (error) return NextResponse.json({ error: 'Could not unfollow developer' }, { status: 500 })
  return NextResponse.json({ following: false })
}
