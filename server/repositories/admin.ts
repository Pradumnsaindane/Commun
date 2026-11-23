import type { SupabaseClient } from '@supabase/supabase-js'
import { repositoryListResult, type RepositoryListResult } from './types'

export type AdminUserRow = {
  id: string
  email?: string
  created_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
  app_metadata: Record<string, unknown>
}

export type AuditLogRow = {
  id: string
  actor_id: string
  action: string
  target_type: string
  target_id: string | null
  metadata: unknown
  created_at: string
}

/** Auth-admin calls stay in the repository so services never hold an admin client. */
export async function listAuthUsers(db: SupabaseClient, page: number, perPage: number) {
  return db.auth.admin.listUsers({ page, perPage })
}

export async function getAuthUser(db: SupabaseClient, userId: string) {
  return db.auth.admin.getUserById(userId)
}

export async function updateAuthUserMetadata(
  db: SupabaseClient,
  userId: string,
  metadata: Record<string, unknown>
) {
  return db.auth.admin.updateUserById(userId, { app_metadata: metadata })
}

export async function listAuditLogs(
  db: SupabaseClient,
  page: number,
  pageSize: number
): Promise<RepositoryListResult<AuditLogRow>> {
  return repositoryListResult(
    await db
      .from('audit_logs')
      .select('id,actor_id,action,target_type,target_id,metadata,created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)
  )
}
