import { apiRequest } from '@/features/api-client'

export type AdminRole = 'USER' | 'MODERATOR' | 'ADMIN'
export type AdminUserStatus = 'ACTIVE' | 'SUSPENDED'

export function updateAdminUser(input: {
  userId: string
  role?: AdminRole
  status?: AdminUserStatus
}) {
  return apiRequest<{ ok: true }>('/admin/users', { method: 'PATCH', body: input })
}
