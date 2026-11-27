import { BILLING_PROVIDERS, type BillingProvider } from '@/lib/billing/types'
import { isPhonePeConfigured } from '@/lib/phonepe/config'
import { canBill } from '@/lib/stripe'

/**
 * Provider selection for NEW purchases is explicit and server-controlled.
 * Stripe remains the default until an operator opts into PhonePe. Existing
 * Stripe memberships and webhooks are never affected by this value.
 */
export function getNewBillingProvider(): BillingProvider {
  const raw = (process.env.BILLING_PROVIDER_NEW ?? '').trim().toLowerCase() || 'stripe'
  if (!BILLING_PROVIDERS.includes(raw as BillingProvider)) {
    throw new Error(`BILLING_PROVIDER_NEW must be one of: ${BILLING_PROVIDERS.join(', ')}.`)
  }
  return raw as BillingProvider
}

/** Avoid throwing during rendering when the operator value is invalid. */
export function isPhonePeNewProvider(): boolean {
  try {
    return getNewBillingProvider() === 'phonepe'
  } catch {
    return false
  }
}

/** True when the selected provider can actually create a new subscription. */
export function isBillingConfigured(): boolean {
  try {
    const provider = getNewBillingProvider()
    if (provider === 'phonepe') return isPhonePeConfigured()
    return canBill()
  } catch {
    return false
  }
}
