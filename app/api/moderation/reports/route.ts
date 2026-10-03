import { z } from 'zod'
import { requireModerator, createAdminClient } from '@/lib/admin'

const querySchema = z.object({ status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED']).optional(), reason: z.string().optional(), targetType: z.string().optional(), page: z.coerce.number().int().min(1).default(1) })

export async function GET(request: Request) {
  const auth = await requireModerator(); if (auth.response) return auth.response
  const url = new URL(request.url); const q = querySchema.parse(Object.fromEntries(url.searchParams)); const size = 20; const from = (q.page - 1) * size
  let query = createAdminClient().from('reports').select('id,reporter_id,target_type,target_id,reason,description,status,assigned_to,resolution_note,created_at,updated_at', { count: 'exact' }).order('created_at', { ascending: false }).range(from, from + size - 1)
  if (q.status) query = query.eq('status', q.status); if (q.reason) query = query.eq('reason', q.reason); if (q.targetType) query = query.eq('target_type', q.targetType)
  const { data, count, error } = await query; if (error) return Response.json({ error: 'Unable to load reports.' }, { status: 500 })
  return Response.json({ reports: data ?? [], total: count ?? 0, page: q.page, pageSize: size })
}
