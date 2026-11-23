import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('enforceRateLimit', () => {
  it('falls back to an in-process window when Upstash is not configured', async () => {
    vi.resetModules()
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    vi.stubEnv('KV_REST_API_URL', '')
    vi.stubEnv('KV_REST_API_TOKEN', '')

    const { enforceRateLimit } = await import('./rate-limit')
    const key = `test-${Date.now()}`

    await expect(enforceRateLimit(key, 'unit-test', 1, '1 m')).resolves.toMatchObject({ success: true })
    await expect(enforceRateLimit(key, 'unit-test', 1, '1 m')).resolves.toMatchObject({ success: false })
  })

  it('falls back to the in-process window when KV values are placeholders', async () => {
    vi.resetModules()
    vi.stubEnv('KV_REST_API_URL', 'https://your-kv.upstash.io')
    vi.stubEnv('KV_REST_API_TOKEN', 'server-only-kv-token')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

    const { enforceRateLimit } = await import('./rate-limit')
    const key = `placeholder-${Date.now()}`

    await expect(enforceRateLimit(key, 'placeholder-test', 1, '1 m')).resolves.toMatchObject({ success: true })
    await expect(enforceRateLimit(key, 'placeholder-test', 1, '1 m')).resolves.toMatchObject({ success: false })
  })
})
