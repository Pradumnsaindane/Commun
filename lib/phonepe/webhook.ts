import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { phonePeWebhookConfig, type PhonePeWebhookConfig } from '@/lib/phonepe/config'

export const PHONEPE_WEBHOOK_MAX_BYTES = 256 * 1024

export const PHONEPE_WEBHOOK_EVENTS = [
  'subscription.setup.order.completed',
  'subscription.setup.order.failed',
  'subscription.paused',
  'subscription.unpaused',
  'subscription.revoked',
  'subscription.cancelled',
  'subscription.notification.completed',
  'subscription.notification.failed',
  'subscription.redemption.order.completed',
  'subscription.redemption.order.failed',
  'subscription.redemption.transaction.completed',
  'subscription.redemption.transaction.failed',
  'pg.refund.completed',
  'pg.refund.failed',
] as const
export type PhonePeWebhookEvent = (typeof PHONEPE_WEBHOOK_EVENTS)[number]

// PhonePe samples inconsistently encode epoch values as numbers or strings.
// Coerce both forms so a valid callback is not rejected by deserialization.
const epochNumber = z.union([z.number().finite(), z.string().regex(/^\d+$/)]).transform((value) => Number(value))
const optionalEpoch = epochNumber.optional()
const nullableOptionalEpoch = epochNumber.nullable().optional()

const paymentDetailSchema = z.looseObject({
  transactionId: z.string().optional(),
  paymentMode: z.string().optional(),
  timestamp: optionalEpoch,
  amount: z.number().finite().optional(),
  payableAmount: z.number().finite().optional(),
  state: z.string().optional(),
  errorCode: z.string().optional(),
  detailedErrorCode: z.string().optional(),
  rail: z.looseObject({ utr: z.string().optional() }).optional(),
})

const payloadSchema = z.looseObject({
  merchantId: z.string().optional(),
  merchantOrderId: z.string().optional(),
  merchantSubscriptionId: z.string().optional(),
  orderId: z.string().optional(),
  subscriptionId: z.string().optional(),
  state: z.string().optional(),
  amount: z.number().finite().optional(),
  currency: z.string().optional(),
  expireAt: optionalEpoch,
  timestamp: optionalEpoch,
  errorCode: z.string().optional(),
  detailedErrorCode: z.string().optional(),
  merchantRefundId: z.string().optional(),
  originalMerchantOrderId: z.string().optional(),
  refundId: z.string().optional(),
  pauseStartDate: nullableOptionalEpoch,
  pauseEndDate: nullableOptionalEpoch,
  paymentFlow: z.looseObject({
    type: z.string().optional(),
    merchantSubscriptionId: z.string().optional(),
    subscriptionId: z.string().optional(),
    state: z.string().optional(),
    authWorkflowType: z.string().optional(),
    amountType: z.string().optional(),
    maxAmount: z.number().finite().optional(),
    frequency: z.string().optional(),
    expireAt: optionalEpoch,
    notifiedAt: optionalEpoch,
  }).optional(),
  paymentDetails: z.array(paymentDetailSchema).optional(),
})

/** Loose by design: PhonePe explicitly advises against strict deserialization. */
export const phonePeWebhookSchema = z.looseObject({
  event: z.string().min(1),
  // Deprecated but still sent by some integrations; never trusted for routing.
  type: z.string().optional(),
  payload: payloadSchema,
})

export type PhonePeWebhookPayload = z.infer<typeof phonePeWebhookSchema>

function safeEqual(expected: string, received: string): boolean {
  const left = Buffer.from(expected)
  const right = Buffer.from(received)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function verifyPhonePeWebhook(
  headers: Headers,
  rawBody: string,
  config: PhonePeWebhookConfig | null = phonePeWebhookConfig(),
): { ok: true; method: PhonePeWebhookConfig['method'] } | { ok: false; reason: string } {
  if (!config) return { ok: false, reason: 'PhonePe webhook is not configured.' }

  if (config.method === 'hmac') {
    const keyId = headers.get('x-phonepe-checksum-key-id')
    const signature = headers.get('x-phonepe-checksum-signature')
    if (!keyId || !signature) return { ok: false, reason: 'Missing PhonePe checksum headers.' }
    if (!safeEqual(config.keyId, keyId)) return { ok: false, reason: 'Unknown PhonePe checksum key.' }
    // PhonePe documents HMAC over the raw payload but does not pin the text
    // encoding on this page. Accept both common encodings of the same digest;
    // both are compared in constant time against the received header.
    const expectedBase64 = createHmac('sha256', config.secret).update(rawBody, 'utf8').digest('base64')
    const expectedHex = createHmac('sha256', config.secret).update(rawBody, 'utf8').digest('hex')
    return safeEqual(expectedBase64, signature) || safeEqual(expectedHex, signature)
      ? { ok: true, method: 'hmac' }
      : { ok: false, reason: 'Invalid PhonePe checksum.' }
  }

  const authorization = headers.get('authorization')
  if (!authorization) return { ok: false, reason: 'Missing PhonePe authorization header.' }
  const digest = createHash('sha256').update(`${config.username}:${config.password}`, 'utf8')
  const expected = config.encoding === 'base64' ? digest.digest('base64') : digest.digest('hex')
  return safeEqual(expected, authorization)
    ? { ok: true, method: 'sha' }
    : { ok: false, reason: 'Invalid PhonePe authorization.' }
}

export function payloadHash(rawBody: string): string {
  return createHash('sha256').update(rawBody, 'utf8').digest('hex')
}

/**
 * Stable dedupe key for callbacks that do not provide an explicit event id.
 * The raw body hash is deliberately not part of the key: a provider retry may
 * add a field or change serialization while describing the same event. Refunds
 * are keyed by refund id (and amount), so a retry cannot double-count money;
 * subscription events include their provider timestamp so separate renewals
 * remain distinct.
 */
export function derivePhonePeEventId(
  event: string,
  payload: PhonePeWebhookPayload,
  eventAtMs: number,
): string {
  const p = payload.payload
  const reference =
    p.merchantSubscriptionId ?? p.merchantOrderId ?? p.orderId ?? p.merchantRefundId ?? 'unknown'

  const material = event.startsWith('pg.refund.')
    ? `refund|${p.merchantRefundId ?? p.refundId ?? p.originalMerchantOrderId ?? reference}|${p.amount ?? ''}|${p.state ?? ''}`
    : `${event}|${reference}|${p.state ?? ''}|${p.orderId ?? ''}|${eventAtMs}`

  const suffix = createHash('sha256').update(material).digest('hex').slice(0, 24)
  return `${event}:${suffix}`
}

function epochToMs(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  // PhonePe timestamps are epoch milliseconds; some callbacks use seconds.
  return value < 100_000_000_000 ? value * 1000 : value
}

/** Best available event time, normalized to milliseconds. */
export function phonePeEventTimestamp(payload: PhonePeWebhookPayload): number {
  const direct = epochToMs(payload.payload.timestamp)
  if (direct) return direct
  const transaction = epochToMs(payload.payload.paymentDetails?.[0]?.timestamp)
  if (transaction) return transaction
  const notified = epochToMs(payload.payload.paymentFlow?.notifiedAt)
  if (notified) return notified
  const pause = epochToMs(payload.payload.pauseStartDate)
  if (pause) return pause
  return Date.now()
}

export function isSupportedPhonePeEvent(event: string): event is PhonePeWebhookEvent {
  return (PHONEPE_WEBHOOK_EVENTS as readonly string[]).includes(event)
}
