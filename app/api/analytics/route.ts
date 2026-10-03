import { z } from 'zod'
import { getAuthContext } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { logServer } from '@/lib/logger'

const eventSchema = z.object({ event: z.enum(['signup_completed','onboarding_completed','article_viewed','article_created','article_published','article_liked','article_saved','comment_created','discussion_created','reply_created','follow_created','notification_opened','report_created']), path: z.string().max(200).optional(), metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional() })

export async function POST(request: Request) {
  const context = await getAuthContext()
  if (!context) return Response.json({ error: 'Authentication required.' }, { status: 401 })
  const parsed = eventSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid event.' }, { status: 422 })
  const supabase = await createClient()
  const { error } = await supabase.from('product_events').insert({ user_id: context.user.id, event_name: parsed.data.event, path: parsed.data.path, metadata: parsed.data.metadata ?? {} })
  if (error) { logServer('error', 'analytics_event_failed', { event: parsed.data.event, code: error.code ?? null }); return Response.json({ error: 'Unable to record event.' }, { status: 500 }) }
  return new Response(null, { status: 204 })
}
