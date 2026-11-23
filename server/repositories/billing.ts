import type { SupabaseClient } from '@supabase/supabase-js'
import { repositoryResult, type RepositoryResult } from './types'

export type CreatorAccountRow = {
  stripe_account_id: string
  details_submitted: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
  updated_at?: string
}

export type MembershipRow = {
  id: string
  status: string
  stripe_subscription_id?: string | null
  current_period_end?: string | null
}

export async function findCreatorAccount(
  db: SupabaseClient,
  userId: string
): Promise<RepositoryResult<CreatorAccountRow>> {
  return repositoryResult(
    await db
      .from('creator_accounts')
      .select('stripe_account_id,details_submitted,charges_enabled,payouts_enabled')
      .eq('user_id', userId)
      .maybeSingle()
  )
}

export async function findCreatorAccountForLink(
  db: SupabaseClient,
  userId: string
): Promise<RepositoryResult<{ stripe_account_id: string; updated_at?: string }>> {
  return repositoryResult(
    await db
      .from('creator_accounts')
      .select('stripe_account_id,updated_at')
      .eq('user_id', userId)
      .maybeSingle()
  )
}

export async function findMembership(
  db: SupabaseClient,
  subscriberId: string,
  creatorId: string
): Promise<RepositoryResult<MembershipRow>> {
  return repositoryResult(
    await db
      .from('memberships')
      .select('id,status,stripe_subscription_id,current_period_end')
      .eq('subscriber_id', subscriberId)
      .eq('creator_id', creatorId)
      .maybeSingle()
  )
}

export async function listCreatorMemberships(
  db: SupabaseClient,
  creatorId: string
): Promise<RepositoryResult<Array<{ id: string; status: string }>>> {
  return repositoryResult(
    await db.from('memberships').select('id,status').eq('creator_id', creatorId)
  )
}

export async function findBillingCustomer(
  client: SupabaseClient,
  userId: string
): Promise<RepositoryResult<{ stripe_customer_id: string }>> {
  return repositoryResult(
    await client
      .from('billing_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle()
  )
}

export async function upsertBillingCustomer(
  db: SupabaseClient,
  userId: string,
  stripeCustomerId: string
) {
  return db
    .from('billing_customers')
    .upsert(
      { user_id: userId, stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
}

export async function insertCreatorAccount(
  db: SupabaseClient,
  payload: {
    user_id: string
    stripe_account_id: string
    details_submitted: boolean
    charges_enabled: boolean
    payouts_enabled: boolean
  }
) {
  return db.from('creator_accounts').insert(payload)
}
