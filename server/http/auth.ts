import type { SupabaseClient, User } from '@supabase/supabase-js'
import { requireAdmin, requireModerator } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'
import { failure, type ServiceFailure } from '@/server/http/result'

export type RequestContext = {
  supabase: SupabaseClient
  user: User | null
}

/**
 * Resolve the request's Supabase client and session once.
 *
 * Authorization always comes from the session. Services must never accept a
 * user id from the request body when acting on behalf of a user.
 */
export async function getRequestContext(): Promise<RequestContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export function isActiveProfile(profile: { status?: string | null } | null | undefined): boolean {
  return profile?.status === 'ACTIVE'
}

/**
 * Role check expressed as a transport-agnostic result so privileged services
 * do not have to build HTTP responses themselves.
 */
export async function requireRole(
  kind: 'admin' | 'moderator'
): Promise<{ context: NonNullable<Awaited<ReturnType<typeof requireAdmin>>['context']>; error: null } | { context: null; error: ServiceFailure }> {
  const result = kind === 'admin' ? await requireAdmin() : await requireModerator()
  if (result.response) {
    const body = await result.response.json().catch(() => null)
    return {
      context: null,
      error: failure(
        typeof body?.error === 'string' ? body.error : 'Unauthorized.',
        result.response.status
      ),
    }
  }
  return { context: result.context!, error: null }
}
