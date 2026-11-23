import { apiRequest } from '@/features/api-client'
import type { NotificationView } from '@shared/index'

export function getNotifications() {
  return apiRequest<{ notifications: NotificationView[] }>('/notifications')
}

export function markNotificationsRead(id?: string) {
  return apiRequest<{ ok: true }>('/notifications', {
    method: 'PATCH',
    body: id ? { id } : {},
  })
}

export function clearNotifications() {
  return apiRequest<{ ok: true }>('/notifications', { method: 'DELETE' })
}
