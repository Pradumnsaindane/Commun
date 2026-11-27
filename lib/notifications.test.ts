import { describe, expect, it, vi } from 'vitest'

describe('parseNotificationPage', () => {
  it('uses safe defaults for absent or malformed values', async () => {
    const { parseNotificationPage } = await import('@/lib/notifications')
    expect(parseNotificationPage(new URL('http://localhost/api/v1/notifications'))).toEqual({ page: 1, limit: 20 })
    expect(parseNotificationPage(new URL('http://localhost/api/v1/notifications?page=0&limit=-4'))).toEqual({ page: 1, limit: 20 })
    expect(parseNotificationPage(new URL('http://localhost/api/v1/notifications?page=abc&limit=abc'))).toEqual({ page: 1, limit: 20 })
  })

  it('accepts valid values and caps the page size', async () => {
    const { parseNotificationPage } = await import('@/lib/notifications')
    expect(parseNotificationPage(new URL('http://localhost/api/v1/notifications?page=3&limit=10'))).toEqual({ page: 3, limit: 10 })
    expect(parseNotificationPage(new URL('http://localhost/api/v1/notifications?limit=999'))).toEqual({ page: 1, limit: 50 })
  })
})

describe('createNotification', () => {
  it('never notifies the actor about their own action', async () => {
    const { createNotification } = await import('@/lib/notifications')
    const upsert = vi.fn()
    const supabase = { from: vi.fn(() => ({ upsert })) }

    await createNotification(supabase as never, {
      recipientId: 'user-1',
      actorId: 'user-1',
      type: 'LIKE',
    })

    expect(supabase.from).not.toHaveBeenCalled()
    expect(upsert).not.toHaveBeenCalled()
  })

  it('deduplicates on the recipient/actor/type/entity key', async () => {
    const { createNotification } = await import('@/lib/notifications')
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const supabase = { from: vi.fn(() => ({ upsert })) }

    await createNotification(supabase as never, {
      recipientId: 'user-1',
      actorId: 'user-2',
      type: 'FOLLOW',
      entityId: 'user-2',
    })

    expect(upsert).toHaveBeenCalledWith(
      {
        recipient_id: 'user-1',
        actor_id: 'user-2',
        type: 'FOLLOW',
        entity_id: 'user-2',
        target_slug: null,
        target_title: null,
      },
      { onConflict: 'recipient_id,actor_id,type,entity_id', ignoreDuplicates: true }
    )
  })

  it('logs only the provider error code when a write fails', async () => {
    const { createNotification } = await import('@/lib/notifications')
    const upsert = vi.fn().mockResolvedValue({ error: { code: '23503', message: 'secret detail' } })
    const supabase = { from: vi.fn(() => ({ upsert })) }
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    await createNotification(supabase as never, { recipientId: 'user-1', actorId: 'user-2', type: 'MENTION' })

    expect(error).toHaveBeenCalledWith('Notification write failed', { code: '23503' })
    error.mockRestore()
  })
})
