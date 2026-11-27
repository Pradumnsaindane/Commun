import { isConfiguredValue } from '@/lib/env'
import {
  PHONEPE_AUTH_WORKFLOWS,
  type PhonePeAuthWorkflow,
} from '@/lib/billing/types'

export type PhonePeEnvironment = 'sandbox' | 'production'

export type PhonePeConfig = {
  environment: PhonePeEnvironment
  authBase: string
  apiBase: string
  clientId: string
  clientVersion: string
  clientSecret: string
  merchantId: string
  authWorkflow: PhonePeAuthWorkflow
  upiTargetApp: string
  deviceOs: 'ANDROID' | 'IOS'
  paymentExpiryMinutes: number
}

export type PhonePeWebhookConfig =
  | { method: 'hmac'; keyId: string; secret: string }
  | { method: 'sha'; username: string; password: string; encoding: 'hex' | 'base64' }

function read(envKey: string, env: NodeJS.ProcessEnv = process.env): string {
  const value = env[envKey]
  return isConfiguredValue(value) ? (value as string).trim() : ''
}

export function phonePeEnvironment(env: NodeJS.ProcessEnv = process.env): PhonePeEnvironment {
  const raw = (env.PHONEPE_ENV ?? 'sandbox').trim().toLowerCase()
  if (raw === 'sandbox' || raw === 'production') return raw
  throw new Error('PHONEPE_ENV must be one of: sandbox, production.')
}

/** Server-only PhonePe credentials. Never import into a client component. */
export function phonePeConfig(env: NodeJS.ProcessEnv = process.env): PhonePeConfig | null {
  let environment: PhonePeEnvironment
  try {
    environment = phonePeEnvironment(env)
  } catch {
    return null
  }

  const clientId = read('PHONEPE_CLIENT_ID', env)
  const clientVersion = read('PHONEPE_CLIENT_VERSION', env)
  const clientSecret = read('PHONEPE_CLIENT_SECRET', env)
  const merchantId = read('PHONEPE_MERCHANT_ID', env)
  if (!clientId || !clientVersion || !clientSecret || !merchantId) return null

  const authWorkflowRaw = (env.PHONEPE_AUTH_WORKFLOW ?? 'TRANSACTION').trim().toUpperCase()
  const authWorkflow = PHONEPE_AUTH_WORKFLOWS.includes(authWorkflowRaw as PhonePeAuthWorkflow)
    ? (authWorkflowRaw as PhonePeAuthWorkflow)
    : null
  if (!authWorkflow) return null

  const deviceOsRaw = (env.PHONEPE_DEVICE_OS ?? 'ANDROID').trim().toUpperCase()
  const deviceOs: 'ANDROID' | 'IOS' = deviceOsRaw === 'IOS' ? 'IOS' : 'ANDROID'
  const expiryRaw = Number(env.PHONEPE_PAYMENT_EXPIRY_MINUTES ?? 15)
  const paymentExpiryMinutes = Number.isFinite(expiryRaw)
    ? Math.min(15, Math.max(1, Math.floor(expiryRaw)))
    : 15

  return {
    environment,
    authBase:
      environment === 'sandbox'
        ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
        : 'https://api.phonepe.com/apis/identity-manager',
    apiBase:
      environment === 'sandbox'
        ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
        : 'https://api.phonepe.com/apis/pg',
    clientId,
    clientVersion,
    clientSecret,
    merchantId,
    authWorkflow,
    upiTargetApp: read('PHONEPE_UPI_TARGET_APP', env) || 'com.phonepe.app',
    deviceOs,
    paymentExpiryMinutes,
  }
}

export function isPhonePeConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return phonePeConfig(env) !== null && phonePeWebhookConfig(env) !== null
}

/** HMAC is preferred when both auth methods are configured. */
export function phonePeWebhookConfig(env: NodeJS.ProcessEnv = process.env): PhonePeWebhookConfig | null {
  const keyId = read('PHONEPE_WEBHOOK_KEY_ID', env)
  const secret = read('PHONEPE_WEBHOOK_SECRET', env)
  if (keyId && secret) return { method: 'hmac', keyId, secret }

  const username = read('PHONEPE_WEBHOOK_USERNAME', env)
  const password = read('PHONEPE_WEBHOOK_PASSWORD', env)
  if (!username || !password) return null
  const encodingRaw = (env.PHONEPE_WEBHOOK_SHA_ENCODING ?? 'hex').trim().toLowerCase()
  const encoding = encodingRaw === 'base64' ? 'base64' : 'hex'
  return { method: 'sha', username, password, encoding }
}
