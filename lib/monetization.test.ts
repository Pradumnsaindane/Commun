import { describe, expect, it } from 'vitest'
import {
  accountStatus,
  canAccessPost,
  formatMoney,
  gatedPostPayload,
  isMembershipActive,
  membershipLabel,
  membershipState,
  platformFeePercent,
  splitGross,
  type MembershipRecord,
} from './monetization'

const base: MembershipRecord = {
  subscriber_id: 'reader',
  creator_id: 'creator',
  status: 'active',
  stripe_subscription_id: 'sub_1',
  current_period_end: null,
}

function future(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString()
}

function past(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

describe('isMembershipActive', () => {
  it('is false without a membership', () => {
    expect(isMembershipActive(null)).toBe(false)
  })

  it('is true for an active membership with a future period end', () => {
    expect(isMembershipActive({ ...base, current_period_end: future(3) })).toBe(true)
  })

  it('is true for a trialing membership with a future period end', () => {
    expect(isMembershipActive({ ...base, status: 'trialing', current_period_end: future(1) })).toBe(true)
  })

  it('is false once the paid period has lapsed (webhook lag guard)', () => {
    expect(isMembershipActive({ ...base, current_period_end: past(1) })).toBe(false)
  })

  it('is false for canceled, past_due, paused, and incomplete states', () => {
    for (const status of ['canceled', 'past_due', 'paused', 'incomplete', 'incomplete_expired', 'unpaid']) {
      expect(isMembershipActive({ ...base, status, current_period_end: future(5) })).toBe(false)
    }
  })

  it('active without a period end counts as active; trialing without one does not', () => {
    expect(isMembershipActive({ ...base, current_period_end: null })).toBe(true)
    expect(isMembershipActive({ ...base, status: 'trialing', current_period_end: null })).toBe(false)
  })
})

describe('canAccessPost', () => {
  it('always allows free posts', () => {
    expect(canAccessPost({ accessLevel: 'FREE', authorId: 'a', viewerId: null, membershipActive: false })).toBe(true)
  })

  it('always allows the author of a members-only post', () => {
    expect(canAccessPost({ accessLevel: 'MEMBERS', authorId: 'a', viewerId: 'a', membershipActive: false })).toBe(true)
  })

  it('allows members-only access only with an active membership', () => {
    expect(canAccessPost({ accessLevel: 'MEMBERS', authorId: 'a', viewerId: 'b', membershipActive: true })).toBe(true)
    expect(canAccessPost({ accessLevel: 'MEMBERS', authorId: 'a', viewerId: 'b', membershipActive: false })).toBe(false)
    expect(canAccessPost({ accessLevel: 'MEMBERS', authorId: 'a', viewerId: null, membershipActive: false })).toBe(false)
  })
})

describe('membershipState', () => {
  it('reports guest, owner, member, and none correctly', () => {
    expect(membershipState({ viewerId: null, authorId: 'a', accessLevel: 'MEMBERS', membershipActive: false })).toBe('guest')
    expect(membershipState({ viewerId: 'a', authorId: 'a', accessLevel: 'MEMBERS', membershipActive: false })).toBe('owner')
    expect(membershipState({ viewerId: 'b', authorId: 'a', accessLevel: 'MEMBERS', membershipActive: true })).toBe('member')
    expect(membershipState({ viewerId: 'b', authorId: 'a', accessLevel: 'MEMBERS', membershipActive: false })).toBe('none')
    expect(membershipState({ viewerId: 'b', authorId: 'a', accessLevel: 'FREE', membershipActive: false })).toBe('none')
  })

  it('labels states for the UI', () => {
    expect(membershipLabel('member')).toBe('Member')
    expect(membershipLabel('owner')).toBe('Your publication')
    expect(membershipLabel('guest')).toBe('Sign in to subscribe')
    expect(membershipLabel('none')).toBe('Become a member')
  })
})

describe('splitGross', () => {
  it('splits with the default 10% platform fee', () => {
    expect(splitGross(1000)).toEqual({ gross: 1000, platformFee: 100, creatorNet: 900 })
  })

  it('floors the platform fee so creators keep the remainder', () => {
    expect(splitGross(999, 10)).toEqual({ gross: 999, platformFee: 99, creatorNet: 900 })
    expect(splitGross(199, 10)).toEqual({ gross: 199, platformFee: 19, creatorNet: 180 })
  })

  it('clamps fee percentage into 0..100 and never returns negatives', () => {
    expect(splitGross(500, -5).platformFee).toBe(0)
    expect(splitGross(500, 250).platformFee).toBe(500)
    expect(splitGross(-100, 10)).toEqual({ gross: 0, platformFee: 0, creatorNet: 0 })
  })
})

describe('platformFeePercent', () => {
  it('defaults to 10, clamps out-of-range values, and floors fractions', () => {
    expect(platformFeePercent(undefined)).toBe(10)
    expect(platformFeePercent('not-a-number')).toBe(10)
    expect(platformFeePercent('5')).toBe(5)
    expect(platformFeePercent('2.9')).toBe(2)
    expect(platformFeePercent('150')).toBe(100)
    expect(platformFeePercent('-3')).toBe(0)
  })
})

describe('formatMoney', () => {
  it('formats known currencies with symbols and others with codes', () => {
    expect(formatMoney(1234)).toBe('$12.34')
    expect(formatMoney(0, 'eur')).toBe('€0.00')
    expect(formatMoney(555, 'jpy')).toBe('5.55 JPY')
    expect(formatMoney(-50)).toBe('$0.00')
  })
})

describe('gatedPostPayload', () => {
  it('returns the body untouched when access is allowed', () => {
    const post = { id: '1', body: 'secret content' }
    expect(gatedPostPayload(post, true)).toEqual({ post, gated: false })
  })

  it('strips the body when access is denied but keeps metadata for preview', () => {
    const result = gatedPostPayload({ id: '1', body: 'secret content' }, false)
    expect(result.gated).toBe(true)
    expect(result.post.body).toBe('')
    expect(result.post.id).toBe('1')
  })
})

describe('accountStatus', () => {
  it('reports onboarding readiness', () => {
    expect(accountStatus(null).ready).toBe(false)
    expect(accountStatus({ details_submitted: false, charges_enabled: false, payouts_enabled: false }).ready).toBe(false)
    expect(accountStatus({ details_submitted: true, charges_enabled: true, payouts_enabled: true }).ready).toBe(true)
    expect(accountStatus({ details_submitted: true, charges_enabled: false, payouts_enabled: false }).ready).toBe(false)
  })
})