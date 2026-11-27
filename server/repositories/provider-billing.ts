import type { SupabaseClient } from '@supabase/supabase-js'
import { repositoryListResult, repositoryResult, type RepositoryListResult, type RepositoryResult } from './types'

export type BillingPlanRow = {
  id: string
  provider: 'any' | 'stripe' | 'phonepe'
  cycle: 'MONTHLY' | 'YEARLY'
  amount_minor: number
  max_amount_minor: number | null
  currency: string
  auth_workflow: 'TRANSACTION' | 'PENNY_DROP'
  active: boolean
}

export type CreatorPaymentProfileRow = {
  status: string
  payout_reference: string | null
}

export type ProviderSubscriptionRow = {
  id: string
  subscriber_id: string
  creator_id: string
  provider: 'phonepe'
  plan_id: string
  status: string
  status_reason: string | null
  provider_subscription_id: string | null
  merchant_subscription_id: string
  merchant_order_id: string
  provider_order_id: string | null
  provider_state: string | null
  amount_minor: number
  max_amount_minor: number
  currency: string
  frequency: string
  current_period_end: string | null
  paid_through: string | null
  next_renewal_at: string | null
  cancel_at_period_end: boolean
  paused_start: string | null
  paused_end: string | null
  last_event_at: string | null
  last_event_rank: number
  created_at: string
}

export type ProviderPaymentRow = {
  id: string
  provider: 'phonepe'
  subscription_id: string
  merchant_order_id: string
  provider_order_id: string | null
  transaction_id: string | null
  kind: 'SETUP' | 'REDEMPTION'
  amount_minor: number
  currency: string
  state: string
  refunded_amount_minor: number
  paid_at: string | null
  created_at: string
}

export type ProviderEventRow = {
  provider: 'phonepe'
  event_id: string
  event_type: string
  state: string | null
  status: 'received' | 'processing' | 'processed' | 'failed' | 'ignored'
  payload_hash: string
  event_at: string
  error: string | null
  received_at: string
  lease_expires_at: string | null
  processed_at: string | null
}

export type ProviderLedgerRow = {
  id: string
  creator_id: string
  subscription_id: string
  payment_id: string
  provider: 'phonepe'
  gross_amount_minor: number
  platform_fee_minor: number
  net_amount_minor: number
  currency: string
  status: string
  created_at: string
}

/**
 * Reads a plan by opaque id, or the active monthly PhonePe-compatible plan
 * when no id is supplied. Amounts always come from this server row; the browser
 * is never allowed to supply them.
 */
export async function findBillingPlan(
  db: SupabaseClient,
  planId?: string,
): Promise<RepositoryResult<BillingPlanRow>> {
  let query = db
    .from('billing_plans')
    .select('id,provider,cycle,amount_minor,max_amount_minor,currency,auth_workflow,active')
    .eq('active', true)

  if (planId) query = query.eq('id', planId)
  else {
    query = query.eq('cycle', 'MONTHLY').in('provider', ['any', 'phonepe'])
  }

  return repositoryResult(await query.order('created_at', { ascending: true }).limit(1).maybeSingle())
}

export async function findCreatorPaymentProfile(
  db: SupabaseClient,
  userId: string,
  provider: 'phonepe',
): Promise<RepositoryResult<CreatorPaymentProfileRow>> {
  return repositoryResult(
    await db
      .from('provider_creator_accounts')
      .select('status,payout_reference')
      .eq('user_id', userId)
      .eq('provider', provider)
      .maybeSingle(),
  )
}

export async function insertProviderSubscription(
  db: SupabaseClient,
  row: Record<string, unknown>,
): Promise<RepositoryResult<{ id: string }>> {
  return repositoryResult(await db.from('provider_subscriptions').insert(row).select('id').single())
}

export async function findProviderSubscriptionByMerchantSubscriptionId(
  db: SupabaseClient,
  merchantSubscriptionId: string,
): Promise<RepositoryResult<ProviderSubscriptionRow>> {
  return repositoryResult(
    await db
      .from('provider_subscriptions')
      .select('*')
      .eq('provider', 'phonepe')
      .eq('merchant_subscription_id', merchantSubscriptionId)
      .maybeSingle(),
  )
}

export async function findProviderSubscriptionById(
  db: SupabaseClient,
  id: string,
): Promise<RepositoryResult<ProviderSubscriptionRow>> {
  return repositoryResult(await db.from('provider_subscriptions').select('*').eq('id', id).maybeSingle())
}

export async function findLatestProviderSubscriptionForSubscriber(
  db: SupabaseClient,
  subscriberId: string,
  creatorId: string,
): Promise<RepositoryResult<ProviderSubscriptionRow>> {
  return repositoryResult(
    await db
      .from('provider_subscriptions')
      .select('*')
      .eq('provider', 'phonepe')
      .eq('subscriber_id', subscriberId)
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  )
}

/** Only a row that is currently paid and active grants entitlement. */
export async function findActiveProviderSubscription(
  db: SupabaseClient,
  subscriberId: string,
  creatorId: string,
): Promise<RepositoryResult<{ id: string }>> {
  return repositoryResult(
    await db
      .from('provider_subscriptions')
      .select('id')
      .eq('provider', 'phonepe')
      .eq('subscriber_id', subscriberId)
      .eq('creator_id', creatorId)
      .eq('status', 'active')
      .gt('paid_through', new Date().toISOString())
      .limit(1)
      .maybeSingle(),
  )
}

export async function listProviderSubscriptionsForSubscriber(
  db: SupabaseClient,
  subscriberId: string,
): Promise<RepositoryListResult<ProviderSubscriptionRow>> {
  return repositoryListResult(
    await db
      .from('provider_subscriptions')
      .select('*')
      .eq('provider', 'phonepe')
      .eq('subscriber_id', subscriberId)
      .order('created_at', { ascending: false }),
  )
}

export async function listCreatorProviderSubscriptions(
  db: SupabaseClient,
  creatorId: string,
): Promise<RepositoryListResult<ProviderSubscriptionRow>> {
  return repositoryListResult(
    await db
      .from('provider_subscriptions')
      .select('id,status,current_period_end,paid_through,created_at')
      .eq('provider', 'phonepe')
      .eq('creator_id', creatorId),
  )
}

export async function updateProviderSubscription(
  db: SupabaseClient,
  id: string,
  patch: Record<string, unknown>,
): Promise<RepositoryResult<ProviderSubscriptionRow>> {
  return repositoryResult(
    await db
      .from('provider_subscriptions')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle(),
  )
}

/**
 * Conditional state write used by webhooks. Event time is the primary ordering
 * signal and rank only breaks same-instant ties. The filters are part of the
 * UPDATE, so two concurrent callbacks cannot both pass a read-then-write check.
 * Terminal statuses are immutable; while paused only a pause/unpause callback
 * may change the row.
 */
export async function applyProviderSubscriptionEventUpdate(
  db: SupabaseClient,
  id: string,
  patch: Record<string, unknown>,
  options: { eventAt: string; rank: number; allowWhenPaused: boolean },
): Promise<RepositoryResult<ProviderSubscriptionRow>> {
  let query = db
    .from('provider_subscriptions')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .not('status', 'in', '(canceled,revoked,incomplete_expired)')
    .or(
      `last_event_at.is.null,last_event_at.lt.${options.eventAt},` +
        `and(last_event_at.eq.${options.eventAt},last_event_rank.lte.${options.rank})`,
    )

  if (!options.allowWhenPaused) query = query.neq('status', 'paused')

  return repositoryResult(await query.select('*').maybeSingle())
}

export function insertProviderEvent(db: SupabaseClient, row: Record<string, unknown>) {
  return db.from('provider_payment_events').insert(row)
}

export async function findProviderEvent(
  db: SupabaseClient,
  provider: 'phonepe',
  eventId: string,
): Promise<RepositoryResult<{
  status: string
  event_at: string | null
  lease_expires_at: string | null
}>> {
  return repositoryResult(
    await db
      .from('provider_payment_events')
      .select('status,event_at,lease_expires_at')
      .eq('provider', provider)
      .eq('event_id', eventId)
      .maybeSingle(),
  )
}

/** Recovers a processing row whose worker died before marking it complete. */
export function resetExpiredProviderEventLease(
  db: SupabaseClient,
  provider: 'phonepe',
  eventId: string,
  nowIso: string,
) {
  return db
    .from('provider_payment_events')
    .update({ status: 'received', lease_expires_at: null, error: null })
    .eq('provider', provider)
    .eq('event_id', eventId)
    .eq('status', 'processing')
    .or(`lease_expires_at.is.null,lease_expires_at.lt.${nowIso}`)
    .select('event_id')
}

export function updateProviderEvent(
  db: SupabaseClient,
  provider: 'phonepe',
  eventId: string,
  patch: Record<string, unknown>,
) {
  return db
    .from('provider_payment_events')
    .update(patch)
    .eq('provider', provider)
    .eq('event_id', eventId)
}

export function insertProviderPayment(db: SupabaseClient, row: Record<string, unknown>) {
  return db.from('provider_payments').insert(row).select('id').single()
}

export async function findProviderPaymentByOrder(
  db: SupabaseClient,
  merchantOrderId: string,
): Promise<RepositoryResult<ProviderPaymentRow>> {
  return repositoryResult(
    await db
      .from('provider_payments')
      .select('*')
      .eq('provider', 'phonepe')
      .eq('merchant_order_id', merchantOrderId)
      .maybeSingle(),
  )
}

export async function findProviderPaymentById(
  db: SupabaseClient,
  paymentId: string,
): Promise<RepositoryResult<ProviderPaymentRow>> {
  return repositoryResult(await db.from('provider_payments').select('*').eq('id', paymentId).maybeSingle())
}

export async function listProviderPaymentsBySubscriptions(
  db: SupabaseClient,
  subscriptionIds: string[],
): Promise<RepositoryListResult<ProviderPaymentRow>> {
  if (!subscriptionIds.length) return { data: [], error: null }
  return repositoryListResult(
    await db
      .from('provider_payments')
      .select('*')
      .in('subscription_id', subscriptionIds)
      .order('created_at', { ascending: false }),
  )
}

export function updateProviderPayment(db: SupabaseClient, id: string, patch: Record<string, unknown>) {
  return db
    .from('provider_payments')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export function insertProviderLedgerEntry(db: SupabaseClient, row: Record<string, unknown>) {
  return db.from('provider_ledger_entries').insert(row)
}

export async function listProviderLedgerForCreator(
  db: SupabaseClient,
  creatorId: string,
): Promise<RepositoryListResult<ProviderLedgerRow>> {
  return repositoryListResult(
    await db
      .from('provider_ledger_entries')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(25),
  )
}

export function updateProviderLedgerByPayment(db: SupabaseClient, paymentId: string, patch: Record<string, unknown>) {
  return db
    .from('provider_ledger_entries')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('payment_id', paymentId)
}

export function insertProviderOperation(db: SupabaseClient, row: Record<string, unknown>) {
  return db.from('provider_operations').insert(row)
}
