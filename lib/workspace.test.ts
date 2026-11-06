import { describe, it, expect } from 'vitest'
import {
  ROLES,
  STATUSES,
  canPublish,
  canModerate,
  canAdminister,
  safeNextPath,
  type AuthContext,
} from './auth'

describe('Commun Workspace Architecture & Authorization', () => {
  it('enforces expected roles and status constants', () => {
    expect(ROLES).toEqual(['USER', 'MODERATOR', 'ADMIN'])
    expect(STATUSES).toContain('ACTIVE')
    expect(STATUSES).toContain('PENDING_VERIFICATION')
    expect(STATUSES).toContain('SUSPENDED')
  })

  it('validates role capabilities correctly', () => {
    const activeUserContext: AuthContext = {
      user: { id: 'u-1', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } as any,
      role: 'USER',
      status: 'ACTIVE',
      isVerified: true,
    }

    const moderatorContext: AuthContext = {
      user: { id: 'm-1', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } as any,
      role: 'MODERATOR',
      status: 'ACTIVE',
      isVerified: true,
    }

    const adminContext: AuthContext = {
      user: { id: 'a-1', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } as any,
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
    }

    expect(canPublish(activeUserContext)).toBe(true)
    expect(canModerate(activeUserContext)).toBe(false)
    expect(canAdminister(activeUserContext)).toBe(false)

    expect(canPublish(moderatorContext)).toBe(true)
    expect(canModerate(moderatorContext)).toBe(true)
    expect(canAdminister(moderatorContext)).toBe(false)

    expect(canPublish(adminContext)).toBe(true)
    expect(canModerate(adminContext)).toBe(true)
    expect(canAdminister(adminContext)).toBe(true)
  })

  it('blocks suspended or unverified accounts from publishing', () => {
    const unverifiedContext: AuthContext = {
      user: { id: 'u-2', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } as any,
      role: 'USER',
      status: 'PENDING_VERIFICATION',
      isVerified: false,
    }

    const suspendedContext: AuthContext = {
      user: { id: 'u-3', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } as any,
      role: 'USER',
      status: 'SUSPENDED',
      isVerified: true,
    }

    expect(canPublish(unverifiedContext)).toBe(false)
    expect(canPublish(suspendedContext)).toBe(false)
  })

  it('prevents open redirect vulnerabilities using safeNextPath', () => {
    expect(safeNextPath('/dashboard')).toBe('/dashboard')
    expect(safeNextPath('/projects')).toBe('/projects')
    expect(safeNextPath('/tasks')).toBe('/tasks')
    expect(safeNextPath('https://evil.com')).toBe('/feed')
    expect(safeNextPath('//evil.com')).toBe('/feed')
    expect(safeNextPath(null)).toBe('/feed')
    expect(safeNextPath(undefined)).toBe('/feed')
  })
})
