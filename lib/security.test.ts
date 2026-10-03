import { describe, expect, it } from 'vitest'
import { safeNext } from './auth/validation'
import { safeNextPath } from './auth/validation'

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
