import { z } from 'zod'
import { requireAdmin, createAdminClient, writeAudit } from '@/lib/admin'

const schema = z.object({ userId: z.string().uuid(), role: z.enum(['USER', 'MODERATOR', 'ADMIN']).optional(), status: z.enum(['ACTIVE', 'SUSPENDED']).optional() })

export async function GET(request: Request) {
  const auth = await requireAdmin(); if (auth.response) return auth.response
  const page = Math.max(1, Number(new URL(request.url).searchParams.get('page') ?? 1)); const perPage = 25
  const { data, error } = await createAdminClient().auth.admin.listUsers({ page, perPage }); if (error) return Response.json({ error: 'Unable to load users.' }, { status: 500 })
  return Response.json({ users: data.users.map((user) => ({ id: user.id, email: user.email, createdAt: user.created_at, lastSignInAt: user.last_sign_in_at, role: user.app_metadata?.role ?? 'USER', status: user.app_metadata?.status ?? (user.email_confirmed_at ? 'ACTIVE' : 'PENDING_VERIFICATION') })) })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(); if (auth.response) return auth.response
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success || parsed.data.userId === auth.context!.user.id) return Response.json({ error: 'Invalid or unsafe user change.' }, { status: 422 })
  const db = createAdminClient(); const { data: target } = await db.auth.admin.getUserById(parsed.data.userId); if (!target.user) return Response.json({ error: 'User not found.' }, { status: 404 })
  const metadata = { ...target.user.app_metadata, ...(parsed.data.role ? { role: parsed.data.role } : {}), ...(parsed.data.status ? { status: parsed.data.status } : {}) }
  const { error } = await db.auth.admin.updateUserById(parsed.data.userId, { app_metadata: metadata }); if (error) return Response.json({ error: 'Unable to update user.' }, { status: 400 })
  await writeAudit(auth.context!, parsed.data.role ? 'ROLE_CHANGED' : parsed.data.status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_RESTORED', 'PROFILE', parsed.data.userId, { role: parsed.data.role, status: parsed.data.status })
  return Response.json({ ok: true })
}
