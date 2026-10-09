import { describe, expect, it } from 'vitest'
import { safeNext } from './auth/validation'
import { safeNextPath } from './auth/validation'
import { isTrustedNotificationType, nextReplyDepth } from './security-validation'

describe('notification and reply authorization rules', () => {
  it('only permits trusted notification types', () => {
    expect(isTrustedNotificationType('MODERATION')).toBe(true)
    expect(isTrustedNotificationType('SYSTEM')).toBe(false)
    expect(isTrustedNotificationType('')).toBe(false)
  })
  it('enforces reply depth limits', () => {
    expect(nextReplyDepth(null)).toBe(0)
    expect(nextReplyDepth(0)).toBe(1)
    expect(nextReplyDepth(1)).toBe(2)
    expect(nextReplyDepth(2)).toBeNull()
    expect(nextReplyDepth(-1)).toBeNull()
  })
})

describe('redirect hardening', () => {
  it.each(['https://evil.example', '//evil.example', '\\\\evil.example', ''])('rejects unsafe next value %s', (value) => {
    expect(safeNext(value)).toBe('/dashboard')
    expect(safeNextPath(value)).toBe('/feed')
  })
  it('allows internal paths', () => {
    expect(safeNext('/settings')).toBe('/settings')
    expect(safeNextPath('/settings?tab=security')).toBe('/settings?tab=security')
  })
})
