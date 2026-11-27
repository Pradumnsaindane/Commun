import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { getServiceRoleKey, getSupabaseUrl } from '@/lib/env'
import { canAdminister, canModerate, getAuthContext, type AuthContext } from '@/lib/auth'

let cached: SupabaseClient | null = null

export function hasServiceRoleKey(): boolean {
  return createAdminClient() !== null
}

/**
 * Service-role client for server-only operations that must not be available
 * to a browser session (account-state transitions, availability checks that
 * must not leak through RLS).
 *
 * Returns null when the URL or service-role key is missing/placeholder;
 * callers degrade explicitly instead of assuming elevated access.
 */
export function createAdminClient(): SupabaseClient | null {
  const key = getServiceRoleKey()
  if (!key) return null
  let url: string
  try {
    url = getSupabaseUrl()
  } catch {
    return null
  }
  if (!cached) {
    cached = createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  }
  return cached
}

export async function requireModerator() {
  const context = await getAuthContext()
  if (!context) return { context: null, response: Response.json({ error: 'Authentication required.' }, { status: 401 }) }
  if (!canModerate(context)) return { context: null, response: Response.json({ error: 'Active moderator access required.' }, { status: 403 }) }
  return { context, response: null }
}

export async function requireAdmin() {
  const context = await getAuthContext()
  if (!context) return { context: null, response: Response.json({ error: 'Authentication required.' }, { status: 401 }) }
  if (!canAdminister(context)) return { context: null, response: Response.json({ error: 'Active administrator access required.' }, { status: 403 }) }
  return { context, response: null }
}

/**
 * Audit writes are security-relevant. Callers must handle a failed write
 * instead of reporting a privileged action as fully successful.
 */
export async function writeAudit(actor: AuthContext, action: string, targetType: string, targetId: string | null, metadata: Record<string, unknown> = {}) {
  const admin = createAdminClient()
  if (!admin) {
    console.error('Audit log write skipped: no service-role key configured', { action })
    return false
  }
  const { error } = await admin.from('audit_logs').insert({
    actor_id: actor.user.id,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  })

  if (error) {
    console.error('Audit log write failed', {
      action,
      code: error.code ?? null,
    })
    return false
  }
  return true
}

export async function notifyUser(recipientId: string, actorId: string, type: 'MODERATION', entityId: string | null, targetTitle?: string | null) {
  if (recipientId === actorId) return
  const admin = createAdminClient()
  if (!admin) {
    console.error('Moderation notification write skipped: no service-role key configured', {
      recipientId,
      type,
    })
    return
  }
  // A content can be removed and restored more than once. Upsert with the
  // same conflict target as the notification service so repeat decisions
  // update the existing notice instead of failing with a 23505 duplicate.
  const { error } = await admin.from('notifications').upsert(
    { recipient_id: recipientId, actor_id: actorId, type, entity_id: entityId, target_title: targetTitle ?? null },
    { onConflict: 'recipient_id,actor_id,type,entity_id', ignoreDuplicates: true }
  )
  if (error) console.error('Moderation notification write failed', { code: error.code ?? null })
}
