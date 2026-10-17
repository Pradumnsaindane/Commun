import { createAdminClient } from '@/lib/admin'
import { getAuthContext } from '@/lib/auth'
import { checkoutRequestSchema, StripeAccountError, isConnectReady, platformFeePercent } from '@/lib/monetization'
import { enforceRateLimit } from '@/lib/rate-limit'
import { canBill, getStripe, siteUrl } from '@/lib/stripe'
import { logServer } from '@/lib/logger'

export async function POST(request: Request) {
  const context = await getAuthContext()
  if (!context) return Response.json({ error: 'Sign in to become a member.' }, { status: 401 })
  if (context.status !== 'ACTIVE') return Response.json({ error: 'Your account must be active to subscribe.' }, { status: 403 })
  if (!canBill()) return Response.json({ error: 'Payments are not configured on this deployment.' }, { status: 503 })

  const parsed = checkoutRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid checkout request.' }, { status: 422 })
  const creatorId = parsed.data.creatorId
  const userId = context.user.id
  if (creatorId === userId) return Response.json({ error: 'You cannot subscribe to yourself.' }, { status: 422 })

  const limit = await enforceRateLimit(`checkout:${userId}`, 'billing-checkout', 5, '1 m')
  if (!limit.success) return Response.json({ error: 'Too many checkout attempts. Try again shortly.' }, { status: 429 })

  const stripe = getStripe()
  if (!stripe) return Response.json({ error: 'Payments are not configured on this deployment.' }, { status: 503 })

  const admin = createAdminClient()
  const [{ data: account }, { data: membership }] = await Promise.all([
    admin.from('creator_accounts').select('stripe_account_id,details_submitted,charges_enabled,payouts_enabled').eq('user_id', creatorId).maybeSingle(),
    admin.from('memberships').select('id,status,stripe_subscription_id,current_period_end').eq('subscriber_id', userId).eq('creator_id', creatorId).maybeSingle(),
  ])

  if (membership && ['active', 'trialing', 'past_due'].includes(membership.status)) {
    return Response.json({ error: 'You already have a membership with this creator.' }, { status: 409 })
  }
  if (!isConnectReady(account)) {
    return Response.json({ error: 'This creator is not accepting memberships yet.' }, { status: 409 })
  }

  try {
    let customerId: string | null = null
    const { data: customerRow } = await admin.from('billing_customers').select('stripe_customer_id').eq('user_id', userId).maybeSingle()
    if (customerRow) customerId = customerRow.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: context.user.email ?? undefined,
        metadata: { user_id: userId },
      })
      customerId = customer.id
      await admin.from('billing_customers').upsert({ user_id: userId, stripe_customer_id: customerId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    }

    const price = process.env.STRIPE_PRICE_MEMBERSHIP_MONTHLY!
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: false,
      success_url: `${siteUrl()}/memberships?checkout=success`,
      cancel_url: `${siteUrl()}/memberships?checkout=canceled`,
      subscription_data: {
        application_fee_percent: platformFeePercent(),
        transfer_data: { destination: account!.stripe_account_id },
        metadata: { creator_id: creatorId, subscriber_id: userId },
      },
      metadata: { creator_id: creatorId, subscriber_id: userId },
    })

    logServer('info', 'billing.checkout.started', { userId, creatorId, sessionId: session.id })
    if (!session.url) return Response.json({ error: 'Checkout could not be created.' }, { status: 502 })
    return Response.json({ url: session.url })
  } catch (error) {
    if (error instanceof StripeAccountError) return Response.json({ error: error.message }, { status: 409 })
    logServer('error', 'billing.checkout.failed', { userId, creatorId })
    return Response.json({ error: 'Unable to start checkout right now.' }, { status: 502 })
  }
}