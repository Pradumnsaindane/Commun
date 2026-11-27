import { describe, expect, it, vi } from 'vitest'
import { applyProviderSubscriptionEventUpdate, resetExpiredProviderEventLease } from './provider-billing'

function subscriptionDb(result: { data: unknown; error: null }) {
  const calls = {
    update: vi.fn(),
    eq: vi.fn(),
    not: vi.fn(),
    or: vi.fn(),
    neq: vi.fn(),
    select: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  }
  const builder: Record<string, unknown> = {}
  builder.eq = calls.eq.mockReturnValue(builder)
  builder.not = calls.not.mockReturnValue(builder)
  builder.or = calls.or.mockReturnValue(builder)
  builder.neq = calls.neq.mockReturnValue(builder)
  builder.select = calls.select.mockReturnValue(builder)
  builder.maybeSingle = calls.maybeSingle
  const db = { from: vi.fn().mockReturnValue({ update: calls.update.mockReturnValue(builder) }) }
  return { db: db as never, calls }
}

function eventDb(result: { data: unknown; error: null }) {
  const calls = {
    update: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    select: vi.fn().mockResolvedValue(result),
  }
  const builder: Record<string, unknown> = {}
  builder.eq = calls.eq.mockReturnValue(builder)
  builder.or = calls.or.mockReturnValue(builder)
  builder.select = calls.select
  const db = { from: vi.fn().mockReturnValue({ update: calls.update.mockReturnValue(builder) }) }
  return { db: db as never, calls }
}

describe('provider billing repository guards', () => {
  it('applies subscription updates with atomic terminal and event-order filters', async () => {
    const { db, calls } = subscriptionDb({ data: { id: 'sub-1' }, error: null })
    await applyProviderSubscriptionEventUpdate(db, 'sub-1', { status: 'active' }, {
      eventAt: '2026-01-01T00:00:00.000Z',
      rank: 30,
      allowWhenPaused: false,
    })

    expect(calls.not).toHaveBeenCalledWith('status', 'in', '(canceled,revoked,incomplete_expired)')
    expect(calls.or).toHaveBeenCalledWith(expect.stringContaining('last_event_at.lt.2026-01-01T00:00:00.000Z'))
    expect(calls.neq).toHaveBeenCalledWith('status', 'paused')
  })

  it('allows a paused-row update only when explicitly permitted', async () => {
    const { db, calls } = subscriptionDb({ data: null, error: null })
    await applyProviderSubscriptionEventUpdate(db, 'sub-1', { status: 'paused' }, {
      eventAt: '2026-01-01T00:00:00.000Z',
      rank: 40,
      allowWhenPaused: true,
    })
    expect(calls.neq).not.toHaveBeenCalled()
  })

  it('recovers expired or legacyless processing leases', async () => {
    const now = '2026-01-01T00:05:00.000Z'
    const { db, calls } = eventDb({ data: [{ event_id: 'event-1' }], error: null })
    const result = await resetExpiredProviderEventLease(db, 'phonepe', 'event-1', now)

    expect(result.data).toEqual([{ event_id: 'event-1' }])
    expect(calls.eq).toHaveBeenCalledTimes(3)
    expect(calls.or).toHaveBeenCalledWith(`lease_expires_at.is.null,lease_expires_at.lt.${now}`)
  })
})
