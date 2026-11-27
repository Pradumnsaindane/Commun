import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeNextPath as safeNextPathValue } from './auth/validation'

export const ROLES = ['USER', 'MODERATOR', 'ADMIN'] as const
export const STATUSES = ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'DELETED'] as const
export type Role = (typeof ROLES)[number]
export type Status = (typeof STATUSES)[number]

export type AuthContext = {
  user: NonNullable<Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>['auth']['getUser']>>['data']['user']>
  role: Role
  status: Status
  isVerified: boolean
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const role = ROLES.includes(user.app_metadata?.role) ? user.app_metadata.role as Role : 'USER'
  const status = STATUSES.includes(user.app_metadata?.status) ? user.app_metadata.status as Status : (user.email_confirmed_at ? 'ACTIVE' : 'PENDING_VERIFICATION')
  return { user, role, status, isVerified: status === 'ACTIVE' && Boolean(user.email_confirmed_at) }
}

export function canPublish(context: AuthContext) { return context.isVerified && !['SUSPENDED', 'DEACTIVATED', 'DELETED'].includes(context.status) }
// Privileged access requires both the role and an active account. A stale
// privileged claim on a suspended/deactivated account must not grant access.
export function canModerate(context: AuthContext) { return context.status === 'ACTIVE' && (context.role === 'MODERATOR' || context.role === 'ADMIN') }
export function canAdminister(context: AuthContext) { return context.status === 'ACTIVE' && context.role === 'ADMIN' }
export function canModifyResource(context: AuthContext, ownerId: string) { return context.user.id === ownerId && !['SUSPENDED', 'DEACTIVATED', 'DELETED'].includes(context.status) }

export const safeNextPath = safeNextPathValue

export function authError(status: 401 | 403 | 404 | 422 | 500, message: string) {
  return Response.json({ error: message }, { status })
}

export async function requireUser() {
  const context = await getAuthContext()
  return context
}

export function publicAuthMessage(error: { message?: string; code?: string } | null, action: 'login' | 'register') {
  if (!error) return null
  if (error.code === 'email_not_confirmed') return 'Check your email to verify your account before continuing.'
  if (error.code === 'weak_password') return 'Choose a stronger password and try again.'
  if (error.code === 'over_email_send_rate_limit') return 'Too many attempts. Please try again later.'
  return action === 'login' ? 'Invalid email or password.' : 'We could not create that account. Check your details and try again.'
}

export function usernameFromUser(user: AuthContext['user']) { return user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'member' }
export function nameFromUser(user: AuthContext['user']) { return user.user_metadata?.name ?? usernameFromUser(user) }

export async function signOut() { const supabase = await createClient(); await supabase.auth.signOut() }

export async function assertAuthorized(check: (context: AuthContext) => boolean) {
  const context = await getAuthContext()
  if (!context) return { context: null, response: authError(401, 'Unauthenticated') }
  if (!check(context)) return { context: null, response: authError(403, 'Authenticated but unauthorized') }
  return { context, response: null }
}

/**
 * Real username availability. Usernames are public (they appear in profile
 * URLs), so this is safe to answer from a normal session. The proposed
 * migration adds a case-insensitive unique index so a race between this check
 * and the write resolves to a 23505 conflict instead of a duplicate.
 */
export async function isUsernameAvailable(username: string) {
  const candidate = username.trim().toLowerCase()
  if (!/^[a-z0-9_]{3,24}$/.test(candidate)) return false
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('id').ilike('username', candidate).limit(1).maybeSingle()
  if (error) return false
  return !data
}

/**
 * Email availability is deliberately server-only and never exposed through a
 * public route: answering it would create an account-existence oracle.
 *
 * Returns `true`/`false` when the service-role client and the proposed
 * `email_available(text)` function are available, and `null` when the answer
 * cannot be determined safely. Callers must treat `null` as unknown and fall
 * back to the provider's generic response.
 */
export async function isEmailAvailable(email: string): Promise<boolean | null> {
  const candidate = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) return false
  const admin = createAdminClient()
  if (!admin) return null
  const { data, error } = await admin.rpc('email_available', { candidate })
  if (error) return null
  return Boolean(data)
}

export async function authClient() { return createClient() }

export function authRedirect(pathname: string) { return `/login?next=${encodeURIComponent(safeNextPath(pathname))}` }
