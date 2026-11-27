import { createAdminClient } from '@/lib/admin'
import { getAuthContext } from '@/lib/auth'
import { getNewBillingProvider } from '@/lib/billing/config'
import type { BillingProvider } from '@/lib/billing/types'
import { logServer } from '@/lib/logger'
import {
  StripeAccountError,
  accountStatus,
  checkoutRequestSchema,
  isConnectReady,
  platformFeePercent,
} from '@/lib/monetization'
import { enforceRateLimit } from '@/lib/rate-limit'
import { canBill, getStripe, siteUrl } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { failure, success } from '@/server/http/result'
import { createPhonePeCheckout } from '@/server/modules/billing/providers/phonepe'
import {
  findBillingCustomer,
  findCreatorAccount,
  findCreatorAccountForLink,
  findMembership,
  insertCreatorAccount,
  listCreatorMemberships,
  upsertBillingCustomer,
} from '@/server/repositories/billing'

export async function createCheckout(request: Request) {
  const context = await getAuthContext()
  if (!context) return failure('Sign in to become a member.', 401)
  if (context.status !== 'ACTIVE') return failure('Your account must be active to subscribe.', 403)

  let provider: BillingProvider
  try {
    provider = getNewBillingProvider()
  } catch {
    return failure('Billing provider is not configured on this deployment.', 503)
  }
  if (provider === 'phonepe') {
    const admin = createAdminClient()
    if (!admin) return failure('Payments are not configured on this deployment.', 503)
    return createPhonePeCheckout(request, context, admin)
  }

  // Stripe remains the default and its original request path is unchanged.
  if (!canBill()) return failure('Payments are not configured on this deployment.', 503)

  const parsed = checkoutRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return failure('Invalid checkout request.', 422)

  const creatorId = parsed.data.creatorId
  const userId = context.user.id
  if (creatorId === userId) return failure('You cannot subscribe to yourself.', 422)

  const limit = await enforceRateLimit(`checkout:${userId}`, 'billing-checkout', 5, '1 m')
  if (!limit.success) return failure('Too many checkout attempts. Try again shortly.', 429)

  const stripe = getStripe()
  if (!stripe) return failure('Payments are not configured on this deployment.', 503)

  const admin = createAdminClient()
  if (!admin) return failure('Payments are not configured on this deployment.', 503)
  const [accountResult, membershipResult] = await Promise.all([
    findCreatorAccount(admin, creatorId),
    findMembership(admin, userId, creatorId),
  ])

  const membership = membershipResult.data
  if (membership && ['active', 'trialing', 'past_due'].includes(membership.status)) {
    return failure('You already have a membership with this creator.', 409)
  }
  const account = accountResult.data
  if (!account || !isConnectReady(account)) {
    return failure('This creator is not accepting memberships yet.', 409)
  }

  try {
    let customerId: string | null = null
    const { data: customerRow } = await findBillingCustomer(admin, userId)
    if (customerRow) customerId = customerRow.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: context.user.email ?? undefined,
        metadata: { user_id: userId },
      })
      customerId = customer.id
      const { error: customerError } = await upsertBillingCustomer(admin, userId, customerId)
      if (customerError) throw new Error('Unable to persist billing customer.')
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_MEMBERSHIP_MONTHLY!, quantity: 1 }],
      allow_promotion_codes: false,
      success_url: `${siteUrl()}/memberships?checkout=success`,
      cancel_url: `${siteUrl()}/memberships?checkout=canceled`,
      subscription_data: {
        application_fee_percent: platformFeePercent(),
        transfer_data: { destination: account.stripe_account_id },
        metadata: { creator_id: creatorId, subscriber_id: userId },
      },
      metadata: { creator_id: creatorId, subscriber_id: userId },
    })

    logServer('info', 'billing.checkout.started', { userId, creatorId, sessionId: session.id })
    if (!session.url) return failure('Checkout could not be created.', 502)
    return success({ url: session.url })
  } catch (error) {
    if (error instanceof StripeAccountError) return failure(error.message, 409)
    logServer('error', 'billing.checkout.failed', { userId, creatorId })
    return failure('Unable to start checkout right now.', 502)
  }
}

export async function getConnectStatus() {
  const context = await getAuthContext()
  if (!context) return failure('Sign in to view earnings.', 401)

  const admin = createAdminClient()
  if (!admin) return failure('Payments are not configured on this deployment.', 503)
  const [accountResult, membershipsResult] = await Promise.all([
    findCreatorAccount(admin, context.user.id),
    listCreatorMemberships(admin, context.user.id),
  ])
  const active = (membershipsResult.data ?? []).filter(
    (row) => row.status === 'active' || row.status === 'trialing'
  ).length

  return success({ account: accountStatus(accountResult.data ?? null), members: active })
}

export async function startConnect() {
  const context = await getAuthContext()
  if (!context) return failure('Sign in to set up payouts.', 401)
  if (context.status !== 'ACTIVE') return failure('Your account must be active to receive payouts.', 403)

  const limit = await enforceRateLimit(`connect:${context.user.id}`, 'billing-connect', 5, '1 m')
  if (!limit.success) return failure('Too many attempts. Try again shortly.', 429)

  const stripe = getStripe()
  if (!stripe) return failure('Payments are not configured on this deployment.', 503)

  const admin = createAdminClient()
  if (!admin) return failure('Payments are not configured on this deployment.', 503)
  try {
    let { data: account } = await findCreatorAccountForLink(admin, context.user.id)
    if (!account) {
      const created = await stripe.accounts.create({
        type: 'express',
        capabilities: { transfers: { requested: true } },
        metadata: { user_id: context.user.id },
      })
      const { error } = await insertCreatorAccount(admin, {
        user_id: context.user.id,
        stripe_account_id: created.id,
        details_submitted: created.details_submitted ?? false,
        charges_enabled: created.charges_enabled ?? false,
        payouts_enabled: created.payouts_enabled ?? false,
      })
      if (error) {
        logServer('error', 'billing.connect.persist_failed', { userId: context.user.id })
        return failure('Unable to save payout account.', 500)
      }
      account = { stripe_account_id: created.id, updated_at: new Date().toISOString() }
    }

    const link = await stripe.accountLinks.create({
      account: account.stripe_account_id,
      type: 'account_onboarding',
      refresh_url: `${siteUrl()}/earnings?onboarding=refresh`,
      return_url: `${siteUrl()}/earnings?onboarding=return`,
    })
    if (!link.url) return failure('Onboarding link unavailable.', 502)
    logServer('info', 'billing.connect.started', { userId: context.user.id })
    return success({ url: link.url })
  } catch {
    return failure('Unable to start payout setup.', 502)
  }
}

export async function createBillingPortal() {
  const context = await getAuthContext()
  if (!context) return failure('Sign in to manage billing.', 401)

  const limit = await enforceRateLimit(`portal:${context.user.id}`, 'billing-portal', 5, '1 m')
  if (!limit.success) return failure('Too many attempts. Try again shortly.', 429)

  const stripe = getStripe()
  if (!stripe) return failure('Payments are not configured on this deployment.', 503)

  const { data: customerRow } = await findBillingCustomer(await createClient(), context.user.id)
  if (!customerRow) return failure('No billing account found yet.', 404)

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerRow.stripe_customer_id,
      return_url: `${siteUrl()}/memberships`,
    })
    if (!portal.url) return failure('Billing portal unavailable.', 502)
    return success({ url: portal.url })
  } catch {
    return failure('Billing portal unavailable.', 502)
  }
}
