import { z } from 'zod'
import { getAuthContext } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { logServer } from '@/lib/logger'
import { enforceRateLimit, requestKey } from '@/lib/rate-limit'

const feedbackSchema = z.object({ category: z.enum(['BUG','FEATURE','CONFUSION','GENERAL']), message: z.string().trim().min(10).max(2000), path: z.string().max(200).optional() })

export async function POST(request: Request) {
  const context = await getAuthContext()
  if (!context) return Response.json({ error: 'Authentication required.' }, { status: 401 })
  const limit = await enforceRateLimit(requestKey(request, context.user.id), 'beta-feedback', 5, '1 m')
  if (!limit.success) return Response.json({ error: 'Too many feedback submissions. Try again shortly.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } })
  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Add at least 10 characters of feedback.' }, { status: 422 })
  const supabase = await createClient()
  const { error } = await supabase.from('beta_feedback').insert({ user_id: context.user.id, ...parsed.data })
  if (error) { logServer('error', 'beta_feedback_failed', { code: error.code ?? null }); return Response.json({ error: 'Unable to send feedback.' }, { status: 500 }) }
  return Response.json({ ok: true }, { status: 201 })
}
