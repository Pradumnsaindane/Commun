import { describe, expect, it } from 'vitest'
import type { NotificationView } from '@shared/index'
import { notificationHref, notificationLabel } from './use-notifications'

const notification = (overrides: Partial<NotificationView> = {}): NotificationView => ({
  id: 'n-1',
  actor_id: 'u-2',
  type: 'LIKE',
  target_slug: null,
  target_title: null,
  read: false,
  created_at: '2026-01-01T00:00:00Z',
  actor: { username: 'alice', name: 'Alice' },
  ...overrides,
})

describe('notification view helpers', () => {
  it('describes each notification type with the actor name', () => {
    expect(notificationLabel(notification())).toBe('Alice liked your article.')
    expect(notificationLabel(notification({ type: 'COMMENT' }))).toBe('Alice commented on your article.')
    expect(notificationLabel(notification({ type: 'REPLY' }))).toBe('Alice replied to your comment.')
    expect(notificationLabel(notification({ type: 'FOLLOW' }))).toBe('Alice followed you.')
    expect(notificationLabel(notification({ type: 'MENTION' }))).toBe('Alice mentioned you.')
  })

  it('uses a neutral actor fallback and a neutral unknown-type message', () => {
    expect(notificationLabel(notification({ actor: null, type: 'LIKE' }))).toBe('Someone liked your article.')
    expect(notificationLabel(notification({ type: 'MODERATION' }))).toBe('A moderator updated your content.')
  })

  it('links to the target article, the actor profile for follows, or the center', () => {
    expect(notificationHref(notification({ target_slug: 'hello-world' }))).toBe('/post/hello-world')
    expect(notificationHref(notification({ type: 'FOLLOW' }))).toBe('/profile/alice')
    expect(notificationHref(notification({ type: 'FOLLOW', actor: null }))).toBe('/notifications')
  })
})
