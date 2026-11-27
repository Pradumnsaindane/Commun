import { addBillingCycle, type BillingPlanCycle, type ProviderSubscriptionStatus } from '@/lib/billing/types'
import { splitGross } from '@/lib/monetization'
import type { ProviderSubscriptionRow } from '@/server/repositories/provider-billing'

export type PhonePeStateUpdate = {
  status: ProviderSubscriptionStatus
  rank: number
  reason?: 'revoked' | 'cancelled' | 'failed' | null
}

/**
 * Ranks are only a same-instant tie-breaker. Event time is the primary
 * ordering signal because subscription events (pause, renew, unpause) can
 * legitimately repeat in any order.
 */
export function stateRank(status: ProviderSubscriptionStatus): number {
  switch (status) {
    case 'incomplete': return 10
    case 'trialing': return 20
    case 'active': return 30
    case 'past_due': return 35
    case 'paused': return 40
    case 'unpaid': return 45
    case 'incomplete_expired': return 80
    case 'canceled': return 90
    case 'revoked': return 95
  }
}

export function isTerminalStatus(status: string): boolean {
  return ['canceled', 'revoked', 'incomplete_expired'].includes(status)
}

/**
 * Guards against stale callbacks overwriting a newer state. Cancel/revoke are
 * terminal. While paused, only an explicit unpause callback may restore
 * access; a redemption callback cannot silently re-enable a paused mandate.
 */
export function canApplyPhonePeState(
  current: ProviderSubscriptionRow,
  update: PhonePeStateUpdate,
  event: string,
  eventAtMs: number,
): boolean {
  if (isTerminalStatus(current.status)) return false

  if (current.last_event_at) {
    const lastAt = new Date(current.last_event_at).getTime()
    if (Number.isFinite(lastAt)) {
      if (eventAtMs < lastAt) return false
      if (eventAtMs === lastAt && update.rank < current.last_event_rank) return false
    }
  }

  if (current.status === 'paused' && update.status !== 'paused' && event !== 'subscription.unpaused') {
    return false
  }
  return true
}

export function nextPaidThrough(
  subscription: ProviderSubscriptionRow,
  cycle: BillingPlanCycle,
  eventAtMs: number,
): string {
  const now = Date.now()
  const previous = subscription.paid_through ? new Date(subscription.paid_through).getTime() : 0
  const base = new Date(previous > now ? previous : eventAtMs)
  return addBillingCycle(cycle, base).toISOString()
}

export function feeSplit(amountMinor: number): { gross: number; fee: number; net: number } {
  const { gross, platformFee, creatorNet } = splitGross(amountMinor)
  return { gross, fee: platformFee, net: creatorNet }
}

export function normalizeFrequency(frequency: string | null | undefined): BillingPlanCycle {
  return frequency === 'YEARLY' ? 'YEARLY' : 'MONTHLY'
}

export function eventRank(event: string, state: string | undefined): number {
  switch (event) {
    case 'subscription.setup.order.completed':
      return state === 'COMPLETED' ? stateRank('active') : stateRank('incomplete_expired')
    case 'subscription.setup.order.failed':
      return stateRank('incomplete_expired')
    case 'subscription.paused':
      return stateRank('paused')
    case 'subscription.unpaused':
      return stateRank('active')
    case 'subscription.revoked':
      return stateRank('revoked')
    case 'subscription.cancelled':
      return stateRank('canceled')
    case 'subscription.redemption.order.failed':
    case 'subscription.redemption.transaction.failed':
      return stateRank('past_due')
    case 'subscription.redemption.order.completed':
    case 'subscription.redemption.transaction.completed':
      return stateRank('active')
    default:
      return 0
  }
}

export function mapPhonePeState(event: string, state: string | undefined): PhonePeStateUpdate | null {
  switch (event) {
    case 'subscription.setup.order.completed':
      if (state === 'COMPLETED') return { status: 'active', rank: eventRank(event, state) }
      if (state === 'FAILED') return { status: 'incomplete_expired', rank: eventRank(event, state), reason: 'failed' }
      return { status: 'incomplete', rank: eventRank(event, state) }
    case 'subscription.setup.order.failed':
      return { status: 'incomplete_expired', rank: eventRank(event, state), reason: 'failed' }
    case 'subscription.paused':
      return { status: 'paused', rank: eventRank(event, state) }
    case 'subscription.unpaused':
      return { status: 'active', rank: eventRank(event, state) }
    case 'subscription.revoked':
      return { status: 'revoked', rank: eventRank(event, state), reason: 'revoked' }
    case 'subscription.cancelled':
      return { status: 'canceled', rank: eventRank(event, state), reason: 'cancelled' }
    case 'subscription.redemption.order.failed':
    case 'subscription.redemption.transaction.failed':
      return { status: 'past_due', rank: eventRank(event, state), reason: 'failed' }
    case 'subscription.redemption.order.completed':
    case 'subscription.redemption.transaction.completed':
      return { status: 'active', rank: eventRank(event, state) }
    default:
      return null
  }
}
