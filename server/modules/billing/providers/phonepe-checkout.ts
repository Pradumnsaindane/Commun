import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { checkoutRequestSchema, type BillingPlanCycle } from '@/lib/billing/types'
import type { AuthContext } from '@/lib/auth'
import { enforceRateLimit } from '@/lib/rate-limit'
import { logServer } from '@/lib/logger'
import {
  getPhonePeAccessToken,
  PhonePeApiError,
  setupPhonePeSubscription,
  type PhonePeSetupInput,
} from '@/lib/phonepe/client'
import { phonePeConfig } from '@/lib/phonepe/config'
import { failure, success, type ServiceResult } from '@/server/http/result'
import { findMembership } from '@/server/repositories/billing'
import {
  findActiveProviderSubscription,
  findBillingPlan,
  findCreatorPaymentProfile,
  insertProviderOperation,
  insertProviderSubscription,
  updateProviderSubscription,
} from '@/server/repositories/provider-billing'

function merchantId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${randomUUID().replace(/-/g, '').slice(0, 12)}`
}

export async function createPhonePeCheckout(
  request: Request,
  context: AuthContext,
  admin: SupabaseClient,
): Promise<ServiceResult<{ url: string }>> {
  const config = phonePeConfig()
  if (!config) return failure('PhonePe payments are not configured on this deployment.', 503)

  const parsed = checkoutRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return failure('Invalid checkout request.', 422)

  const creatorId = parsed.data.creatorId
  const userId = context.user.id
  if (creatorId === userId) return failure('You cannot subscribe to yourself.', 422)

  const limit = await enforceRateLimit(`checkout:${userId}`, 'billing-checkout', 5, '1 m')
  if (!limit.success) return failure('Too many checkout attempts. Try again shortly.', 429)

  const [planResult, creatorResult, stripeMembershipResult, providerMembershipResult] = await Promise.all([
    findBillingPlan(admin, parsed.data.planId),
    findCreatorPaymentProfile(admin, creatorId, 'phonepe'),
    findMembership(admin, userId, creatorId),
    findActiveProviderSubscription(admin, userId, creatorId),
  ])

  const stripeStatus = stripeMembershipResult.data?.status ?? ''
  if (['active', 'trialing', 'past_due'].includes(stripeStatus) || providerMembershipResult.data) {
    return failure('You already have a membership with this creator.', 409)
  }

  const plan = planResult.data
  if (!plan || !plan.active || plan.provider === 'stripe') {
    return failure('Membership plans are not configured for PhonePe.', 503)
  }
  if (plan.currency.toUpperCase() !== 'INR') return failure('PhonePe plans must use INR.', 503)
  if (creatorResult.data?.status !== 'ACTIVE') {
    return failure('This creator is not accepting memberships yet.', 409)
  }

  const cycle: BillingPlanCycle = plan.cycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY'
  const maxAmount = plan.max_amount_minor ?? plan.amount_minor
  if (maxAmount <= 0 || maxAmount < plan.amount_minor) {
    return failure('Membership plans are not configured for PhonePe.', 503)
  }

  const setupAmount = plan.auth_workflow === 'PENNY_DROP' ? 200 : plan.amount_minor
  if (plan.auth_workflow === 'PENNY_DROP' && setupAmount !== 200) {
    return failure('Membership plans are not configured for PhonePe.', 503)
  }
  if (plan.auth_workflow === 'TRANSACTION' && setupAmount < 100) {
    return failure('Membership plans are not configured for PhonePe.', 503)
  }

  const merchantSubscriptionId = merchantId('MS')
  const merchantOrderId = merchantId('MO')
  const inserted = await insertProviderSubscription(admin, {
    subscriber_id: userId,
    creator_id: creatorId,
    provider: 'phonepe',
    plan_id: plan.id,
    status: 'incomplete',
    merchant_subscription_id: merchantSubscriptionId,
    merchant_order_id: merchantOrderId,
    amount_minor: plan.amount_minor,
    max_amount_minor: maxAmount,
    currency: 'INR',
    frequency: cycle,
    provider_state: 'PENDING',
  })
  if (inserted.error || !inserted.data) {
    logServer('error', 'phonepe.checkout.persist_failed', { userId, creatorId })
    return failure('Unable to start checkout right now.', 502)
  }

  const input: PhonePeSetupInput = {
    merchantOrderId,
    amount: setupAmount,
    expireAt: Date.now() + config.paymentExpiryMinutes * 60_000,
    paymentFlow: {
      type: 'SUBSCRIPTION_SETUP',
      merchantSubscriptionId,
      authWorkflowType: plan.auth_workflow === 'PENNY_DROP' ? 'PENNY DROP' : 'TRANSACTION',
      amountType: 'FIXED',
      maxAmount,
      frequency: cycle,
      paymentMode: { type: 'UPI_INTENT', targetApp: config.upiTargetApp },
    },
    deviceContext: { deviceOS: config.deviceOs },
    metaInfo: {
      udf1: userId,
      udf2: creatorId,
      udf3: plan.id,
      udf4: merchantSubscriptionId,
      udf5: merchantOrderId,
    },
  }

  try {
    await getPhonePeAccessToken(config)
    const setup = await setupPhonePeSubscription(config, input)
    const { error: updateError } = await updateProviderSubscription(admin, inserted.data.id, {
      provider_order_id: setup.orderId,
      provider_state: setup.state,
    })
    if (updateError) throw new Error('Unable to persist PhonePe order.')
    await insertProviderOperation(admin, {
      provider: 'phonepe',
      operation: 'SETUP',
      actor_id: userId,
      subscriber_id: userId,
      merchant_subscription_id: merchantSubscriptionId,
      idempotency_key: merchantOrderId,
      status: 'STARTED',
    })
    logServer('info', 'phonepe.checkout.started', { userId, creatorId, merchantOrderId })
    return success({ url: setup.intentUrl })
  } catch (error) {
    const code = error instanceof PhonePeApiError ? error.code : null
    logServer('error', 'phonepe.checkout.failed', { userId, creatorId, code })
    return failure('Unable to start checkout right now.', 502)
  }
}
