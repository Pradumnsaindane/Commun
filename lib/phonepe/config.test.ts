import { describe, expect, it } from 'vitest'
import { phonePeConfig, phonePeEnvironment, phonePeWebhookConfig } from './config'

const credentials = {
  PHONEPE_CLIENT_ID: 'client-123',
  PHONEPE_CLIENT_VERSION: '1',
  PHONEPE_CLIENT_SECRET: 'secret-123',
  PHONEPE_MERCHANT_ID: 'MERCHANT123',
}

const env = (values: Record<string, string>): NodeJS.ProcessEnv => ({ NODE_ENV: 'test', ...values })

describe('PhonePe configuration', () => {
  it('is unavailable without complete credentials', () => {
    expect(phonePeConfig(env({ ...credentials, PHONEPE_CLIENT_SECRET: '' }))).toBeNull()
    expect(phonePeConfig(env({ PHONEPE_CLIENT_ID: 'your-client-id' }))).toBeNull()
  })

  it('uses documented sandbox and production bases', () => {
    const sandbox = phonePeConfig(env({ ...credentials, PHONEPE_ENV: 'sandbox' }))
    const production = phonePeConfig(env({ ...credentials, PHONEPE_ENV: 'production' }))
    expect(sandbox?.authBase).toBe('https://api-preprod.phonepe.com/apis/pg-sandbox')
    expect(sandbox?.apiBase).toBe('https://api-preprod.phonepe.com/apis/pg-sandbox')
    expect(production?.authBase).toBe('https://api.phonepe.com/apis/identity-manager')
    expect(production?.apiBase).toBe('https://api.phonepe.com/apis/pg')
    expect(() => phonePeEnvironment(env({ PHONEPE_ENV: 'staging' }))).toThrow()
    expect(phonePeConfig(env({ ...credentials, PHONEPE_ENV: 'staging' }))).toBeNull()
  })

  it('defaults safely and clamps payment expiry', () => {
    const config = phonePeConfig(env({ ...credentials, PHONEPE_PAYMENT_EXPIRY_MINUTES: '99' }))
    expect(config?.authWorkflow).toBe('TRANSACTION')
    expect(config?.deviceOs).toBe('ANDROID')
    expect(config?.upiTargetApp).toBe('com.phonepe.app')
    expect(config?.paymentExpiryMinutes).toBe(15)
    expect(phonePeConfig(env({ ...credentials, PHONEPE_AUTH_WORKFLOW: 'UNKNOWN' }))).toBeNull()
  })

  it('requires webhook credentials and prefers HMAC', () => {
    expect(phonePeWebhookConfig(env({}))).toBeNull()
    expect(
      phonePeWebhookConfig(env({
        PHONEPE_WEBHOOK_USERNAME: 'merchant',
        PHONEPE_WEBHOOK_PASSWORD: 'password',
      })),
    ).toEqual({ method: 'sha', username: 'merchant', password: 'password', encoding: 'hex' })
    expect(
      phonePeWebhookConfig(env({
        PHONEPE_WEBHOOK_KEY_ID: 'key-1',
        PHONEPE_WEBHOOK_SECRET: 'webhook-secret',
        PHONEPE_WEBHOOK_USERNAME: 'merchant',
        PHONEPE_WEBHOOK_PASSWORD: 'password',
      })),
    ).toEqual({ method: 'hmac', keyId: 'key-1', secret: 'webhook-secret' })
  })
})
