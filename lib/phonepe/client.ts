import { z } from 'zod'
import type { PhonePeConfig } from '@/lib/phonepe/config'

const tokenResponseSchema = z.looseObject({
  access_token: z.string().min(1),
  token_type: z.string().optional(),
  issued_at: z.number().optional(),
  expires_at: z.number().optional(),
})

const setupResponseSchema = z.looseObject({
  orderId: z.string().min(1),
  state: z.string().min(1),
  intentUrl: z.string().min(1),
  nativeOtpEnabled: z.boolean().optional(),
})

const statusResponseSchema = z.looseObject({
  state: z.string().min(1),
  merchantOrderId: z.string().optional(),
  merchantSubscriptionId: z.string().optional(),
  subscriptionId: z.string().optional(),
  orderId: z.string().optional(),
})

const cancelResponseSchema = z.looseObject({
  state: z.string().optional(),
  merchantSubscriptionId: z.string().optional(),
})

const refundResponseSchema = z.looseObject({
  refundId: z.string().optional(),
  amount: z.number().optional(),
  state: z.string().optional(),
})

export type PhonePeSetupInput = {
  merchantOrderId: string
  amount: number
  expireAt: number
  paymentFlow: {
    type: 'SUBSCRIPTION_SETUP'
    merchantSubscriptionId: string
    authWorkflowType: 'TRANSACTION' | 'PENNY DROP'
    amountType: 'FIXED'
    maxAmount: number
    frequency: 'MONTHLY' | 'YEARLY'
    paymentMode: {
      type: 'UPI_INTENT'
      targetApp: string
    }
  }
  deviceContext: {
    deviceOS: 'ANDROID' | 'IOS'
  }
  metaInfo: Record<string, string>
}

export type PhonePeSetupResponse = z.infer<typeof setupResponseSchema>
export type PhonePeStatusResponse = z.infer<typeof statusResponseSchema>
export type PhonePeRefundResponse = z.infer<typeof refundResponseSchema>

export class PhonePeApiError extends Error {
  readonly status: number
  readonly code: string | null

  constructor(message: string, status: number, code: string | null = null) {
    super(message)
    this.name = 'PhonePeApiError'
    this.status = status
    this.code = code
  }
}

let tokenCache: { token: string; expiresAtMs: number } | null = null

function authHeaders(config: PhonePeConfig, token: string): HeadersInit {
  return {
    Accept: 'application/json',
    Authorization: `O-Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-MERCHANT-ID': config.merchantId,
  }
}

async function fetchJson(url: string, init: RequestInit): Promise<{ status: number; body: unknown }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    if (response.status === 204) return { status: response.status, body: null }
    const text = await response.text()
    if (!text) return { status: response.status, body: null }
    try {
      return { status: response.status, body: JSON.parse(text) as unknown }
    } catch {
      return { status: response.status, body: null }
    }
  } catch {
    throw new PhonePeApiError('PhonePe is temporarily unavailable.', 502)
  } finally {
    clearTimeout(timeout)
  }
}

function errorFrom(status: number, body: unknown): PhonePeApiError {
  const code =
    body && typeof body === 'object' && 'code' in body && typeof (body as { code?: unknown }).code === 'string'
      ? (body as { code: string }).code
      : null
  if (status === 401 || status === 403) return new PhonePeApiError('PhonePe authentication failed.', 502, code)
  if (status >= 500) return new PhonePeApiError('PhonePe is temporarily unavailable.', 502, code)
  return new PhonePeApiError('PhonePe rejected the request.', 502, code)
}

export async function getPhonePeAccessToken(config: PhonePeConfig, force = false): Promise<string> {
  const now = Date.now()
  if (!force && tokenCache && tokenCache.expiresAtMs > now + 60_000) return tokenCache.token

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_version: config.clientVersion,
    client_secret: config.clientSecret,
    grant_type: 'client_credentials',
  })
  const response = await fetchJson(`${config.authBase}/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString(),
  })
  if (response.status < 200 || response.status >= 300) throw errorFrom(response.status, response.body)
  const parsed = tokenResponseSchema.safeParse(response.body)
  if (!parsed.success) throw new PhonePeApiError('PhonePe returned an invalid token response.', 502)

  const expiresAtMs = parsed.data.expires_at ? parsed.data.expires_at * 1000 : now + 55 * 60_000
  tokenCache = { token: parsed.data.access_token, expiresAtMs }
  return tokenCache.token
}

async function phonePeRequest<T>(
  config: PhonePeConfig,
  schema: z.ZodType<T>,
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getPhonePeAccessToken(config)
  const response = await fetchJson(`${config.apiBase}${path}`, {
    method,
    headers: authHeaders(config, token),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  if (response.status < 200 || response.status >= 300) throw errorFrom(response.status, response.body)
  const parsed = schema.safeParse(response.body)
  if (!parsed.success) throw new PhonePeApiError('PhonePe returned an invalid response.', 502)
  return parsed.data
}

export function setupPhonePeSubscription(config: PhonePeConfig, input: PhonePeSetupInput) {
  return phonePeRequest(config, setupResponseSchema, 'POST', '/subscriptions/v2/setup', input)
}

export function getPhonePeOrderStatus(config: PhonePeConfig, merchantOrderId: string) {
  const path = `/subscriptions/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=true`
  return phonePeRequest(config, statusResponseSchema, 'GET', path)
}

export function getPhonePeSubscriptionStatus(config: PhonePeConfig, merchantSubscriptionId: string) {
  const path = `/subscriptions/v2/${encodeURIComponent(merchantSubscriptionId)}/status?details=true`
  return phonePeRequest(config, statusResponseSchema, 'GET', path)
}

/**
 * PhonePe documents DELETE for subscription cancel; some sandbox builds accept
 * POST on the same path. Use POST to match the current documented cancel API
 * while accepting a missing response body.
 */
export async function cancelPhonePeSubscription(config: PhonePeConfig, merchantSubscriptionId: string): Promise<void> {
  const token = await getPhonePeAccessToken(config)
  const path = `/subscriptions/v2/${encodeURIComponent(merchantSubscriptionId)}/cancel`
  const response = await fetchJson(`${config.apiBase}${path}`, { method: 'POST', headers: authHeaders(config, token) })
  if (response.status < 200 || response.status >= 300) throw errorFrom(response.status, response.body)
  if (response.body !== null && !cancelResponseSchema.safeParse(response.body).success) {
    throw new PhonePeApiError('Invalid PhonePe cancel response.', 502)
  }
}

export function initiatePhonePeRefund(
  config: PhonePeConfig,
  input: { merchantRefundId: string; originalMerchantOrderId: string; amount: number },
) {
  return phonePeRequest(config, refundResponseSchema, 'POST', '/payments/v2/refund', input)
}

export function getPhonePeRefundStatus(config: PhonePeConfig, merchantRefundId: string) {
  const path = `/payments/v2/refund/${encodeURIComponent(merchantRefundId)}/status`
  return phonePeRequest(config, refundResponseSchema, 'GET', path)
}

/** Test hook; never used in application code. */
export function resetPhonePeTokenCache() {
  tokenCache = null
}
