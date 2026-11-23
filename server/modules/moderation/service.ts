import { z } from 'zod'
import { createAdminClient, notifyUser, writeAudit } from '@/lib/admin'
import { requireRole } from '@/server/http/auth'
import { failure, success } from '@/server/http/result'
import {
  findContentAuthor,
  findReport,
  listReports,
  updateContent,
  updateReport,
} from '@/server/repositories/moderation'

const querySchema = z.object({
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED']).optional(),
  reason: z.string().optional(),
  targetType: z.string().optional(),
  page: z.coerce.number().int().min(1).catch(1),
})
const actionSchema = z.object({
  action: z.enum(['RESOLVE', 'DISMISS', 'REMOVE', 'RESTORE']),
  note: z.string().trim().max(1000).optional(),
})
const reportTables: Record<string, string> = {
  POST: 'posts',
  COMMENT: 'comments',
  DISCUSSION: 'discussions',
  REPLY: 'replies',
}

export async function listModerationReports(request: Request) {
  const { error } = await requireRole('moderator')
  if (error) return error

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsed.success) return failure('Invalid report query.', 422)

  const pageSize = 20
  const { data, count, error: listError } = await listReports(
    createAdminClient(),
    parsed.data,
    parsed.data.page,
    pageSize
  )
  if (listError) return failure('Unable to load reports.', 500)

  return success({ reports: data ?? [], total: count ?? 0, page: parsed.data.page, pageSize })
}

export async function getModerationReport(params: { id: string }) {
  const { error } = await requireRole('moderator')
  if (error) return error

  const { id } = params
  const { data, error: findError } = await findReport(createAdminClient(), id)
  if (findError || !data) return failure('Report not found.', 404)

  return success({ report: data })
}

export async function actOnModerationReport(request: Request, params: { id: string }) {
  const { context, error } = await requireRole('moderator')
  if (error) return error

  const parsed = actionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return failure('Invalid action.', 422)

  const { id } = params
  const db = createAdminClient()
  const { data: report } = await findReport(db, id)
  if (!report) return failure('Report not found.', 404)

  if (['RESOLVE', 'DISMISS'].includes(parsed.data.action) && !['OPEN', 'IN_REVIEW'].includes(report.status)) {
    return failure('Report is already closed.', 409)
  }

  if (parsed.data.action === 'RESOLVE' || parsed.data.action === 'DISMISS') {
    const status = parsed.data.action === 'RESOLVE' ? 'RESOLVED' : 'DISMISSED'
    const { error: updateError } = await updateReport(db, id, {
      status,
      resolution_note: parsed.data.note ?? null,
      assigned_to: context.user.id,
      updated_at: new Date().toISOString(),
    })
    if (updateError) return failure('Unable to update the report.', 400)

    await writeAudit(context, `REPORT_${status}`, 'REPORT', id, {
      note: parsed.data.note ?? null,
      targetType: report.target_type,
      targetId: report.target_id,
    })
    await notifyUser(
      report.reporter_id,
      context.user.id,
      'MODERATION',
      id,
      `Your ${report.target_type.toLowerCase()} report was ${status.toLowerCase()}.`
    )
    return success({ ok: true, status })
  }

  const table = reportTables[report.target_type]
  if (!table) return failure('This target cannot be moderated here.', 422)

  const removed = parsed.data.action === 'REMOVE'
  const { data: target } = await findContentAuthor(db, table, report.target_id)
  if (!target) return failure('Target content not found.', 404)

  const update = table === 'posts'
    ? { status: removed ? 'REMOVED' : 'PUBLISHED', updated_at: new Date().toISOString() }
    : { is_removed: removed, updated_at: new Date().toISOString() }
  const { error: contentError } = await updateContent(db, table, report.target_id, update)
  if (contentError) return failure('Unable to update content.', 400)

  if (removed) {
    const { error: reportError } = await updateReport(db, id, {
      status: 'RESOLVED',
      assigned_to: context.user.id,
      updated_at: new Date().toISOString(),
    })
    if (reportError) return failure('Content was updated, but the report could not be closed.', 409)
  }

  await writeAudit(context, removed ? 'CONTENT_REMOVED' : 'CONTENT_RESTORED', report.target_type, report.target_id, { reportId: id })
  await notifyUser(
    target.author_id,
    context.user.id,
    'MODERATION',
    report.target_id,
    removed ? 'Your content was removed by moderation.' : 'Your content was restored by moderation.'
  )
  return success({ ok: true, removed })
}
