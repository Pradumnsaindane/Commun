import { z } from 'zod'

/** Providers supported by the billing abstraction. Stripe remains historical. */
export const BILLING_PROVIDERS = ['stripe', 'phonepe'] as const
export type BillingProvider = (typeof BILLING_PROVIDERS)[number]

export const BILLING_PLAN_CYCLES = ['MONTHLY', 'YEARLY'] as const
export type BillingPlanCycle = (typeof BILLING_PLAN_CYCLES)[number]

export const PHONEPE_AUTH_WORKFLOWS = ['TRANSACTION', 'PENNY_DROP'] as const
export type PhonePeAuthWorkflow = (typeof PHONEPE_AUTH_WORKFLOWS)[number]

/**
 * Normalized subscription states used by both providers in application code.
 * These deliberately mirror the existing Stripe vocabulary where possible.
 */
export const PROVIDER_SUBSCRIPTION_STATUSES = [
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
  'revoked',
] as const
export type ProviderSubscriptionStatus = (typeof PROVIDER_SUBSCRIPTION_STATUSES)[number]

export const ENTITLED_PROVIDER_STATUSES: ProviderSubscriptionStatus[] = ['active', 'trialing']

export type BillingPlan = {
  id: string
  provider: 'any' | BillingProvider
  cycle: BillingPlanCycle
  amountMinor: number
  maxAmountMinor: number | null
  currency: string
  authWorkflow: PhonePeAuthWorkflow
  active: boolean
}

export type NormalizedProviderSubscription = {
  status: string
  current_period_end: string | null
  paid_through: string | null
  provider: BillingProvider
}

/**
 * The browser may select a creator and an opaque plan id. It may never send
 * amount, currency, provider state, or entitlement.
 */
export const checkoutRequestSchema = z.looseObject({
  creatorId: z.string().uuid(),
  planId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/).optional(),
})

export const refundRequestSchema = z.looseObject({
  paymentId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
})

export function isEntitledProviderStatus(status: string): boolean {
  return ENTITLED_PROVIDER_STATUSES.includes(status as ProviderSubscriptionStatus)
}

/** Adds one billing cycle without drifting across month lengths. */
export function addBillingCycle(cycle: BillingPlanCycle, from: Date): Date {
  const result = new Date(from.getTime())
  if (cycle === 'YEARLY') result.setUTCFullYear(result.getUTCFullYear() + 1)
  else result.setUTCMonth(result.getUTCMonth() + 1)
  return result
}
