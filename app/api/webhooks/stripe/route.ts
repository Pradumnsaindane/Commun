import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/admin'
import { splitGross } from '@/lib/monetization'
import { getStripe, stripeSecretKey, stripeWebhookSecret } from '@/lib/stripe'
import { logServer } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SubscriptionLike = {
  id: string
  status: string
  cancel_at_period_end?: boolean
  metadata?: Record<string, string>
  items?: { data?: Array<{ price?: { id?: string } | null; current_period_end?: number | null }> }
  current_period_end?: number | null
}

type AdminClient = ReturnType<typeof createAdminClient>

function readPeriodEnd(subscription: SubscriptionLike): string | null {
  const fromItems = subscription.items?.data?.[0]?.current_period_end
  const value = fromItems ?? subscription.current_period_end ?? null
  return value ? new Date(value * 1000).toISOString() : null
}

function priceIdOf(subscription: SubscriptionLike): string {
  return subscription.items?.data?.[0]?.price?.id ?? ''
}

async function resolveMembership(admin: AdminClient, subscription: SubscriptionLike): Promise<{ creatorId: string | null; subscriberId: string | null }> {
  const creatorId = subscription.metadata?.creator_id ?? null
  const subscriberId = subscription.metadata?.subscriber_id ?? null
  if (creatorId && subscriberId) return { creatorId, subscriberId }
  const { data } = await admin.from('memberships').select('creator_id,subscriber_id').eq('stripe_subscription_id', subscription.id).maybeSingle()
  return { creatorId: data?.creator_id ?? null, subscriberId: data?.subscriber_id ?? null }
}

async function syncMembership(admin: AdminClient, subscription: SubscriptionLike, outcome: 'upsert' | 'cancelled') {
  const { creatorId, subscriberId } = await resolveMembership(admin, subscription)
  if (!creatorId || !subscriberId) {
    logServer('warn', 'stripe.membership.unmapped', { subscriptionId: subscription.id })
    return
  }
  const payload = {
    subscriber_id: subscriberId,
    creator_id: creatorId,
    status: outcome === 'cancelled' ? 'canceled' : subscription.status,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceIdOf(subscription),
    current_period_end: outcome === 'cancelled' ? null : readPeriodEnd(subscription),
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    updated_at: new Date().toISOString(),
  }
  const { data: existing } = await admin.from('memberships').select('id,stripe_subscription_id').eq('subscriber_id', subscriberId).eq('creator_id', creatorId).maybeSingle()
  if (existing) {
    if (existing.stripe_subscription_id !== subscription.id && outcome !== 'cancelled') {
      await admin.from('memberships').delete().eq('id', existing.id)
      await admin.from('memberships').insert({ ...payload, created_at: new Date().toISOString() })
    } else {
      await admin.from('memberships').update(payload).eq('id', existing.id)
    }
    return
  }
  const { error } = await admin.from('memberships').insert(payload)
  if (error && error.code !== '23505') logServer('error', 'stripe.membership.insert_failed', { subscriptionId: subscription.id, code: error.code ?? 'unknown' })
}

async function syncCustomer(admin: AdminClient, customerId: string | null, userId: string | null) {
  if (!customerId || !userId) return
  await admin.from('billing_customers').upsert(
    { user_id: userId, stripe_customer_id: customerId, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
}

function subscriptionIdOf(session: Stripe.Checkout.Session): string | null {
  const raw = session.subscription
  if (!raw) return null
  return typeof raw === 'string' ? raw : raw.id
}

function customerIdOf(session: Stripe.Checkout.Session): string | null {
  const raw = session.customer
  if (!raw) return null
  return typeof raw === 'string' ? raw : raw.id
}

function subscriptionIdOfInvoice(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as unknown as { subscription?: string | Stripe.Subscription | null }).subscription
  if (legacy) return typeof legacy === 'string' ? legacy : legacy.id
  const parent = (invoice as unknown as { parent?: { subscription_details?: { subscription?: string | Stripe.Subscription | null } | null } }).parent
  const nested = parent?.subscription_details?.subscription
  if (nested) return typeof nested === 'string' ? nested : nested.id
  return null
}

async function recordEarning(admin: AdminClient, invoice: Stripe.Invoice) {
  const subscriptionId = subscriptionIdOfInvoice(invoice)
  if (!subscriptionId) return
  const { data: membership } = await admin.from('memberships').select('id,creator_id').eq('stripe_subscription_id', subscriptionId).maybeSingle()
  if (!membership) {
    logServer('warn', 'stripe.earning.unmapped_invoice', { invoiceId: invoice.id })
    return
  }
  const gross = invoice.amount_paid ?? invoice.amount_due ?? 0
  const { platformFee, creatorNet } = splitGross(gross)
  const { error } = await admin.from('earnings').insert({
    creator_id: membership.creator_id,
    membership_id: membership.id,
    stripe_invoice_id: invoice.id,
    gross_amount: gross,
    platform_fee_amount: platformFee,
    net_amount: creatorNet,
    currency: invoice.currency ?? 'usd',
    status: 'paid',
    period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
    period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
  })
  if (error && error.code !== '23505') logServer('error', 'stripe.earning.insert_failed', { invoiceId: invoice.id, code: error.code ?? 'unknown' })
}

async function syncConnectAccount(admin: AdminClient, account: Stripe.Account) {
  const { error } = await admin.from('creator_accounts').update({
    details_submitted: Boolean(account.details_submitted),
    charges_enabled: Boolean(account.charges_enabled),
    payouts_enabled: Boolean(account.payouts_enabled),
    updated_at: new Date().toISOString(),
  }).eq('stripe_account_id', account.id)
  if (error) logServer('warn', 'stripe.account.update_failed', { accountId: account.id, code: error.code ?? 'unknown' })
}

async function processEvent(event: Stripe.Event) {
  const admin = createAdminClient()
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const subscriptionId = subscriptionIdOf(session)
      const stripe = getStripe()
      if (subscriptionId && stripe) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as SubscriptionLike
        await syncMembership(admin, subscription, 'upsert')
        await syncCustomer(admin, customerIdOf(session), session.metadata?.subscriber_id ?? null)
      }
      return
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      await syncMembership(admin, event.data.object as unknown as SubscriptionLike, 'upsert')
      return
    }
    case 'customer.subscription.deleted': {
      await syncMembership(admin, event.data.object as unknown as SubscriptionLike, 'cancelled')
      return
    }
    case 'invoice.paid': {
      await recordEarning(admin, event.data.object as Stripe.Invoice)
      return
    }
    case 'invoice.payment_failed': {
      logServer('warn', 'stripe.invoice.payment_failed', { invoiceId: (event.data.object as Stripe.Invoice).id })
      return
    }
    case 'account.updated': {
      await syncConnectAccount(admin, event.data.object as Stripe.Account)
      return
    }
    default:
      return
  }
}

export async function POST(request: Request) {
  if (!stripeSecretKey() || !stripeWebhookSecret()) {
    return Response.json({ error: 'Payments are not configured on this deployment.' }, { status: 503 })
  }
  const stripe = getStripe()
  if (!stripe) return Response.json({ error: 'Payments are not configured on this deployment.' }, { status: 503 })

  const signature = request.headers.get('stripe-signature')
  if (!signature) return new Response('Missing stripe-signature', { status: 400 })

  const payload = await request.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret())
  } catch {
    logServer('warn', 'stripe.webhook.invalid_signature', {})
    return new Response('Invalid signature', { status: 400 })
  }

  const admin = createAdminClient()
  const { error: claimError } = await admin.from('stripe_webhook_events').insert({ event_id: event.id, event_type: event.type, status: 'received' })
  if (claimError && claimError.code !== '23505') {
    logServer('error', 'stripe.webhook.claim_failed', { eventId: event.id, code: claimError.code ?? 'unknown' })
    return new Response('Storage unavailable', { status: 500 })
  }
  if (claimError && claimError.code === '23505') {
    const { data: existing } = await admin.from('stripe_webhook_events').select('status').eq('event_id', event.id).maybeSingle()
    if (existing?.status === 'processed') return Response.json({ received: true, duplicate: true })
  }

  try {
    await processEvent(event)
    await admin.from('stripe_webhook_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', event.id)
    logServer('info', 'stripe.webhook.processed', { eventId: event.id, type: event.type })
    return Response.json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : 'unknown error'
    await admin.from('stripe_webhook_events').update({ status: 'failed', error: message }).eq('event_id', event.id)
    logServer('error', 'stripe.webhook.failed', { eventId: event.id, type: event.type })
    return new Response('Processing failed', { status: 500 })
  }
}