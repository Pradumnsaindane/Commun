import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContext } from '@/lib/auth'

const authMock = vi.fn()
const adminMock = vi.fn()
const phonePeCheckoutMock = vi.fn()
const canBillMock = vi.fn()

vi.mock('@/lib/auth', () => ({ getAuthContext: (...args: unknown[]) => authMock(...args) }))
vi.mock('@/lib/admin', () => ({ createAdminClient: (...args: unknown[]) => adminMock(...args) }))
vi.mock('@/lib/stripe', () => ({
  canBill: (...args: unknown[]) => canBillMock(...args),
  getStripe: () => null,
  siteUrl: () => 'http://localhost',
}))
vi.mock('@/server/modules/billing/providers/phonepe', () => ({
  createPhonePeCheckout: (...args: unknown[]) => phonePeCheckoutMock(...args),
}))

const context = { user: { id: 'user-1' }, status: 'ACTIVE' } as AuthContext
const request = () => new Request('http://localhost/api/billing/checkout', { method: 'POST', body: JSON.stringify({ creatorId: 'creator-1' }) })

beforeEach(() => {
  vi.clearAllMocks()
  authMock.mockResolvedValue(context)
  adminMock.mockReturnValue({})
  canBillMock.mockReturnValue(false)
  phonePeCheckoutMock.mockResolvedValue({ ok: true, data: { url: 'upi://intent' } })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Explicit new-subscription provider routing', () => {
  it('defaults to the unchanged Stripe path', async () => {
    vi.stubEnv('BILLING_PROVIDER_NEW', 'stripe')
    const { createCheckout } = await import('./service')
    const result = await createCheckout(request())
    expect(result).toMatchObject({ ok: false, status: 503 })
    expect(phonePeCheckoutMock).not.toHaveBeenCalled()
  })

  it('routes to PhonePe only when explicitly selected', async () => {
    vi.stubEnv('BILLING_PROVIDER_NEW', 'phonepe')
    const { createCheckout } = await import('./service')
    const result = await createCheckout(request())
    expect(result).toMatchObject({ ok: true, data: { url: 'upi://intent' } })
    expect(phonePeCheckoutMock).toHaveBeenCalledTimes(1)
  })

  it('fails closed on an invalid provider value', async () => {
    vi.stubEnv('BILLING_PROVIDER_NEW', 'unknown')
    const { createCheckout } = await import('./service')
    expect(await createCheckout(request())).toMatchObject({ ok: false, status: 503 })
    expect(phonePeCheckoutMock).not.toHaveBeenCalled()
  })
})
