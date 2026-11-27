import { describe, expect, it } from 'vitest'
import { platformFeePercent } from '@/lib/monetization'
import type { ProviderSubscriptionRow } from '@/server/repositories/provider-billing'
import {
  canApplyPhonePeState,
  eventRank,
  feeSplit,
  isTerminalStatus,
  mapPhonePeState,
  nextPaidThrough,
  stateRank,
} from './phonepe-shared'

const base = {
  id: 'sub-1',
  subscriber_id: 'user-1',
  creator_id: 'creator-1',
  provider: 'phonepe' as const,
  plan_id: 'monthly-inr',
  status: 'active',
  status_reason: null,
  provider_subscription_id: null,
  merchant_subscription_id: 'MS-1',
  merchant_order_id: 'MO-1',
  provider_order_id: null,
  provider_state: 'COMPLETED',
  amount_minor: 19900,
  max_amount_minor: 19900,
  currency: 'INR',
  frequency: 'MONTHLY',
  current_period_end: null,
  paid_through: null,
  next_renewal_at: null,
  cancel_at_period_end: false,
  paused_start: null,
  paused_end: null,
  last_event_at: '2026-01-01T00:00:00.000Z',
  last_event_rank: stateRank('active'),
  created_at: '2026-01-01T00:00:00.000Z',
} satisfies ProviderSubscriptionRow

describe('PhonePe state mapping and ordering', () => {
  it('maps documented webhook events to normalized statuses', () => {
    expect(mapPhonePeState('subscription.setup.order.completed', 'COMPLETED')?.status).toBe('active')
    expect(mapPhonePeState('subscription.setup.order.failed', undefined)?.status).toBe('incomplete_expired')
    expect(mapPhonePeState('subscription.paused', undefined)?.status).toBe('paused')
    expect(mapPhonePeState('subscription.unpaused', undefined)?.status).toBe('active')
    expect(mapPhonePeState('subscription.revoked', undefined)?.status).toBe('revoked')
    expect(mapPhonePeState('subscription.cancelled', undefined)?.status).toBe('canceled')
    expect(mapPhonePeState('subscription.redemption.order.failed', undefined)?.status).toBe('past_due')
    expect(mapPhonePeState('subscription.redemption.transaction.completed', undefined)?.status).toBe('active')
    expect(mapPhonePeState('pg.refund.completed', 'COMPLETED')).toBeNull()
  })

  it('ignores stale and terminal events', () => {
    const active = mapPhonePeState('subscription.paused', undefined)!
    expect(canApplyPhonePeState(base, active, 'subscription.paused', Date.parse('2026-01-02T00:00:00Z'))).toBe(true)
    expect(canApplyPhonePeState(base, active, 'subscription.paused', Date.parse('2025-12-31T00:00:00Z'))).toBe(false)

    const canceled = { ...base, status: 'canceled' }
    expect(canApplyPhonePeState(canceled, active, 'subscription.paused', Date.now())).toBe(false)
    expect(isTerminalStatus('revoked')).toBe(true)
  })

  it('does not let a redemption callback re-enable a paused mandate', () => {
    const paused = { ...base, status: 'paused', last_event_rank: stateRank('paused') }
    const renewal = mapPhonePeState('subscription.redemption.transaction.completed', undefined)!
    expect(canApplyPhonePeState(paused, renewal, 'subscription.redemption.transaction.completed', Date.now())).toBe(false)
    const unpause = mapPhonePeState('subscription.unpaused', undefined)!
    expect(canApplyPhonePeState(paused, unpause, 'subscription.unpaused', Date.now())).toBe(true)
  })

  it('allows a pause after a renewal because event time is authoritative', () => {
    const renewed = { ...base, last_event_rank: eventRank('subscription.redemption.transaction.completed', undefined), last_event_at: '2026-02-01T00:00:00.000Z' }
    const pause = mapPhonePeState('subscription.paused', undefined)!
    expect(canApplyPhonePeState(renewed, pause, 'subscription.paused', Date.parse('2026-03-01T00:00:00Z'))).toBe(true)
  })

  it('advances paid-through by cycle without losing future time', () => {
    const now = new Date()
    const future = new Date(now.getTime() + 10 * 24 * 60 * 60_000).toISOString()
    const monthly = nextPaidThrough({ ...base, paid_through: future }, 'MONTHLY', now.getTime())
    expect(new Date(monthly).getTime()).toBeGreaterThan(new Date(future).getTime())
    const yearly = nextPaidThrough(base, 'YEARLY', now.getTime())
    expect(new Date(yearly).getUTCFullYear()).toBe(now.getUTCFullYear() + 1)
  })

  it('splits fees using the platform percentage', () => {
    const fee = Math.floor((10000 * platformFeePercent()) / 100)
    expect(feeSplit(10000)).toEqual({ gross: 10000, fee, net: 10000 - fee })
  })
})
