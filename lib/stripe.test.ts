import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('Stripe configuration guards', () => {
  it('treats .env.example values as unconfigured', async () => {
    vi.resetModules()
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_your-secret-key')
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_your-webhook-secret')
    vi.stubEnv('STRIPE_PRICE_MEMBERSHIP_MONTHLY', 'price_your-monthly-membership')

    const { canBill, getStripe, hasMembershipPrice, isStripeConfigured, stripeSecretKey, stripeWebhookSecret } =
      await import('./stripe')

    expect(stripeSecretKey()).toBe('')
    expect(stripeWebhookSecret()).toBe('')
    expect(hasMembershipPrice()).toBe(false)
    expect(isStripeConfigured()).toBe(false)
    expect(canBill()).toBe(false)
    expect(getStripe()).toBeNull()
  })

  it('enables billing only with a test secret, webhook secret, and price', async () => {
    vi.resetModules()
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_51Nabcdefghijklmnop')
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_abcdefghijklmnop')
    vi.stubEnv('STRIPE_PRICE_MEMBERSHIP_MONTHLY', 'price_1Nabcdefghijklmnop')

    const { canBill, getStripe, isStripeConfigured } = await import('./stripe')

    expect(isStripeConfigured()).toBe(true)
    expect(canBill()).toBe(true)
    expect(getStripe()).not.toBeNull()
  })
})
