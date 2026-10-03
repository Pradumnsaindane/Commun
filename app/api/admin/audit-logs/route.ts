import { requireAdmin, createAdminClient } from '@/lib/admin'

export async function GET(request: Request) {
  const auth = await requireAdmin(); if (auth.response) return auth.response
  const url = new URL(request.url); const page = Math.max(1, Number(url.searchParams.get('page') ?? 1)); const size = 30; const db = createAdminClient()
  const { data, count, error } = await db.from('audit_logs').select('id,actor_id,action,target_type,target_id,metadata,created_at', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * size, page * size - 1)
  if (error) return Response.json({ error: 'Unable to load audit logs.' }, { status: 500 }); return Response.json({ logs: data ?? [], total: count ?? 0, page, pageSize: size })
}
