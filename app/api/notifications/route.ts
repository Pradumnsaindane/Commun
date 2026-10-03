import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const readSchema = z.object({ id: z.string().uuid().optional() })

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const { data, error } = await supabase.from('notifications').select('id,actor_id,type,entity_id,target_slug,target_title,read,created_at').eq('recipient_id', user.id).order('created_at', { ascending: false }).limit(40)
  if (error) return NextResponse.json({ error: 'Unable to load notifications' }, { status: 500 })
  const actorIds = [...new Set((data ?? []).map((item) => item.actor_id).filter(Boolean))]
  const { data: actors } = actorIds.length ? await supabase.from('profiles').select('id,username,name').in('id', actorIds) : { data: [] }
  const actorMap = new Map((actors ?? []).map((actor) => [actor.id, actor]))
  return NextResponse.json({ notifications: (data ?? []).map((item) => ({ ...item, actor: item.actor_id ? actorMap.get(item.actor_id) ?? null : null })) })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const parsed = readSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid notification' }, { status: 422 })
  const query = supabase.from('notifications').update({ read: true }).eq('recipient_id', user.id)
  const { error } = await (parsed.data.id ? query.eq('id', parsed.data.id) : query)
  if (error) return NextResponse.json({ error: 'Unable to update notifications' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const body = z.object({ recipientId: z.string().uuid(), type: z.enum(['LIKE', 'COMMENT', 'REPLY', 'FOLLOW', 'MENTION', 'NEW_POST', 'NEW_DISCUSSION', 'MODERATION', 'SYSTEM']), entityId: z.string().uuid().nullable().optional(), targetSlug: z.string().max(180).nullable().optional(), targetTitle: z.string().max(240).nullable().optional() }).safeParse(await request.json().catch(() => null))
  if (!body.success || body.data.recipientId === user.id) return NextResponse.json({ error: 'Invalid notification' }, { status: 422 })
  const { error } = await supabase.from('notifications').upsert({ recipient_id: body.data.recipientId, actor_id: user.id, type: body.data.type, entity_id: body.data.entityId ?? null, target_slug: body.data.targetSlug ?? null, target_title: body.data.targetTitle ?? null }, { onConflict: 'recipient_id,actor_id,type,entity_id', ignoreDuplicates: true })
  if (error) return NextResponse.json({ error: 'Unable to create notification' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const { error } = await supabase.from('notifications').delete().eq('recipient_id', user.id)
  if (error) return NextResponse.json({ error: 'Unable to clear notifications' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

void NextResponse
 
