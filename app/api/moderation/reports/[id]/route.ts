import { z } from 'zod'
import { requireModerator, createAdminClient, writeAudit, notifyUser } from '@/lib/admin'

const schema = z.object({ action: z.enum(['RESOLVE', 'DISMISS', 'REMOVE', 'RESTORE', 'SUSPEND', 'RESTORE_USER']), note: z.string().trim().max(1000).optional() })

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireModerator(); if (auth.response) return auth.response
  const { id } = await params; const db = createAdminClient(); const { data, error } = await db.from('reports').select('*').eq('id', id).maybeSingle()
  if (error || !data) return Response.json({ error: 'Report not found.' }, { status: 404 })
  return Response.json({ report: data })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireModerator(); if (auth.response) return auth.response
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: 'Invalid action.' }, { status: 422 })
  const { id } = await params; const db = createAdminClient(); const { data: report } = await db.from('reports').select('*').eq('id', id).maybeSingle()
  if (!report) return Response.json({ error: 'Report not found.' }, { status: 404 })
  if (['RESOLVE', 'DISMISS'].includes(parsed.data.action) && !['OPEN', 'IN_REVIEW'].includes(report.status)) return Response.json({ error: 'Report is already closed.' }, { status: 409 })
  if (parsed.data.action === 'RESOLVE' || parsed.data.action === 'DISMISS') {
    const status = parsed.data.action === 'RESOLVE' ? 'RESOLVED' : 'DISMISSED'
    await db.from('reports').update({ status, resolution_note: parsed.data.note ?? null, assigned_to: auth.context!.user.id, updated_at: new Date().toISOString() }).eq('id', id)
    await writeAudit(auth.context!, `REPORT_${status}`, 'REPORT', id, { note: parsed.data.note ?? null, targetType: report.target_type, targetId: report.target_id })
    await notifyUser(report.reporter_id, auth.context!.user.id, 'MODERATION', id, `Your ${report.target_type.toLowerCase()} report was ${status.toLowerCase()}.`)
    return Response.json({ ok: true, status })
  }
  const table = ({ POST: 'posts', COMMENT: 'comments', DISCUSSION: 'discussions', REPLY: 'replies' } as Record<string, string>)[report.target_type]
  if (!table) return Response.json({ error: 'This target cannot be moderated here.' }, { status: 422 })
  const removed = parsed.data.action === 'REMOVE'; const { data: target } = await db.from(table).select('author_id').eq('id', report.target_id).maybeSingle()
  if (!target) return Response.json({ error: 'Target content not found.' }, { status: 404 })
  const update = table === 'posts' ? { status: removed ? 'REMOVED' : 'PUBLISHED', updated_at: new Date().toISOString() } : { is_removed: removed, updated_at: new Date().toISOString() }
  const result = await db.from(table).update(update).eq('id', report.target_id); if (result.error) return Response.json({ error: 'Unable to update content.' }, { status: 400 })
  await writeAudit(auth.context!, removed ? 'CONTENT_REMOVED' : 'CONTENT_RESTORED', report.target_type, report.target_id, { reportId: id })
  await notifyUser(target.author_id, auth.context!.user.id, removed ? 'MODERATION' : 'MODERATION', report.target_id, removed ? 'Your content was removed by moderation.' : 'Your content was restored by moderation.')
  return Response.json({ ok: true, removed })
}
