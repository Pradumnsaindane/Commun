import { describe, expect, it } from 'vitest'
import { authMessage, emailSchema, loginSchema, resetSchema, safeNext, safeNextPath } from './validation'

describe('authentication input validation', () => {
  it('accepts valid credentials and trims email whitespace', () => {
    const parsed = loginSchema.safeParse({ email: '  dev@example.com ', password: 'Password123' })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.email).toBe('dev@example.com')
  })

  it('rejects invalid login input', () => {
    expect(loginSchema.safeParse({ email: 'bad-email', password: 'Password123' }).success).toBe(false)
    expect(loginSchema.safeParse({ email: 'dev@example.com', password: '' }).success).toBe(false)
  })

  it('validates recovery email and reset password strength', () => {
    expect(emailSchema.safeParse({ email: 'dev@example.com' }).success).toBe(true)
    expect(emailSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
    expect(resetSchema.safeParse({ password: 'Password123', confirmPassword: 'Password123' }).success).toBe(true)
    expect(resetSchema.safeParse({ password: 'weakpass', confirmPassword: 'weakpass' }).success).toBe(false)
    expect(resetSchema.safeParse({ password: 'Password123', confirmPassword: 'Different123' }).success).toBe(false)
  })

  it('does not leak raw provider errors to the login form', () => {
    expect(authMessage('Invalid login credentials')).toBe('Invalid email or password.')
    expect(authMessage('Email not confirmed')).toBe('Something went wrong. Please try again.')
    expect(authMessage('User with this email already registered')).toBe('That email or username is already in use.')
  })
})

describe('redirect validation hardening', () => {
  it.each(['https://evil.example', '//evil.example', '/\\evil.example', '\\\\evil.example', 'javascript:alert(1)', ''])(
    'rejects unsafe next value %s',
    (value) => {
      expect(safeNext(value)).toBe('/dashboard')
      expect(safeNextPath(value)).toBe('/feed')
    }
  )

  it('preserves safe relative destinations including query strings', () => {
    expect(safeNext('/feed?tab=latest')).toBe('/feed?tab=latest')
    expect(safeNextPath('/settings?tab=security')).toBe('/settings?tab=security')
  })
})
