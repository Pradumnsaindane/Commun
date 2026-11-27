import type { SupabaseClient } from '@supabase/supabase-js'
import { logServer } from '@/lib/logger'
import type { PhonePeWebhookPayload } from '@/lib/phonepe/webhook'
import {
  applyProviderSubscriptionEventUpdate,
  findProviderPaymentByOrder,
  findProviderSubscriptionByMerchantSubscriptionId,
  insertProviderLedgerEntry,
  insertProviderPayment,
  updateProviderLedgerByPayment,
  updateProviderPayment,
  type ProviderSubscriptionRow,
} from '@/server/repositories/provider-billing'
import {
  canApplyPhonePeState,
  feeSplit,
  mapPhonePeState,
  nextPaidThrough,
  normalizeFrequency,
  type PhonePeStateUpdate,
} from './phonepe-shared'

export type PhonePeProcessingOutcome = 'processed' | 'ignored'

function iso(ms: number): string {
  return new Date(ms).toISOString()
}

/** Records a provider payment once and links a normalized ledger entry. */
async function recordPayment(
  admin: SupabaseClient,
  subscription: ProviderSubscriptionRow,
  payload: PhonePeWebhookPayload,
  eventAtMs: number,
  kind: 'SETUP' | 'REDEMPTION',
  state: 'paid' | 'failed',
): Promise<void> {
  const merchantOrderId = payload.payload.merchantOrderId
  if (!merchantOrderId) return
  const existing = await findProviderPaymentByOrder(admin, merchantOrderId)
  if (existing.data) return

  const detail = payload.payload.paymentDetails?.[0]
  const amount = payload.payload.amount ?? detail?.amount ?? detail?.payableAmount ?? subscription.amount_minor
  const currency = (payload.payload.currency ?? subscription.currency).toUpperCase()
  const insertedPayment = await insertProviderPayment(admin, {
    provider: 'phonepe',
    subscription_id: subscription.id,
    merchant_order_id: merchantOrderId,
    provider_order_id: payload.payload.orderId ?? null,
    transaction_id: detail?.transactionId ?? null,
    kind,
    amount_minor: Math.max(0, Math.round(amount)),
    currency,
    state,
    refunded_amount_minor: 0,
    paid_at: state === 'paid' ? iso(eventAtMs) : null,
  })

  let paymentId = insertedPayment.data?.id as string | undefined
  if (insertedPayment.error && insertedPayment.error.code !== '23505') {
    logServer('error', 'phonepe.payment.insert_failed', { merchantOrderId })
    return
  }
  if (!paymentId) {
    const raced = await findProviderPaymentByOrder(admin, merchantOrderId)
    paymentId = raced.data?.id
  }
  if (!paymentId || state !== 'paid') return

  const split = feeSplit(Math.max(0, Math.round(amount)))
  const ledger = await insertProviderLedgerEntry(admin, {
    creator_id: subscription.creator_id,
    subscription_id: subscription.id,
    payment_id: paymentId,
    provider: 'phonepe',
    gross_amount_minor: split.gross,
    platform_fee_minor: split.fee,
    net_amount_minor: split.net,
    currency,
    status: 'paid',
  })
  if (ledger.error && ledger.error.code !== '23505') {
    logServer('error', 'phonepe.ledger.insert_failed', { merchantOrderId })
  }
}

async function applySubscriptionEvent(
  admin: SupabaseClient,
  subscription: ProviderSubscriptionRow,
  payload: PhonePeWebhookPayload,
  event: string,
  eventAtMs: number,
): Promise<PhonePeProcessingOutcome> {
  const update: PhonePeStateUpdate | null = mapPhonePeState(event, payload.payload.state)
  if (!update) return 'ignored'
  if (!canApplyPhonePeState(subscription, update, event, eventAtMs)) return 'ignored'

  const patch: Record<string, unknown> = {
    status: update.status,
    provider_state: payload.payload.state ?? null,
    last_event_at: iso(eventAtMs),
    last_event_rank: update.rank,
  }
  if (update.reason) patch.status_reason = update.reason

  const providerSubscriptionId =
    payload.payload.subscriptionId ?? payload.payload.paymentFlow?.subscriptionId ?? null
  if (providerSubscriptionId) patch.provider_subscription_id = providerSubscriptionId

  const isSetupCompleted = event === 'subscription.setup.order.completed' && payload.payload.state === 'COMPLETED'
  const isRenewalCompleted =
    event === 'subscription.redemption.order.completed' || event === 'subscription.redemption.transaction.completed'
  if (isSetupCompleted || isRenewalCompleted) {
    const periodEnd = nextPaidThrough(subscription, normalizeFrequency(subscription.frequency), eventAtMs)
    patch.paid_through = periodEnd
    patch.current_period_end = periodEnd
    patch.next_renewal_at = periodEnd
  }
  if (event === 'subscription.paused') {
    patch.paused_start = payload.payload.pauseStartDate ? iso(payload.payload.pauseStartDate) : null
    patch.paused_end = payload.payload.pauseEndDate ? iso(payload.payload.pauseEndDate) : null
  }
  if (event === 'subscription.unpaused') {
    patch.paused_start = null
    patch.paused_end = null
  }
  if (event === 'subscription.cancelled' || event === 'subscription.revoked') {
    patch.cancel_at_period_end = false
  }

  const applied = await applyProviderSubscriptionEventUpdate(admin, subscription.id, patch, {
    eventAt: iso(eventAtMs),
    rank: update.rank,
    allowWhenPaused: update.status === 'paused' || event === 'subscription.unpaused',
  })
  if (applied.error) {
    logServer('error', 'phonepe.subscription.update_failed', { id: subscription.id, event })
    throw new Error('Unable to persist PhonePe subscription state.')
  }
  // A concurrent callback may have advanced the row after it was read. The
  // conditional UPDATE returns no row in that case; the newer state wins.
  if (!applied.data) return 'ignored'

  if (isSetupCompleted) {
    await recordPayment(admin, subscription, payload, eventAtMs, 'SETUP', 'paid')
  } else if (isRenewalCompleted) {
    await recordPayment(admin, subscription, payload, eventAtMs, 'REDEMPTION', 'paid')
  } else if (
    event === 'subscription.redemption.order.failed' ||
    event === 'subscription.redemption.transaction.failed'
  ) {
    await recordPayment(admin, subscription, payload, eventAtMs, 'REDEMPTION', 'failed')
  }

  return 'processed'
}

async function processRefundEvent(
  admin: SupabaseClient,
  payload: PhonePeWebhookPayload,
  event: string,
): Promise<PhonePeProcessingOutcome> {
  const merchantOrderId = payload.payload.originalMerchantOrderId
  if (!merchantOrderId || event !== 'pg.refund.completed') return 'ignored'
  const payment = await findProviderPaymentByOrder(admin, merchantOrderId)
  if (!payment.data) {
    logServer('warn', 'phonepe.refund.unmapped', { merchantOrderId })
    return 'ignored'
  }

  const amount = payload.payload.amount ?? 0
  if (!Number.isFinite(amount) || amount <= 0) return 'ignored'
  const total = payment.data.amount_minor
  const refunded = Math.min(total, Number(payment.data.refunded_amount_minor ?? 0) + Math.round(amount))
  if (refunded <= 0) return 'ignored'
  const status = refunded >= total ? 'refunded' : 'partially_refunded'

  const { error } = await updateProviderPayment(admin, payment.data.id, { state: status, refunded_amount_minor: refunded })
  if (error) {
    logServer('error', 'phonepe.refund.update_failed', { paymentId: payment.data.id })
    throw new Error('Unable to persist PhonePe refund.')
  }
  await updateProviderLedgerByPayment(admin, payment.data.id, { status })
  return 'processed'
}

export async function processPhonePeWebhookEvent(
  admin: SupabaseClient,
  body: PhonePeWebhookPayload,
  eventAtMs: number,
): Promise<PhonePeProcessingOutcome> {
  const event = body.event
  const payload = body.payload
  const merchantSubscriptionId = payload.merchantSubscriptionId ?? payload.paymentFlow?.merchantSubscriptionId

  if (event === 'pg.refund.completed' || event === 'pg.refund.failed') {
    return processRefundEvent(admin, body, event)
  }

  if (!merchantSubscriptionId) {
    logServer('warn', 'phonepe.webhook.unmapped', { event })
    return 'ignored'
  }
  const subscription = await findProviderSubscriptionByMerchantSubscriptionId(admin, merchantSubscriptionId)
  if (!subscription.data) {
    logServer('warn', 'phonepe.webhook.unmapped', { event, merchantSubscriptionId })
    return 'ignored'
  }
  return applySubscriptionEvent(admin, subscription.data, body, event, eventAtMs)
}
