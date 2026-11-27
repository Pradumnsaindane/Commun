import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('browser environment access', () => {
  it('reads statically inlined local values and preserves validation', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'local')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54331')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'test-publishable-key')
    vi.resetModules()

    const env = await import('./env-browser')
    expect(env.browserEnv.NEXT_PUBLIC_SUPABASE_URL).toBe('http://127.0.0.1:54331')
    expect(env.getBrowserSupabaseUrl()).toBe('http://127.0.0.1:54331')
    expect(env.getBrowserSupabasePublishableKey()).toBe('test-publishable-key')
    expect(env.getBrowserEnvName()).toBe('local')
  })

  it('preserves the legacy publishable-key fallback in staging', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'staging')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'legacy-public-key')
    vi.resetModules()

    const env = await import('./env-browser')
    expect(env.getBrowserSupabasePublishableKey()).toBe('legacy-public-key')
    expect(env.getBrowserEnvName()).toBe('staging')
  })

  it('fails fast when the browser URL is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'local')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'test-publishable-key')
    vi.resetModules()

    const env = await import('./env-browser')
    expect(() => env.getBrowserSupabaseUrl()).toThrow(/Missing NEXT_PUBLIC_SUPABASE_URL/)
  })

  it('fails fast when no browser-safe key is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54331')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    vi.resetModules()

    const env = await import('./env-browser')
    expect(() => env.getBrowserSupabasePublishableKey()).toThrow(
      /Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/
    )
  })

  it('rejects a secret-shaped key before it can reach the browser', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54331')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_secret_not_for_browser')
    vi.resetModules()

    const env = await import('./env-browser')
    expect(() => env.getBrowserSupabasePublishableKey()).toThrow(/service-role\/secret key/)
  })

  it('validates NEXT_PUBLIC_APP_ENV through a static browser reference', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'qa')
    vi.resetModules()

    const env = await import('./env-browser')
    expect(() => env.getBrowserEnvName()).toThrow(/Unrecognized NEXT_PUBLIC_APP_ENV/)
  })
})
