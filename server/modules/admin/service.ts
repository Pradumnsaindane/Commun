import { z } from 'zod'
import { createAdminClient, writeAudit } from '@/lib/admin'
import { ROLES, STATUSES } from '@/lib/auth'
import { requireRole } from '@/server/http/auth'
import { failure, success } from '@/server/http/result'
import { getAuthUser, listAuditLogs, listAuthUsers, updateAuthUserMetadata } from '@/server/repositories/admin'

const pageSchema = z.coerce.number().int().min(1).max(100).catch(1)
const userSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
})

function pageOf(request: Request) {
  return pageSchema.parse(new URL(request.url).searchParams.get('page') ?? '1')
}

export async function listAdminUsers(request: Request) {
  const { context, error } = await requireRole('admin')
  if (error) return error

  const admin = createAdminClient()
  if (!admin) return failure('Admin service is not configured. Set SUPABASE_SERVICE_ROLE_KEY.', 500)
  const { data, error: listError } = await listAuthUsers(admin, pageOf(request), 25)
  if (listError) return failure('Unable to load users.', 500)

  return success({
    users: data.users.map((user) => ({
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      role: ROLES.includes(user.app_metadata?.role) ? user.app_metadata.role : 'USER',
      status: STATUSES.includes(user.app_metadata?.status)
        ? user.app_metadata.status
        : (user.email_confirmed_at ? 'ACTIVE' : 'PENDING_VERIFICATION'),
    })),
  })
}

export async function updateAdminUser(request: Request) {
  const { context, error } = await requireRole('admin')
  if (error) return error

  const parsed = userSchema.safeParse(await request.json().catch(() => null))
  if (
    !parsed.success ||
    parsed.data.userId === context.user.id ||
    (!parsed.data.role && !parsed.data.status)
  ) {
    return failure('Invalid or unsafe user change.', 422)
  }

  const db = createAdminClient()
  if (!db) return failure('Admin service is not configured. Set SUPABASE_SERVICE_ROLE_KEY.', 500)
  const { data: target } = await getAuthUser(db, parsed.data.userId)
  if (!target.user) return failure('User not found.', 404)

  const metadata = {
    ...target.user.app_metadata,
    ...(parsed.data.role ? { role: parsed.data.role } : {}),
    ...(parsed.data.status ? { status: parsed.data.status } : {}),
  }
  const { error: updateError } = await updateAuthUserMetadata(db, parsed.data.userId, metadata)
  if (updateError) return failure('Unable to update user.', 400)

  const actions: string[] = []
  if (parsed.data.role) actions.push('ROLE_CHANGED')
  if (parsed.data.status === 'SUSPENDED') actions.push('USER_SUSPENDED')
  if (parsed.data.status === 'ACTIVE') actions.push('USER_RESTORED')

  // A change can carry both a role and a status update; each security-relevant
  // action needs its own audit entry rather than being collapsed into one.
  for (const action of actions) {
    const auditWritten = await writeAudit(context, action, 'PROFILE', parsed.data.userId, {
      role: parsed.data.role,
      status: parsed.data.status,
    })
    if (!auditWritten) {
      return failure('User was updated but the audit entry could not be recorded.', 500)
    }
  }
  return success({ ok: true })
}

export async function listAdminAuditLogs(request: Request) {
  const { error } = await requireRole('admin')
  if (error) return error

  const page = pageOf(request)
  const pageSize = 30
  const admin = createAdminClient()
  if (!admin) return failure('Admin service is not configured. Set SUPABASE_SERVICE_ROLE_KEY.', 500)
  const { data, count, error: listError } = await listAuditLogs(admin, page, pageSize)
  if (listError) return failure('Unable to load audit logs.', 500)

  return success({ logs: data ?? [], total: count ?? 0, page, pageSize })
}
