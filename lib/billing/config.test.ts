import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/stripe', () => ({ canBill: () => true }))
vi.mock('@/lib/phonepe/config', () => ({
  isPhonePeConfigured: vi.fn(() => false),
}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('Billing provider selection', () => {
  it('defaults to Stripe and stays available with Stripe config', async () => {
    vi.stubEnv('BILLING_PROVIDER_NEW', '')
    const { getNewBillingProvider, isBillingConfigured, isPhonePeNewProvider } = await import('./config')
    expect(getNewBillingProvider()).toBe('stripe')
    expect(isPhonePeNewProvider()).toBe(false)
    expect(isBillingConfigured()).toBe(true)
  })

  it('selects PhonePe and requires complete PhonePe configuration', async () => {
    vi.stubEnv('BILLING_PROVIDER_NEW', 'PHONEPE')
    const { isBillingConfigured, isPhonePeNewProvider } = await import('./config')
    expect(isPhonePeNewProvider()).toBe(true)
    expect(isBillingConfigured()).toBe(false)

    const { isPhonePeConfigured } = await import('@/lib/phonepe/config')
    vi.mocked(isPhonePeConfigured).mockReturnValue(true)
    expect(isBillingConfigured()).toBe(true)
  })

  it('fails closed on invalid values', async () => {
    vi.stubEnv('BILLING_PROVIDER_NEW', 'paypal')
    const { getNewBillingProvider, isBillingConfigured, isPhonePeNewProvider } = await import('./config')
    expect(() => getNewBillingProvider()).toThrow()
    expect(isPhonePeNewProvider()).toBe(false)
    expect(isBillingConfigured()).toBe(false)
  })
})
