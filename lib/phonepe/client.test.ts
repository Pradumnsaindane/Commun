import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cancelPhonePeSubscription,
  getPhonePeAccessToken,
  PhonePeApiError,
  resetPhonePeTokenCache,
  setupPhonePeSubscription,
} from './client'
import type { PhonePeConfig } from './config'

const config: PhonePeConfig = {
  environment: 'sandbox',
  authBase: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  apiBase: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  clientId: 'client-1',
  clientVersion: '1',
  clientSecret: 'secret-1',
  merchantId: 'MERCHANT1',
  authWorkflow: 'TRANSACTION',
  upiTargetApp: 'com.phonepe.app',
  deviceOs: 'ANDROID',
  paymentExpiryMinutes: 15,
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

const futureEpoch = Math.floor(Date.now() / 1000) + 3600

afterEach(() => {
  resetPhonePeTokenCache()
  vi.unstubAllGlobals()
})

describe('PhonePe API client', () => {
  it('requests OAuth with form fields and caches the token', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'token-1', issued_at: 100, expires_at: futureEpoch }))
      .mockResolvedValueOnce(jsonResponse({ orderId: 'ORDER-1', state: 'PENDING', intentUrl: 'upi://pay' }))
    vi.stubGlobal('fetch', fetchMock)

    expect(await getPhonePeAccessToken(config)).toBe('token-1')
    expect(await getPhonePeAccessToken(config)).toBe('token-1')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${config.authBase}/v1/oauth/token`)
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/x-www-form-urlencoded' })
    expect(String(init.body)).toContain('grant_type=client_credentials')
    expect(String(init.body)).toContain('client_version=1')

    await setupPhonePeSubscription(config, {
      merchantOrderId: 'MO-1',
      amount: 19900,
      expireAt: 1_700_000_000_000,
      paymentFlow: {
        type: 'SUBSCRIPTION_SETUP',
        merchantSubscriptionId: 'MS-1',
        authWorkflowType: 'TRANSACTION',
        amountType: 'FIXED',
        maxAmount: 19900,
        frequency: 'MONTHLY',
        paymentMode: { type: 'UPI_INTENT', targetApp: 'com.phonepe.app' },
      },
      deviceContext: { deviceOS: 'ANDROID' },
      metaInfo: {},
    })

    const [apiUrl, apiInit] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(apiUrl).toBe(`${config.apiBase}/subscriptions/v2/setup`)
    expect(apiInit.headers).toMatchObject({ Authorization: 'O-Bearer token-1', 'X-MERCHANT-ID': 'MERCHANT1' })
    const sent = JSON.parse(String(apiInit.body)) as { amount: number; paymentFlow: { frequency: string } }
    expect(sent.amount).toBe(19900)
    expect(sent.paymentFlow.frequency).toBe('MONTHLY')
  })

  it('rejects malformed token responses and maps auth errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ nope: true })))
    await expect(getPhonePeAccessToken(config)).rejects.toBeInstanceOf(PhonePeApiError)
    resetPhonePeTokenCache()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ code: 'BAD_CREDENTIALS' }, 401)))
    await expect(getPhonePeAccessToken(config)).rejects.toMatchObject({ status: 502, code: 'BAD_CREDENTIALS' })
  })

  it('accepts 204 cancel responses', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: 't', expires_at: futureEpoch }))
      .mockResolvedValueOnce(new Response(null, { status: 204 })))
    await expect(cancelPhonePeSubscription(config, 'MS-1')).resolves.toBeUndefined()
  })
})
