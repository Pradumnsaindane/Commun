import type { SupabaseClient } from '@supabase/supabase-js'
import { repositoryListResult, repositoryResult, type RepositoryListResult, type RepositoryResult } from './types'

export type ReportRow = {
  id: string
  reporter_id: string
  target_type: string
  target_id: string
  reason: string
  description: string | null
  status: string
  assigned_to: string | null
  resolution_note: string | null
  created_at: string
  updated_at: string
}

export type ReportQuery = {
  status?: string
  reason?: string
  targetType?: string
}

export async function listReports(
  db: SupabaseClient,
  query: ReportQuery,
  page: number,
  pageSize: number
): Promise<RepositoryListResult<ReportRow>> {
  const from = (page - 1) * pageSize
  let request = db
    .from('reports')
    .select('id,reporter_id,target_type,target_id,reason,description,status,assigned_to,resolution_note,created_at,updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (query.status) request = request.eq('status', query.status)
  if (query.reason) request = request.eq('reason', query.reason)
  if (query.targetType) request = request.eq('target_type', query.targetType)

  return repositoryListResult(await request)
}

export async function findReport(
  db: SupabaseClient,
  id: string
): Promise<RepositoryResult<ReportRow>> {
  return repositoryResult(await db.from('reports').select('*').eq('id', id).maybeSingle())
}

export async function updateReport(
  db: SupabaseClient,
  id: string,
  payload: Record<string, unknown>
) {
  return db.from('reports').update(payload).eq('id', id)
}

export async function findContentAuthor(
  db: SupabaseClient,
  table: string,
  id: string
): Promise<RepositoryResult<{ author_id: string }>> {
  return repositoryResult(await db.from(table).select('author_id').eq('id', id).maybeSingle())
}

export async function updateContent(
  db: SupabaseClient,
  table: string,
  id: string,
  payload: Record<string, unknown>
) {
  return db.from(table).update(payload).eq('id', id)
}
