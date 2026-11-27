import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { createAdminClient } from '@/lib/admin'
import { canAdminister, type AuthContext } from '@/lib/auth'
import { refundRequestSchema } from '@/lib/billing/types'
import { logServer } from '@/lib/logger'
import { enforceRateLimit } from '@/lib/rate-limit'
import { cancelPhonePeSubscription, initiatePhonePeRefund, PhonePeApiError } from '@/lib/phonepe/client'
import { phonePeConfig } from '@/lib/phonepe/config'
import { failure, success, type ServiceResult } from '@/server/http/result'
import {
  findProviderPaymentById,
  findProviderSubscriptionById,
  insertProviderOperation,
  listProviderPaymentsBySubscriptions,
  listProviderSubscriptionsForSubscriber,
  updateProviderSubscription,
} from '@/server/repositories/provider-billing'
import { stateRank } from './phonepe-shared'

const cancelRequestSchema = z.looseObject({ creatorId: z.string().uuid().optional() })

export async function cancelPhonePeMembership(
  request: Request,
  context: AuthContext,
): Promise<ServiceResult<{ status: 'canceled' }>> {
  if (context.status !== 'ACTIVE') return failure('Your account must be active to manage billing.', 403)
  const config = phonePeConfig()
  if (!config) return failure('PhonePe payments are not configured on this deployment.', 503)

  const parsed = cancelRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return failure('Invalid cancellation request.', 422)

  const admin = createAdminClient()
  if (!admin) return failure('Payments are not configured on this deployment.', 503)

  const limit = await enforceRateLimit(`billing-cancel:${context.user.id}`, 'billing-cancel', 5, '1 m')
  if (!limit.success) return failure('Too many attempts. Try again shortly.', 429)

  const subscriptions = await listProviderSubscriptionsForSubscriber(admin, context.user.id)
  const candidates = (subscriptions.data ?? []).filter(
    (row) => !parsed.data.creatorId || row.creator_id === parsed.data.creatorId,
  )
  const subscription = candidates.find((row) => ['active', 'past_due', 'paused', 'trialing'].includes(row.status))
  if (!subscription) return failure('No active PhonePe membership found.', 404)

  try {
    await cancelPhonePeSubscription(config, subscription.merchant_subscription_id)
    const { error } = await updateProviderSubscription(admin, subscription.id, {
      status: 'canceled',
      provider_state: 'CANCEL_IN_PROGRESS',
      status_reason: 'cancelled',
      last_event_at: new Date().toISOString(),
      last_event_rank: stateRank('canceled'),
    })
    if (error) throw new Error('Unable to persist cancellation.')
    await insertProviderOperation(admin, {
      provider: 'phonepe',
      operation: 'CANCEL',
      actor_id: context.user.id,
      subscriber_id: context.user.id,
      merchant_subscription_id: subscription.merchant_subscription_id,
      idempotency_key: `cancel:${subscription.merchant_subscription_id}:${Date.now()}`,
      status: 'COMPLETED',
    })
    logServer('info', 'phonepe.membership.cancelled', { userId: context.user.id, id: subscription.id })
    return success({ status: 'canceled' })
  } catch (error) {
    const code = error instanceof PhonePeApiError ? error.code : null
    logServer('error', 'phonepe.membership.cancel_failed', { id: subscription.id, code })
    return failure('Unable to cancel this membership right now.', 502)
  }
}

export async function requestPhonePeRefund(
  request: Request,
  context: AuthContext,
): Promise<ServiceResult<{ merchantRefundId: string; state: string }>> {
  if (context.status !== 'ACTIVE') return failure('Your account must be active to request a refund.', 403)
  const parsed = refundRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return failure('Invalid refund request.', 422)

  const config = phonePeConfig()
  if (!config) return failure('PhonePe payments are not configured on this deployment.', 503)
  const admin = createAdminClient()
  if (!admin) return failure('Payments are not configured on this deployment.', 503)

  const limit = await enforceRateLimit(`billing-refund:${context.user.id}`, 'billing-refund', 5, '1 m')
  if (!limit.success) return failure('Too many attempts. Try again shortly.', 429)

  const payment = await findProviderPaymentById(admin, parsed.data.paymentId)
  if (!payment.data) return failure('Payment not found.', 404)
  const subscription = await findProviderSubscriptionById(admin, payment.data.subscription_id)
  if (!subscription.data) return failure('Payment not found.', 404)
  if (subscription.data.creator_id !== context.user.id && !canAdminister(context)) {
    return failure('Only the creator or an administrator can refund this payment.', 403)
  }

  const total = payment.data.amount_minor
  const alreadyRefunded = Number(payment.data.refunded_amount_minor ?? 0)
  const remaining = Math.max(0, total - alreadyRefunded)
  if (!['paid', 'partially_refunded'].includes(payment.data.state) || remaining <= 0) {
    return failure('This payment cannot be refunded.', 409)
  }
  if (parsed.data.amountMinor > remaining) return failure('Refund amount exceeds the remaining total.', 422)

  const merchantRefundId = `RF-${Date.now().toString(36)}-${randomUUID().replace(/-/g, '').slice(0, 12)}`
  try {
    const result = await initiatePhonePeRefund(config, {
      merchantRefundId,
      originalMerchantOrderId: payment.data.merchant_order_id,
      amount: parsed.data.amountMinor,
    })
    await insertProviderOperation(admin, {
      provider: 'phonepe',
      operation: 'REFUND',
      actor_id: context.user.id,
      subscriber_id: subscription.data.subscriber_id,
      merchant_subscription_id: subscription.data.merchant_subscription_id,
      idempotency_key: merchantRefundId,
      status: 'STARTED',
    })
    return success({ merchantRefundId, state: result.state ?? 'PENDING' })
  } catch (error) {
    const code = error instanceof PhonePeApiError ? error.code : null
    logServer('error', 'phonepe.refund.start_failed', { paymentId: payment.data.id, code })
    return failure('Unable to start this refund right now.', 502)
  }
}

export async function getPhonePeBillingHistory(context: AuthContext) {
  if (context.status !== 'ACTIVE') return failure('Your account must be active to view billing history.', 403)
  const admin = createAdminClient()
  if (!admin) return failure('Payments are not configured on this deployment.', 503)

  const subscriptions = await listProviderSubscriptionsForSubscriber(admin, context.user.id)
  if (subscriptions.error) return failure('Unable to load billing history.', 502)
  const rows = subscriptions.data ?? []
  const payments = await listProviderPaymentsBySubscriptions(admin, rows.map((row) => row.id))
  if (payments.error) return failure('Unable to load billing history.', 502)
  const subscriptionById = new Map(rows.map((row) => [row.id, row]))

  return success({
    payments: (payments.data ?? []).map((payment) => {
      const subscription = subscriptionById.get(payment.subscription_id)
      return {
        id: payment.id,
        creatorId: subscription?.creator_id ?? null,
        subscriptionId: payment.subscription_id,
        kind: payment.kind,
        amountMinor: payment.amount_minor,
        currency: payment.currency,
        state: payment.state,
        refundedAmountMinor: payment.refunded_amount_minor,
        paidAt: payment.paid_at,
        createdAt: payment.created_at,
      }
    }),
  })
}
