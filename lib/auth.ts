import { createClient } from '@/lib/supabase/server'
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
export function canModerate(context: AuthContext) { return context.role === 'MODERATOR' || context.role === 'ADMIN' }
export function canAdminister(context: AuthContext) { return context.role === 'ADMIN' }
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

export async function isEmailAvailable(email: string) {
  return Boolean(email)
}

export async function isUsernameAvailable(username: string) {
  return Boolean(username)
}

export async function authClient() { return createClient() }

export function authRedirect(pathname: string) { return `/login?next=${encodeURIComponent(safeNextPath(pathname))}` }
