import { z } from 'zod'
import { canPublish, getAuthContext } from '@/lib/auth'
import { enforceRateLimit, requestKey } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { failure, success } from '@/server/http/result'
import { findReportTarget, insertReport, listReportsByReporter } from '@/server/repositories/reports'

const reportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT', 'DISCUSSION', 'REPLY', 'PROFILE']),
  targetId: z.string().uuid(),
  reason: z.enum(['SPAM', 'HARASSMENT', 'ABUSE', 'MISINFORMATION', 'COPYRIGHT', 'MALICIOUS_CONTENT', 'OTHER']),
  description: z.string().trim().max(2000).optional(),
})
const targetTables: Record<string, string> = {
  POST: 'posts',
  COMMENT: 'comments',
  DISCUSSION: 'discussions',
  REPLY: 'replies',
  PROFILE: 'profiles',
}

export async function submitReport(request: Request) {
  const context = await getAuthContext()
  if (!context) return failure('Authentication required.', 401)
  if (!canPublish(context)) return failure('Your account must be active to submit a report.', 403)

  const rate = await enforceRateLimit(requestKey(request, context.user.id), 'reports', 5, '10 m')
  if (!rate.success) {
    return failure('Too many reports. Try again later.', 429, {
      headers: { 'content-type': 'application/json', 'retry-after': String(rate.retryAfter) },
    })
  }

  const parsed = reportSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return failure('Please provide a valid report.', 422)

  const supabase = await createClient()
  const { data: target } = await findReportTarget(supabase, targetTables[parsed.data.targetType], parsed.data.targetId)
  if (!target) return failure('Report target not found.', 404)

  const { error } = await insertReport(supabase, {
    reporter_id: context.user.id,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reason: parsed.data.reason,
    description: parsed.data.description || null,
  })
  if (error?.code === '23505') return success({ ok: true, duplicate: true })
  if (error) return failure('Unable to submit report.', 400)

  return success({ ok: true }, 201)
}

export async function listOwnReports() {
  const context = await getAuthContext()
  if (!context) return failure('Authentication required.', 401)

  const { data, error } = await listReportsByReporter(await createClient(), context.user.id)
  if (error) return failure('Unable to load reports.', 500)

  return success({ reports: data ?? [] })
}
