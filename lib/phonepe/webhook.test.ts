import { createHash, createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  derivePhonePeEventId,
  isSupportedPhonePeEvent,
  phonePeEventTimestamp,
  phonePeWebhookSchema,
  PHONEPE_WEBHOOK_MAX_BYTES,
  verifyPhonePeWebhook,
} from './webhook'

const raw = JSON.stringify({
  event: 'subscription.setup.order.completed',
  payload: { merchantSubscriptionId: 'MS-1', state: 'COMPLETED', timestamp: 1_700_000_000_000, unexpected: 'kept' },
})

describe('PhonePe webhook verification', () => {
  it('accepts a valid HMAC over the exact raw body', () => {
    const signature = createHmac('sha256', 'hook-secret').update(raw).digest('base64')
    const headers = new Headers({
      'x-phonepe-checksum-key-id': 'key-1',
      'x-phonepe-checksum-signature': signature,
    })
    expect(verifyPhonePeWebhook(headers, raw, { method: 'hmac', keyId: 'key-1', secret: 'hook-secret' })).toEqual({ ok: true, method: 'hmac' })
    expect(verifyPhonePeWebhook(headers, `${raw} `, { method: 'hmac', keyId: 'key-1', secret: 'hook-secret' }).ok).toBe(false)
    expect(verifyPhonePeWebhook(new Headers(), raw, { method: 'hmac', keyId: 'key-1', secret: 'hook-secret' }).ok).toBe(false)

    const hexHeaders = new Headers({
      'x-phonepe-checksum-key-id': 'key-1',
      'x-phonepe-checksum-signature': createHmac('sha256', 'hook-secret').update(raw).digest('hex'),
    })
    expect(verifyPhonePeWebhook(hexHeaders, raw, { method: 'hmac', keyId: 'key-1', secret: 'hook-secret' }).ok).toBe(true)
  })

  it('accepts SHA basic auth in hex and base64', () => {
    const digest = createHash('sha256').update('merchant:password')
    expect(
      verifyPhonePeWebhook(new Headers({ authorization: digest.copy().digest('hex') }), raw, {
        method: 'sha', username: 'merchant', password: 'password', encoding: 'hex',
      }).ok,
    ).toBe(true)
    expect(
      verifyPhonePeWebhook(new Headers({ authorization: digest.copy().digest('base64') }), raw, {
        method: 'sha', username: 'merchant', password: 'password', encoding: 'base64',
      }).ok,
    ).toBe(true)
  })

  it('validates loosely but rejects missing event or payload', () => {
    const parsed = phonePeWebhookSchema.safeParse(JSON.parse(raw))
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.payload).toMatchObject({ unexpected: 'kept' })
    expect(phonePeWebhookSchema.safeParse({ payload: {} }).success).toBe(false)
    expect(phonePeWebhookSchema.safeParse({ event: 'x' }).success).toBe(false)
  })

  it('derives stable dedupe ids and normalizes timestamps', () => {
    const parsed = phonePeWebhookSchema.parse(JSON.parse(raw))
    expect(derivePhonePeEventId('subscription.setup.order.completed', parsed, 1_700_000_000_000)).toBe(
      derivePhonePeEventId('subscription.setup.order.completed', parsed, 1_700_000_000_000),
    )
    expect(derivePhonePeEventId('subscription.setup.order.completed', parsed, 1_700_000_000_000)).not.toBe(
      derivePhonePeEventId('subscription.setup.order.completed', parsed, 1_700_000_000_001),
    )
    expect(phonePeEventTimestamp(parsed)).toBe(1_700_000_000_000)
    const seconds = phonePeWebhookSchema.parse({ event: 'x', payload: { timestamp: 1_700_000_000 } })
    expect(phonePeEventTimestamp(seconds)).toBe(1_700_000_000_000)
    const stringEpoch = phonePeWebhookSchema.parse({ event: 'x', payload: { paymentFlow: { notifiedAt: '1622539751586' } } })
    expect(phonePeEventTimestamp(stringEpoch)).toBe(1_622_539_751_586)
    expect(PHONEPE_WEBHOOK_MAX_BYTES).toBeGreaterThan(0)
    expect(isSupportedPhonePeEvent('subscription.revoked')).toBe(true)
    expect(isSupportedPhonePeEvent('made.up.event')).toBe(false)
  })

  it('dedupes refund retries by refund id even when the raw callback changes', () => {
    const first = phonePeWebhookSchema.parse({
      event: 'pg.refund.completed',
      payload: { merchantRefundId: 'RF-1', originalMerchantOrderId: 'MO-1', amount: 5000, state: 'COMPLETED', timestamp: 1 },
    })
    const retry = phonePeWebhookSchema.parse({
      event: 'pg.refund.completed',
      payload: {
        merchantRefundId: 'RF-1',
        originalMerchantOrderId: 'MO-1',
        amount: 5000,
        state: 'COMPLETED',
        timestamp: 2,
        extraProviderField: 'retry',
      },
    })
    expect(derivePhonePeEventId('pg.refund.completed', first, 1)).toBe(
      derivePhonePeEventId('pg.refund.completed', retry, 2),
    )
    const secondRefund = phonePeWebhookSchema.parse({
      event: 'pg.refund.completed',
      payload: { merchantRefundId: 'RF-2', originalMerchantOrderId: 'MO-1', amount: 5000, state: 'COMPLETED' },
    })
    expect(derivePhonePeEventId('pg.refund.completed', first, 1)).not.toBe(
      derivePhonePeEventId('pg.refund.completed', secondRefund, 1),
    )
  })
})
