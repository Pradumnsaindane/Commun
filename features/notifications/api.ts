import { apiRequest } from '@/features/api-client'
import type { NotificationPageResponse } from '@shared/index'

export type NotificationPageParams = {
  page?: number
  limit?: number
}

export function getNotifications({ page, limit }: NotificationPageParams = {}) {
  const query = new URLSearchParams()
  if (page !== undefined) query.set('page', String(page))
  if (limit !== undefined) query.set('limit', String(limit))
  const suffix = query.toString()
  return apiRequest<NotificationPageResponse>(`/notifications${suffix ? `?${suffix}` : ''}`)
}

export function markNotificationsRead(id?: string) {
  return apiRequest<{ ok: true }>('/notifications', {
    method: 'PATCH',
    body: id ? { id } : {},
  })
}

export function deleteNotification(id: string) {
  return apiRequest<{ ok: true }>(`/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function clearNotifications() {
  return apiRequest<{ ok: true }>('/notifications', { method: 'DELETE' })
}
