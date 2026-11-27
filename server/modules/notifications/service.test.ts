import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getRequestContext: vi.fn(),
  list: vi.fn(),
  countUnread: vi.fn(),
  findActors: vi.fn(),
  markRead: vi.fn(),
  deleteById: vi.fn(),
  clear: vi.fn(),
}))

vi.mock('@/server/http/auth', () => ({ getRequestContext: mocks.getRequestContext }))
vi.mock('@/server/repositories/notifications', () => ({
  listNotificationsForRecipient: mocks.list,
  countUnreadNotifications: mocks.countUnread,
  findNotificationActors: mocks.findActors,
  markNotificationsRead: mocks.markRead,
  deleteNotificationForRecipient: mocks.deleteById,
  clearNotifications: mocks.clear,
}))

import {
  clearAllNotifications,
  deleteNotification,
  listNotifications,
  markNotificationsRead,
  rejectNotificationCreate,
} from '@/server/modules/notifications/service'

const supabase = { marker: 'session-client' }
const user = { id: 'viewer-1' }

function authenticatedRequest(url: string, init?: RequestInit) {
  return new Request(url, init)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getRequestContext.mockResolvedValue({ supabase, user })
  mocks.list.mockResolvedValue({ data: [], error: null, count: 0 })
  mocks.countUnread.mockResolvedValue({ count: 0, error: null })
  mocks.findActors.mockResolvedValue({ data: [], error: null })
  mocks.markRead.mockResolvedValue({ error: null })
  mocks.deleteById.mockResolvedValue({ error: null })
  mocks.clear.mockResolvedValue({ error: null })
})

describe('notification service boundaries', () => {
  it('rejects anonymous list, create, read, delete and clear', async () => {
    mocks.getRequestContext.mockResolvedValue({ supabase, user: null })

    expect((await listNotifications(authenticatedRequest('http://localhost/api/v1/notifications'))).status).toBe(401)
    expect((await rejectNotificationCreate()).status).toBe(401)
    expect((await markNotificationsRead(authenticatedRequest('http://localhost/api/v1/notifications', { method: 'PATCH', body: '{}' }))).status).toBe(401)
    expect((await deleteNotification(authenticatedRequest('http://localhost/api/v1/notifications/f47ac10b-58cc-4372-a567-0e02b2c3d479', { method: 'DELETE' }))).status).toBe(401)
    expect((await clearAllNotifications()).status).toBe(401)
  })

  it('returns paginated rows, an exact unread count and private cache headers', async () => {
    mocks.list.mockResolvedValue({
      data: [{ id: 'n1', actor_id: null, type: 'MODERATION', entity_id: null, target_slug: null, target_title: null, read: false, created_at: '2026-01-01T00:00:00Z' }],
      error: null,
      count: 25,
    })
    mocks.countUnread.mockResolvedValue({ count: 7, error: null })

    const result = await listNotifications(authenticatedRequest('http://localhost/api/v1/notifications?page=2&limit=10'))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(mocks.list).toHaveBeenCalledWith(supabase, user.id, { page: 2, limit: 10 })
    expect(result.data).toMatchObject({ page: 2, limit: 10, total: 25, hasNextPage: true, unreadCount: 7 })
    expect(result.headers).toEqual({ 'cache-control': 'private, no-store' })
  })

  it('reports a failed unread count as a 500 rather than returning a stale badge', async () => {
    mocks.countUnread.mockResolvedValue({ count: null, error: { code: '500' } })
    const result = await listNotifications(authenticatedRequest('http://localhost/api/v1/notifications'))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.status).toBe(500)
  })

  it('rejects client-created notifications and malformed update ids', async () => {
    expect((await rejectNotificationCreate()).status).toBe(403)

    const result = await markNotificationsRead(authenticatedRequest('http://localhost/api/v1/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'not-a-uuid' }),
    }))
    expect(result.status).toBe(422)
    expect(mocks.markRead).not.toHaveBeenCalled()
  })

  it('scopes mark-read, per-item delete and clear-all to the session user', async () => {
    const id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    await markNotificationsRead(authenticatedRequest('http://localhost/api/v1/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ id }),
    }))
    expect(mocks.markRead).toHaveBeenCalledWith(supabase, user.id, id)

    await deleteNotification(authenticatedRequest(`http://localhost/api/v1/notifications/${id}`, { method: 'DELETE' }))
    expect(mocks.deleteById).toHaveBeenCalledWith(supabase, user.id, id)

    await clearAllNotifications()
    expect(mocks.clear).toHaveBeenCalledWith(supabase, user.id)
  })

  it('rejects a malformed per-item delete id before reaching the repository', async () => {
    const result = await deleteNotification(authenticatedRequest('http://localhost/api/v1/notifications/../not-a-uuid', { method: 'DELETE' }))
    expect(result.status).toBe(422)
    expect(mocks.deleteById).not.toHaveBeenCalled()
  })
})
