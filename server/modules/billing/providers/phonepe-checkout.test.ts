import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContext } from '@/lib/auth'

const configMock = vi.fn()
const setupMock = vi.fn()
const tokenMock = vi.fn()
const rateLimitMock = vi.fn()
const findPlanMock = vi.fn()
const findProfileMock = vi.fn()
const findStripeMembershipMock = vi.fn()
const findActiveProviderMembershipMock = vi.fn()
const insertSubscriptionMock = vi.fn()
const updateSubscriptionMock = vi.fn()
const insertOperationMock = vi.fn()

vi.mock('@/lib/phonepe/config', () => ({ phonePeConfig: () => configMock() }))
vi.mock('@/lib/phonepe/client', () => ({
  getPhonePeAccessToken: (...args: unknown[]) => tokenMock(...args),
  setupPhonePeSubscription: (...args: unknown[]) => setupMock(...args),
  PhonePeApiError: class PhonePeApiError extends Error {},
}))
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: (...args: unknown[]) => rateLimitMock(...args) }))
vi.mock('@/lib/logger', () => ({ logServer: vi.fn() }))
vi.mock('@/server/repositories/billing', () => ({
  findMembership: (...args: unknown[]) => findStripeMembershipMock(...args),
}))
vi.mock('@/server/repositories/provider-billing', () => ({
  findActiveProviderSubscription: (...args: unknown[]) => findActiveProviderMembershipMock(...args),
  findBillingPlan: (...args: unknown[]) => findPlanMock(...args),
  findCreatorPaymentProfile: (...args: unknown[]) => findProfileMock(...args),
  insertProviderSubscription: (...args: unknown[]) => insertSubscriptionMock(...args),
  updateProviderSubscription: (...args: unknown[]) => updateSubscriptionMock(...args),
  insertProviderOperation: (...args: unknown[]) => insertOperationMock(...args),
}))

const config = {
  environment: 'sandbox' as const,
  authBase: 'https://sandbox',
  apiBase: 'https://sandbox',
  clientId: 'client',
  clientVersion: '1',
  clientSecret: 'secret',
  merchantId: 'MERCHANT',
  authWorkflow: 'TRANSACTION' as const,
  upiTargetApp: 'com.phonepe.app',
  deviceOs: 'ANDROID' as const,
  paymentExpiryMinutes: 15,
}

const subscriberId = '11111111-1111-4111-8111-111111111111'
const creatorId = '22222222-2222-4222-8222-222222222222'
const context = { user: { id: subscriberId }, status: 'ACTIVE' } as AuthContext
const admin = {} as never

const plan = {
  id: 'monthly-inr',
  provider: 'any' as const,
  cycle: 'MONTHLY' as const,
  amount_minor: 19900,
  max_amount_minor: 19900,
  currency: 'INR',
  auth_workflow: 'TRANSACTION' as const,
  active: true,
}

function request(body: unknown) {
  return new Request('http://localhost/api/billing/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  configMock.mockReturnValue(config)
  tokenMock.mockResolvedValue('token')
  rateLimitMock.mockResolvedValue({ success: true, retryAfter: 0 })
  findPlanMock.mockResolvedValue({ data: plan, error: null })
  findProfileMock.mockResolvedValue({ data: { status: 'ACTIVE', payout_reference: null }, error: null })
  findStripeMembershipMock.mockResolvedValue({ data: null, error: null })
  findActiveProviderMembershipMock.mockResolvedValue({ data: null, error: null })
  insertSubscriptionMock.mockResolvedValue({ data: { id: 'sub-1' }, error: null })
  updateSubscriptionMock.mockResolvedValue({ data: {}, error: null })
  insertOperationMock.mockResolvedValue({ data: null, error: null })
  setupMock.mockResolvedValue({ orderId: 'ORDER-1', state: 'PENDING', intentUrl: 'upi://intent' })
})

describe('PhonePe checkout server contract', () => {
  it('ignores client-supplied amount, currency, and provider state', async () => {
    const { createPhonePeCheckout } = await import('./phonepe-checkout')
    const result = await createPhonePeCheckout(request({
      creatorId,
      amountMinor: 1,
      currency: 'USD',
      provider: 'stripe',
      status: 'active',
    }), context, admin)

    expect(result).toMatchObject({ ok: true, data: { url: 'upi://intent' } })
    const [, input] = setupMock.mock.calls[0] as [unknown, Record<string, unknown>]
    expect(input.amount).toBe(19900)
    expect(input.merchantOrderId).toBeTypeOf('string')
    expect(input.paymentFlow).toMatchObject({
      type: 'SUBSCRIPTION_SETUP',
      authWorkflowType: 'TRANSACTION',
      amountType: 'FIXED',
      maxAmount: 19900,
      frequency: 'MONTHLY',
    })
    expect(insertSubscriptionMock.mock.calls[0][1]).toMatchObject({
      amount_minor: 19900,
      currency: 'INR',
      provider: 'phonepe',
      status: 'incomplete',
    })
  })

  it('uses the penny-drop setup amount when the plan requires it', async () => {
    findPlanMock.mockResolvedValue({
      data: { ...plan, auth_workflow: 'PENNY_DROP', cycle: 'YEARLY', max_amount_minor: 19900 },
      error: null,
    })
    const { createPhonePeCheckout } = await import('./phonepe-checkout')
    await createPhonePeCheckout(request({ creatorId, planId: 'yearly-inr' }), context, admin)
    const [, input] = setupMock.mock.calls[0] as [unknown, Record<string, unknown>]
    expect(input.amount).toBe(200)
    expect(input.paymentFlow).toMatchObject({ authWorkflowType: 'PENNY DROP', frequency: 'YEARLY', maxAmount: 19900 })
  })

  it('rejects invalid requests and non-PhonePe plans', async () => {
    const { createPhonePeCheckout } = await import('./phonepe-checkout')
    expect((await createPhonePeCheckout(request({ creatorId: 'not-a-uuid' }), context, admin)).ok).toBe(false)
    expect((await createPhonePeCheckout(request({ creatorId: subscriberId }), context, admin)).ok).toBe(false)

    findPlanMock.mockResolvedValue({ data: { ...plan, provider: 'stripe' }, error: null })
    const stripePlan = await createPhonePeCheckout(request({ creatorId }), context, admin)
    expect(stripePlan).toMatchObject({ ok: false, status: 503 })

    findPlanMock.mockResolvedValue({ data: plan, error: null })
    findProfileMock.mockResolvedValue({ data: { status: 'DISABLED', payout_reference: null }, error: null })
    expect((await createPhonePeCheckout(request({ creatorId }), context, admin)).ok).toBe(false)
  })

  it('blocks a second checkout while either provider has an active membership', async () => {
    const { createPhonePeCheckout } = await import('./phonepe-checkout')
    findStripeMembershipMock.mockResolvedValue({ data: { status: 'active' }, error: null })
    expect(await createPhonePeCheckout(request({ creatorId }), context, admin)).toMatchObject({ ok: false, status: 409 })

    findStripeMembershipMock.mockResolvedValue({ data: null, error: null })
    findActiveProviderMembershipMock.mockResolvedValue({ data: { id: 'sub-active' }, error: null })
    expect(await createPhonePeCheckout(request({ creatorId }), context, admin)).toMatchObject({ ok: false, status: 409 })
    expect(insertSubscriptionMock).not.toHaveBeenCalled()
  })

  it('fails closed when PhonePe is not configured', async () => {
    configMock.mockReturnValue(null)
    const { createPhonePeCheckout } = await import('./phonepe-checkout')
    expect(await createPhonePeCheckout(request({ creatorId }), context, admin)).toMatchObject({ ok: false, status: 503 })
    expect(setupMock).not.toHaveBeenCalled()
  })
})
