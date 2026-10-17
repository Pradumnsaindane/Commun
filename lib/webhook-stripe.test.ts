import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// In-memory Supabase-admin fake with unique-key semantics, so the real
// webhook route's insert/select/update/upsert/delete chains are exercised
// exactly as they run in production.
// ---------------------------------------------------------------------------
const h = vi.hoisted(() => {
  type Row = Record<string, any>

  const UNIQUES: Record<string, string[][]> = {
    stripe_webhook_events: [['event_id']],
    memberships: [['stripe_subscription_id'], ['subscriber_id', 'creator_id']],
    billing_customers: [['user_id'], ['stripe_customer_id']],
    earnings: [['stripe_invoice_id']],
    creator_accounts: [['stripe_account_id']],
  }

  const store = new Map<string, Row[]>()
  const log: Array<{ table: string; op: string }> = []

  const stripeState = {
    secret: 'sk_test_dummy',
    whsec: 'whsec_dummy',
    constructError: false,
    retrieveError: false,
    retrievedSubscription: null as Row | null,
  }

  const stripeFake = {
    webhooks: {
      constructEvent: (payload: string, signature: string | null) => {
        if (stripeState.constructError || signature !== 'valid-sig') throw new Error('Invalid signature')
        return JSON.parse(payload)
      },
    },
    subscriptions: {
      retrieve: async (id: string) => {
        if (stripeState.retrieveError) throw new Error('stripe unavailable')
        return stripeState.retrievedSubscription ?? { id, status: 'active', metadata: {}, items: { data: [] } }
      },
    },
  }

  function rows(table: string) {
    if (!store.has(table)) store.set(table, [])
    return store.get(table)!
  }

  function isDuplicate(table: string, row: Row) {
    return rows(table).some((existing) =>
      (UNIQUES[table] ?? []).some((key) => key.every((column) => existing[column] === row[column])),
    )
  }

  function makeBuilder(table: string) {
    const state = { op: 'select', payload: null as any, filters: {} as Row }
    const matches = (row: Row) => Object.entries(state.filters).every(([key, value]) => row[key] === value)

    const exec = () => {
      log.push({ table, op: state.op })
      if (state.op === 'insert' || state.op === 'upsert') {
        const list: Row[] = Array.isArray(state.payload) ? state.payload : [state.payload]
        for (const row of list) {
          const duplicate = isDuplicate(table, row)
          if (duplicate && state.op === 'insert') return { data: null, error: { code: '23505', message: 'duplicate key' } }
          if (duplicate && state.op === 'upsert') {
            const target = rows(table).find((existing) =>
              (UNIQUES[table] ?? []).some((key) => key.every((column) => existing[column] === row[column])),
            )!
            Object.assign(target, row)
          } else {
            rows(table).push({ ...row })
          }
        }
        return { data: list, error: null }
      }
      if (state.op === 'update') {
        const found = rows(table).filter(matches)
        found.forEach((row) => Object.assign(row, state.payload))
        return { data: found[0] ?? null, error: null }
      }
      if (state.op === 'delete') {
        store.set(table, rows(table).filter((row) => !matches(row)))
        return { data: null, error: null }
      }
      const found = rows(table).filter(matches)
      return { data: found[0] ?? null, error: null }
    }

    const query: any = {}
    query.select = () => query
    query.insert = (payload: any) => { state.op = 'insert'; state.payload = payload; return query }
    query.upsert = (payload: any) => { state.op = 'upsert'; state.payload = payload; return query }
    query.update = (payload: any) => { state.op = 'update'; state.payload = payload; return query }
    query.delete = () => { state.op = 'delete'; return query }
    query.eq = (column: string, value: any) => { state.filters[column] = value; return query }
    query.maybeSingle = async () => exec()
    query.then = (resolve: any, reject: any) => Promise.resolve(exec()).then(resolve, reject)
    return query
  }

  const db = { from: (table: string) => makeBuilder(table) }

  const reset = () => {
    store.clear()
    log.length = 0
    stripeState.secret = 'sk_test_dummy'
    stripeState.whsec = 'whsec_dummy'
    stripeState.constructError = false
    stripeState.retrieveError = false
    stripeState.retrievedSubscription = null
  }

  return { db, store, log, stripeFake, stripeState, reset }
})

vi.mock('@/lib/admin', () => ({ createAdminClient: () => h.db }))
vi.mock('@/lib/stripe', () => ({
  stripeSecretKey: () => h.stripeState.secret,
  stripeWebhookSecret: () => h.stripeState.whsec,
  getStripe: () => h.stripeFake,
  isStripeConfigured: () => Boolean(h.stripeState.secret),
  hasMembershipPrice: () => true,
  canBill: () => Boolean(h.stripeState.secret),
  siteUrl: () => 'http://localhost:3000',
}))
vi.mock('@/lib/logger', () => ({ logServer: () => {} }))

import { POST as stripeWebhook } from '@/app/api/webhooks/stripe/route'

const FUTURE = Math.floor(Date.now() / 1000) + 30 * 86_400

function webhookRequest(event: unknown, signature: string | null = 'valid-sig') {
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: signature === null ? {} : { 'stripe-signature': signature },
    body: JSON.stringify(event),
  })
}

function subscriptionUpdatedEvent() {
  return {
    id: 'evt_sub_updated',
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_1',
        status: 'active',
        cancel_at_period_end: false,
        metadata: { creator_id: 'creator-1', subscriber_id: 'reader-1' },
        items: { data: [{ price: { id: 'price_monthly' }, current_period_end: FUTURE }] },
      },
    },
  }
}

function invoicePaidEvent() {
  return {
    id: 'evt_invoice_paid',
    type: 'invoice.paid',
    data: { object: { id: 'in_1', amount_paid: 1000, currency: 'usd', subscription: 'sub_1' } },
  }
}

beforeEach(() => h.reset())

describe('POST /api/webhooks/stripe', () => {
  it('rejects requests without a signature header', async () => {
    const response = await stripeWebhook(webhookRequest(subscriptionUpdatedEvent(), null))
    expect(response.status).toBe(400)
  })

  it('rejects invalid signatures before touching storage', async () => {
    const response = await stripeWebhook(webhookRequest(subscriptionUpdatedEvent(), 't=1,v1=wrong'))
    expect(response.status).toBe(400)
    expect(h.log.filter((entry) => entry.table === 'stripe_webhook_events')).toHaveLength(0)
  })

  it('returns 503 when payments are not configured', async () => {
    h.stripeState.secret = ''
    const response = await stripeWebhook(webhookRequest(subscriptionUpdatedEvent()))
    expect(response.status).toBe(503)
  })

  it('syncs an active membership from subscription metadata', async () => {
    const response = await stripeWebhook(webhookRequest(subscriptionUpdatedEvent()))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true })

    const [membership] = h.store.get('memberships') ?? []
    expect(membership).toMatchObject({
      subscriber_id: 'reader-1',
      creator_id: 'creator-1',
      status: 'active',
      stripe_subscription_id: 'sub_1',
      stripe_price_id: 'price_monthly',
      cancel_at_period_end: false,
    })
    expect(new Date(membership.current_period_end).getTime()).toBeGreaterThan(Date.now())

    const [processed] = h.store.get('stripe_webhook_events') ?? []
    expect(processed).toMatchObject({ event_id: 'evt_sub_updated', status: 'processed' })
    expect(processed.processed_at).toBeTruthy()
  })

  it('is idempotent: duplicate deliveries are acknowledged and processed once', async () => {
    const first = await stripeWebhook(webhookRequest(subscriptionUpdatedEvent()))
    const second = await stripeWebhook(webhookRequest(subscriptionUpdatedEvent()))
    expect(first.status).toBe(200)
    expect(await second.json()).toEqual({ received: true, duplicate: true })
    expect((h.store.get('memberships') ?? []).filter((row) => row.stripe_subscription_id === 'sub_1')).toHaveLength(1)
  })

  it('cancels a membership on customer.subscription.deleted', async () => {
    await stripeWebhook(webhookRequest(subscriptionUpdatedEvent()))
    const response = await stripeWebhook(
      webhookRequest({
        id: 'evt_sub_deleted',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_1',
            status: 'canceled',
            metadata: { creator_id: 'creator-1', subscriber_id: 'reader-1' },
            items: { data: [] },
          },
        },
      }),
    )
    expect(response.status).toBe(200)
    const [membership] = h.store.get('memberships') ?? []
    expect(membership.status).toBe('canceled')
    expect(membership.current_period_end).toBeNull()
  })

  it('records earnings with the platform fee split on invoice.paid', async () => {
    h.store.set('memberships', [{ id: 'm1', creator_id: 'creator-1', stripe_subscription_id: 'sub_1' }])
    const response = await stripeWebhook(webhookRequest(invoicePaidEvent()))
    expect(response.status).toBe(200)

    const [earning] = h.store.get('earnings') ?? []
    expect(earning).toMatchObject({
      creator_id: 'creator-1',
      membership_id: 'm1',
      stripe_invoice_id: 'in_1',
      gross_amount: 1000,
      platform_fee_amount: 100,
      net_amount: 900,
      currency: 'usd',
      status: 'paid',
    })

    // Replaying the same invoice must not double-count revenue.
    await stripeWebhook(webhookRequest({ ...invoicePaidEvent(), id: 'evt_invoice_paid_retry' }))
    expect((h.store.get('earnings') ?? []).filter((row) => row.stripe_invoice_id === 'in_1')).toHaveLength(1)
  })

  it('does not record earnings when the invoice has no mapped membership', async () => {
    const response = await stripeWebhook(webhookRequest(invoicePaidEvent()))
    expect(response.status).toBe(200)
    expect(h.store.get('earnings') ?? []).toHaveLength(0)
  })

  it('fulfills checkout by retrieving the subscription and storing the customer mapping', async () => {
    h.stripeState.retrievedSubscription = {
      id: 'sub_9',
      status: 'active',
      cancel_at_period_end: false,
      metadata: { creator_id: 'creator-9', subscriber_id: 'reader-9' },
      items: { data: [{ price: { id: 'price_monthly' }, current_period_end: FUTURE }] },
    }
    const response = await stripeWebhook(
      webhookRequest({
        id: 'evt_checkout',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_1', subscription: 'sub_9', customer: 'cus_9', metadata: { creator_id: 'creator-9', subscriber_id: 'reader-9' } } },
      }),
    )
    expect(response.status).toBe(200)
    expect(h.store.get('memberships')?.[0]).toMatchObject({ stripe_subscription_id: 'sub_9', status: 'active' })
    expect(h.store.get('billing_customers')?.[0]).toMatchObject({ user_id: 'reader-9', stripe_customer_id: 'cus_9' })
  })

  it('updates Connect account flags on account.updated', async () => {
    h.store.set('creator_accounts', [{ stripe_account_id: 'acct_1', details_submitted: false, charges_enabled: false, payouts_enabled: false }])
    const response = await stripeWebhook(
      webhookRequest({
        id: 'evt_account',
        type: 'account.updated',
        data: { object: { id: 'acct_1', details_submitted: true, charges_enabled: true, payouts_enabled: false } },
      }),
    )
    expect(response.status).toBe(200)
    expect(h.store.get('creator_accounts')?.[0]).toMatchObject({ details_submitted: true, charges_enabled: true, payouts_enabled: false })
  })

  it('marks the event failed and returns 500 when processing throws, allowing retry', async () => {
    h.stripeState.retrieveError = true
    const brokenEvent = {
      id: 'evt_broken',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_2', subscription: 'sub_broken', customer: 'cus_2', metadata: { creator_id: 'c', subscriber_id: 'r' } } },
    }
    const response = await stripeWebhook(webhookRequest(brokenEvent))
    expect(response.status).toBe(500)
    const [record] = h.store.get('stripe_webhook_events') ?? []
    expect(record).toMatchObject({ event_id: 'evt_broken', status: 'failed' })
    expect(record.error).toContain('stripe unavailable')
  })
})