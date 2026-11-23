import { z } from 'zod'
import { getAuthContext } from '@/lib/auth'
import { logServer } from '@/lib/logger'
import { enforceRateLimit, requestKey } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { failure, success } from '@/server/http/result'
import { insertFeedback, insertProductEvent } from '@/server/repositories/product-telemetry'

const eventSchema = z.object({
  event: z.enum([
    'signup_completed', 'onboarding_completed', 'article_viewed', 'article_created',
    'article_published', 'article_liked', 'article_saved', 'comment_created',
    'discussion_created', 'reply_created', 'follow_created', 'notification_opened',
    'report_created',
  ]),
  path: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
})
const feedbackSchema = z.object({
  category: z.enum(['BUG', 'FEATURE', 'CONFUSION', 'GENERAL']),
  message: z.string().trim().min(10).max(2000),
  path: z.string().max(200).optional(),
})

export async function recordProductEvent(request: Request) {
  const context = await getAuthContext()
  if (!context) return failure('Authentication required.', 401)

  const parsed = eventSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return failure('Invalid event.', 422)

  const { error } = await insertProductEvent(await createClient(), {
    user_id: context.user.id,
    event_name: parsed.data.event,
    path: parsed.data.path,
    metadata: parsed.data.metadata ?? {},
  })
  if (error) {
    logServer('error', 'analytics_event_failed', { event: parsed.data.event, code: error.code ?? null })
    return failure('Unable to record event.', 500)
  }

  return success(undefined, 204)
}

export async function submitFeedback(request: Request) {
  const context = await getAuthContext()
  if (!context) return failure('Authentication required.', 401)
  if (context.status !== 'ACTIVE') return failure('Your account must be active to send feedback.', 403)

  const limit = await enforceRateLimit(requestKey(request, context.user.id), 'beta-feedback', 5, '1 m')
  if (!limit.success) {
    return failure('Too many feedback submissions. Try again shortly.', 429, {
      headers: { 'Retry-After': String(limit.retryAfter) },
    })
  }

  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return failure('Add at least 10 characters of feedback.', 422)

  const { error } = await insertFeedback(await createClient(), {
    user_id: context.user.id,
    ...parsed.data,
  })
  if (error) {
    logServer('error', 'beta_feedback_failed', { code: error.code ?? null })
    return failure('Unable to send feedback.', 500)
  }

  return success({ ok: true }, 201)
}
