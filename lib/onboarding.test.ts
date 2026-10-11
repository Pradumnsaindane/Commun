import { describe, expect, it } from 'vitest'
import { ONBOARDING_INTERESTS, isValidUsername } from './onboarding'

describe('onboarding validation and interests integrity', () => {
  it('contains verified developer interests without duplicates', () => {
    expect(ONBOARDING_INTERESTS.length).toBeGreaterThanOrEqual(10)
    const set = new Set(ONBOARDING_INTERESTS)
    expect(set.size).toBe(ONBOARDING_INTERESTS.length)
    expect(ONBOARDING_INTERESTS).toContain('Java')
    expect(ONBOARDING_INTERESTS).toContain('Cybersecurity')
    expect(ONBOARDING_INTERESTS).toContain('TypeScript')
  })

  it('validates username formatting rules (3-30 chars, alphanumeric + underscore)', () => {
    expect(isValidUsername('pradumn')).toBe(true)
    expect(isValidUsername('dev_alex_99')).toBe(true)

    // Invalid usernames
    expect(isValidUsername('a')).toBe(false) // too short
    expect(isValidUsername('user@name')).toBe(false) // invalid character
    expect(isValidUsername('user name')).toBe(false) // space
    expect(isValidUsername('a'.repeat(31))).toBe(false) // too long
  })
})
