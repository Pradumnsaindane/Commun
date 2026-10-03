import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { authError } from '@/lib/auth'
import { enforceRateLimit, requestKey } from '@/lib/rate-limit'

const schema = z.object({ targetType: z.enum(['POST','COMMENT','DISCUSSION','REPLY','PROFILE']), targetId: z.string().uuid(), reason: z.enum(['SPAM','HARASSMENT','ABUSE','MISINFORMATION','COPYRIGHT','MALICIOUS_CONTENT','OTHER']), description: z.string().trim().max(2000).optional() })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return authError(401, 'Authentication required.')
  const rate = await enforceRateLimit(requestKey(request, user.id), 'reports', 5, '10 m')
  if (!rate.success) return new Response(JSON.stringify({ error: 'Too many reports. Try again later.' }), { status: 429, headers: { 'content-type': 'application/json', 'retry-after': String(rate.retryAfter) } })
  let body: unknown
  try { body = await request.json() } catch { return authError(422, 'Invalid request.') }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return authError(422, 'Please provide a valid report.')
  const targetTables: Record<string, string> = { POST: 'posts', COMMENT: 'comments', DISCUSSION: 'discussions', REPLY: 'replies', PROFILE: 'profiles' }
  const table = targetTables[parsed.data.targetType]
  const { data: target } = await supabase.from(table).select('id').eq('id', parsed.data.targetId).maybeSingle()
  if (!target) return authError(404, 'Report target not found.')
  const { error } = await supabase.from('reports').insert({ reporter_id: user.id, target_type: parsed.data.targetType, target_id: parsed.data.targetId, reason: parsed.data.reason, description: parsed.data.description || null })
  if (error?.code === '23505') return Response.json({ ok: true, duplicate: true })
  if (error) return Response.json({ error: 'Unable to submit report.' }, { status: 400 })
  return Response.json({ ok: true }, { status: 201 })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return authError(401, 'Authentication required.')
  const { data, error } = await supabase.from('reports').select('id,target_type,target_id,reason,status,created_at').eq('reporter_id', user.id).order('created_at', { ascending: false }).limit(50)
  if (error) return authError(500, 'Unable to load reports.')
  return Response.json({ reports: data ?? [] })
}
