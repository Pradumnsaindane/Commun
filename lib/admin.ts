import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAuthContext, type AuthContext } from '@/lib/auth'

export function createAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function requireModerator() {
  const context = await getAuthContext()
  if (!context) return { context: null, response: Response.json({ error: 'Authentication required.' }, { status: 401 }) }
  if (!['MODERATOR', 'ADMIN'].includes(context.role)) return { context: null, response: Response.json({ error: 'Moderator access required.' }, { status: 403 }) }
  return { context, response: null }
}

export async function requireAdmin() {
  const context = await getAuthContext()
  if (!context) return { context: null, response: Response.json({ error: 'Authentication required.' }, { status: 401 }) }
  if (context.role !== 'ADMIN') return { context: null, response: Response.json({ error: 'Administrator access required.' }, { status: 403 }) }
  return { context, response: null }
}

export async function writeAudit(actor: AuthContext, action: string, targetType: string, targetId: string | null, metadata: Record<string, unknown> = {}) {
  await createAdminClient().from('audit_logs').insert({ actor_id: actor.user.id, action, target_type: targetType, target_id: targetId, metadata })
}

export async function notifyUser(recipientId: string, actorId: string, type: 'MODERATION', entityId: string | null, targetTitle?: string | null) {
  if (recipientId === actorId) return
  await createAdminClient().from('notifications').insert({ recipient_id: recipientId, actor_id: actorId, type, entity_id: entityId, target_title: targetTitle ?? null })
}
