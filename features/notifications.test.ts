import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiRequestMock = vi.fn()

vi.mock('@/features/api-client', () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}))

import {
  clearNotifications,
  deleteNotification,
  getNotifications,
  markNotificationsRead,
} from '@/features/notifications/api'

beforeEach(() => {
  apiRequestMock.mockReset()
})

describe('notification feature API', () => {
  it('requests the first page without query parameters by default', () => {
    getNotifications()
    expect(apiRequestMock).toHaveBeenCalledWith('/notifications')
  })

  it('passes page and limit through the versioned endpoint', () => {
    getNotifications({ page: 3, limit: 15 })
    expect(apiRequestMock).toHaveBeenCalledWith('/notifications?page=3&limit=15')
  })

  it('marks one notification or all notifications read', () => {
    markNotificationsRead('f47ac10b-58cc-4372-a567-0e02b2c3d479')
    expect(apiRequestMock).toHaveBeenLastCalledWith('/notifications', {
      method: 'PATCH',
      body: { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
    })
    markNotificationsRead()
    expect(apiRequestMock).toHaveBeenLastCalledWith('/notifications', {
      method: 'PATCH',
      body: {},
    })
  })

  it('encodes a per-item delete id and exposes clear-all', () => {
    deleteNotification('a b/c')
    expect(apiRequestMock).toHaveBeenLastCalledWith('/notifications/a%20b%2Fc', { method: 'DELETE' })
    clearNotifications()
    expect(apiRequestMock).toHaveBeenLastCalledWith('/notifications', { method: 'DELETE' })
  })
})
