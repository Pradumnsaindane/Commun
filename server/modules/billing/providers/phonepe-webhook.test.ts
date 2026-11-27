import { beforeEach, describe, expect, it, vi } from 'vitest'
import { phonePeWebhookSchema } from '@/lib/phonepe/webhook'
import type { ProviderSubscriptionRow } from '@/server/repositories/provider-billing'
import { stateRank } from './phonepe-shared'

const findSubscriptionMock = vi.fn()
const applySubscriptionMock = vi.fn()
const findPaymentMock = vi.fn()
const insertPaymentMock = vi.fn()
const insertLedgerMock = vi.fn()
const updatePaymentMock = vi.fn()
const updateLedgerMock = vi.fn()

vi.mock('@/lib/logger', () => ({ logServer: vi.fn() }))
vi.mock('@/server/repositories/provider-billing', () => ({
  findProviderSubscriptionByMerchantSubscriptionId: (...args: unknown[]) => findSubscriptionMock(...args),
  applyProviderSubscriptionEventUpdate: (...args: unknown[]) => applySubscriptionMock(...args),
  findProviderPaymentByOrder: (...args: unknown[]) => findPaymentMock(...args),
  insertProviderPayment: (...args: unknown[]) => insertPaymentMock(...args),
  insertProviderLedgerEntry: (...args: unknown[]) => insertLedgerMock(...args),
  updateProviderPayment: (...args: unknown[]) => updatePaymentMock(...args),
  updateProviderLedgerByPayment: (...args: unknown[]) => updateLedgerMock(...args),
}))

const subscription = {
  id: 'sub-1',
  subscriber_id: 'user-1',
  creator_id: 'creator-1',
  provider: 'phonepe' as const,
  plan_id: 'monthly-inr',
  status: 'incomplete',
  status_reason: null,
  provider_subscription_id: null,
  merchant_subscription_id: 'MS-1',
  merchant_order_id: 'MO-1',
  provider_order_id: null,
  provider_state: 'PENDING',
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
  last_event_at: null,
  last_event_rank: 0,
  created_at: '2026-01-01T00:00:00.000Z',
} satisfies ProviderSubscriptionRow

const admin = {} as never
const eventAt = Date.parse('2026-01-01T12:00:00.000Z')

function body(event: string, extra: Record<string, unknown> = {}) {
  return phonePeWebhookSchema.parse({
    event,
    payload: {
      merchantSubscriptionId: 'MS-1',
      merchantOrderId: 'MO-SETUP',
      orderId: 'ORDER-1',
      state: 'COMPLETED',
      timestamp: eventAt,
      amount: 19900,
      ...extra,
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  findSubscriptionMock.mockResolvedValue({ data: subscription, error: null })
  applySubscriptionMock.mockResolvedValue({ data: { id: 'sub-1' }, error: null })
  findPaymentMock.mockResolvedValue({ data: null, error: null })
  insertPaymentMock.mockResolvedValue({ data: { id: 'payment-1' }, error: null })
  insertLedgerMock.mockResolvedValue({ data: null, error: null })
  updatePaymentMock.mockResolvedValue({ data: null, error: null })
  updateLedgerMock.mockResolvedValue({ data: null, error: null })
})

describe('PhonePe webhook processing', () => {
  it('activates a completed setup, records payment and ledger once, and stamps ordering', async () => {
    const { processPhonePeWebhookEvent } = await import('./phonepe-webhook')
    const outcome = await processPhonePeWebhookEvent(admin, body('subscription.setup.order.completed'), eventAt)

    expect(outcome).toBe('processed')
    expect(applySubscriptionMock.mock.calls[0][2]).toMatchObject({
      status: 'active',
      last_event_rank: stateRank('active'),
      paid_through: expect.any(String),
    })
    expect(insertPaymentMock).toHaveBeenCalledTimes(1)
    expect(insertLedgerMock).toHaveBeenCalledTimes(1)
  })

  it('ignores a stale event without rewriting the subscription', async () => {
    findSubscriptionMock.mockResolvedValue({
      data: { ...subscription, status: 'active', last_event_at: '2026-02-01T00:00:00.000Z', last_event_rank: stateRank('active') },
      error: null,
    })
    const { processPhonePeWebhookEvent } = await import('./phonepe-webhook')
    expect(await processPhonePeWebhookEvent(admin, body('subscription.paused', { state: 'PAUSED' }), eventAt)).toBe('ignored')
    expect(applySubscriptionMock).not.toHaveBeenCalled()
  })

  it('maps refund callbacks onto the original payment', async () => {
    findPaymentMock.mockResolvedValue({
      data: { id: 'payment-1', amount_minor: 19900, refunded_amount_minor: 0, state: 'paid' },
      error: null,
    })
    const { processPhonePeWebhookEvent } = await import('./phonepe-webhook')
    const refund = phonePeWebhookSchema.parse({
      event: 'pg.refund.completed',
      payload: { originalMerchantOrderId: 'MO-SETUP', amount: 5000, state: 'COMPLETED' },
    })
    expect(await processPhonePeWebhookEvent(admin, refund, eventAt)).toBe('processed')
    expect(updatePaymentMock.mock.calls[0][2]).toMatchObject({ state: 'partially_refunded', refunded_amount_minor: 5000 })
  })

  it('ignores unknown merchants instead of creating state', async () => {
    findSubscriptionMock.mockResolvedValue({ data: null, error: null })
    const { processPhonePeWebhookEvent } = await import('./phonepe-webhook')
    expect(await processPhonePeWebhookEvent(admin, body('subscription.revoked'), eventAt)).toBe('ignored')
    expect(applySubscriptionMock).not.toHaveBeenCalled()
  })

  it('does not write when a concurrent callback already advanced the row', async () => {
    applySubscriptionMock.mockResolvedValue({ data: null, error: null })
    const { processPhonePeWebhookEvent } = await import('./phonepe-webhook')
    expect(await processPhonePeWebhookEvent(admin, body('subscription.paused', { state: 'PAUSED' }), eventAt)).toBe('ignored')
    expect(insertPaymentMock).not.toHaveBeenCalled()
    expect(applySubscriptionMock.mock.calls[0][3]).toMatchObject({
      eventAt: new Date(eventAt).toISOString(),
      allowWhenPaused: true,
    })
  })
})
