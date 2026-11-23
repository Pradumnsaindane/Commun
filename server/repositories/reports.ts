import type { SupabaseClient } from '@supabase/supabase-js'
import { repositoryListResult, type RepositoryListResult } from './types'

export type OwnReportRow = {
  id: string
  target_type: string
  target_id: string
  reason: string
  status: string
  created_at: string
}

export async function findReportTarget(supabase: SupabaseClient, table: string, id: string) {
  return supabase.from(table).select('id').eq('id', id).maybeSingle()
}

export async function insertReport(
  supabase: SupabaseClient,
  payload: {
    reporter_id: string
    target_type: string
    target_id: string
    reason: string
    description: string | null
  }
) {
  return supabase.from('reports').insert(payload)
}

export async function listReportsByReporter(
  supabase: SupabaseClient,
  userId: string
): Promise<RepositoryListResult<OwnReportRow>> {
  return repositoryListResult(
    await supabase
      .from('reports')
      .select('id,target_type,target_id,reason,status,created_at')
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
  )
}
