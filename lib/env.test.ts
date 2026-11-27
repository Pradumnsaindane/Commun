import { describe, expect, it } from 'vitest'
import {
  getServiceRoleKey,
  getSupabaseAnonKey,
  getSupabasePublishableKey,
  getSupabaseUrl,
  hasServiceRoleConfiguration,
  hasSupabaseConfiguration,
  hasUpstashConfiguration,
  isConfiguredValue,
  isLoopbackHttpUrl,
  isSecretSupabaseKey,
  requireSupabaseConfiguration,
  resolveEnvName,
  validateEnv,
} from './env'

describe('environment configuration detection', () => {
  it('rejects missing, blank, and documented placeholder values', () => {
    expect(isConfiguredValue(undefined)).toBe(false)
    expect(isConfiguredValue(null)).toBe(false)
    expect(isConfiguredValue('   ')).toBe(false)
    expect(isConfiguredValue('https://your-project.supabase.co')).toBe(false)
    expect(isConfiguredValue('server-only-service-role-key')).toBe(false)
    expect(isConfiguredValue('your-kv-token')).toBe(false)
    expect(isConfiguredValue('sk_test_your-secret-key')).toBe(false)
    expect(isConfiguredValue('replace-with-a-long-random-value')).toBe(false)
  })

  it('accepts realistic server values and trims whitespace', () => {
    expect(isConfiguredValue(' https://abcdefghijklmnop.supabase.co ')).toBe(true)
    expect(isConfiguredValue('sb_secret_abcdefghijklmnop')).toBe(true)
    expect(isConfiguredValue('sk_test_51Nabcdefghijklmnop')).toBe(true)
  })

  it('allows loopback HTTP for an isolated local Supabase stack', () => {
    expect(
      hasSupabaseConfiguration({
        NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abcdefghijklmnop',
      })
    ).toBe(true)
    expect(
      hasSupabaseConfiguration({
        NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_abcdefghijklmnop',
      })
    ).toBe(true)
  })

  it('requires an https URL and a publishable key for Supabase', () => {
    expect(
      hasSupabaseConfiguration({
        NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abcdefghijklmnop',
      })
    ).toBe(true)

    expect(
      hasSupabaseConfiguration({
        NEXT_PUBLIC_SUPABASE_URL: 'https://your-project.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'your-publishable-key',
      })
    ).toBe(false)

    expect(
      hasSupabaseConfiguration({
        NEXT_PUBLIC_SUPABASE_URL: 'http://abcdefghijklmnop.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_abcdefghijklmnop',
      })
    ).toBe(false)

    expect(
      hasSupabaseConfiguration({
        NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-anon-key',
      })
    ).toBe(false)
  })

  it('requires a configured project before a service-role key counts', () => {
    expect(
      hasServiceRoleConfiguration({
        NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abcdefghijklmnop',
        SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_abcdefghijklmnop',
      })
    ).toBe(true)

    expect(
      hasServiceRoleConfiguration({
        NEXT_PUBLIC_SUPABASE_URL: 'https://your-project.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'your-publishable-key',
        SUPABASE_SERVICE_ROLE_KEY: 'server-only-service-role-key',
      })
    ).toBe(false)
  })

  it('treats placeholder KV values as unconfigured', () => {
    expect(
      hasUpstashConfiguration({
        KV_REST_API_URL: 'https://your-kv.upstash.io',
        KV_REST_API_TOKEN: 'server-only-kv-token',
      })
    ).toBe(false)

    expect(
      hasUpstashConfiguration({
        UPSTASH_REDIS_REST_URL: 'https://eu1-example-12345.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'AXxxxxyyyyzzzz',
      })
    ).toBe(true)
  })
})

describe('strict environment accessors', () => {
  const localSupabase = {
    NEXT_PUBLIC_APP_ENV: 'local',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54331',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_localtestkey',
  }
  const hostedSupabase = {
    NEXT_PUBLIC_APP_ENV: 'staging',
    NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_hostedtestkey',
    SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_hostedtestkey',
  }

  it('resolves environment names and rejects unknown values', () => {
    expect(resolveEnvName({})).toBe('local')
    expect(resolveEnvName({ NEXT_PUBLIC_APP_ENV: 'staging' })).toBe('staging')
    expect(resolveEnvName({ NEXT_PUBLIC_APP_ENV: 'production' })).toBe('production')
    expect(() => resolveEnvName({ NEXT_PUBLIC_APP_ENV: 'preview' })).toThrow(
      /Unrecognized NEXT_PUBLIC_APP_ENV/
    )
  })

  it('accepts only loopback HTTP URLs as loopback', () => {
    expect(isLoopbackHttpUrl('http://localhost:3000')).toBe(true)
    expect(isLoopbackHttpUrl('http://127.0.0.1:54331')).toBe(true)
    expect(isLoopbackHttpUrl('http://[::1]:54331')).toBe(true)
    expect(isLoopbackHttpUrl('http://example.com')).toBe(false)
    expect(isLoopbackHttpUrl('https://localhost')).toBe(false)
    expect(isLoopbackHttpUrl('not-a-url')).toBe(false)
  })

  it('rejects missing, placeholder, and removed-fallback Supabase URLs', () => {
    expect(() => getSupabaseUrl({ NEXT_PUBLIC_APP_ENV: 'local' })).toThrow(/Missing/)
    expect(() =>
      getSupabaseUrl({
        NEXT_PUBLIC_APP_ENV: 'local',
        NEXT_PUBLIC_SUPABASE_URL: 'https://your-project.supabase.co',
      })
    ).toThrow(/placeholder/)
    expect(() =>
      getSupabaseUrl({
        NEXT_PUBLIC_APP_ENV: 'local',
        NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
      })
    ).toThrow(/removed placeholder fallback/)
  })

  it('never allows a loopback or non-Supabase URL outside local', () => {
    expect(() =>
      getSupabaseUrl({
        NEXT_PUBLIC_APP_ENV: 'staging',
        NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54331',
      })
    ).toThrow(/only allowed in the local environment/)
    expect(() =>
      getSupabaseUrl({
        NEXT_PUBLIC_APP_ENV: 'staging',
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.com',
      })
    ).toThrow(/\*\.supabase\.co/)
    expect(getSupabaseUrl(hostedSupabase)).toBe('https://abcdefghijklmnop.supabase.co')
  })

  it('prefers the publishable key and rejects placeholder anon keys', () => {
    expect(getSupabaseAnonKey(localSupabase)).toBe('sb_publishable_localtestkey')
    expect(getSupabaseAnonKey(hostedSupabase)).toBe('sb_publishable_hostedtestkey')
    expect(() =>
      getSupabaseAnonKey({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'placeholder-anon-key',
      })
    ).toThrow(/removed placeholder fallback/)
    expect(() => getSupabaseAnonKey({ NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-anon-key' })).toThrow(
      /placeholder/
    )
  })

  it('returns null for absent or placeholder service-role keys', () => {
    expect(getServiceRoleKey({})).toBeNull()
    expect(getServiceRoleKey({ SUPABASE_SERVICE_ROLE_KEY: 'server-only-service-role-key' })).toBeNull()
    expect(getServiceRoleKey(hostedSupabase)).toBe('sb_secret_hostedtestkey')
  })

  it('requires a service-role key outside local and reports validation problems', () => {
    expect(() => requireSupabaseConfiguration(localSupabase)).not.toThrow()
    expect(() =>
      requireSupabaseConfiguration({
        NEXT_PUBLIC_APP_ENV: 'staging',
        NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_hostedtestkey',
      })
    ).toThrow(/SUPABASE_SERVICE_ROLE_KEY is required/)
    expect(() => requireSupabaseConfiguration(hostedSupabase)).not.toThrow()

    const validation = validateEnv({
      NEXT_PUBLIC_APP_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-anon-key',
    })
    expect(validation.envName).toBe('production')
    expect(validation.supabase.configured).toBe(false)
    expect(validation.problems.some((p) => p.includes('only allowed in the local environment'))).toBe(
      true
    )
    expect(validation.problems.some((p) => p.includes('SUPABASE_SERVICE_ROLE_KEY'))).toBe(true)
  })
})

describe('publishable key preference and legacy fallback', () => {
  const url = 'https://abcdefghijklmnop.supabase.co'
  const legacyKey = 'sb_publishable_legacykey'
  const newKey = 'sb_publishable_newkey'
  const serviceRoleJwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature'
  const anonJwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.signature'

  it('prefers the publishable key when both names are configured', () => {
    expect(
      getSupabasePublishableKey({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: newKey,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: legacyKey,
      })
    ).toBe(newKey)
    expect(getSupabaseAnonKey({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: newKey })).toBe(newKey)
  })

  it('falls back to the legacy anon key when publishable is blank or a placeholder', () => {
    expect(
      getSupabasePublishableKey({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '   ',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: legacyKey,
      })
    ).toBe(legacyKey)
    expect(
      getSupabasePublishableKey({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'your-publishable-key',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: legacyKey,
      })
    ).toBe(legacyKey)
    expect(hasSupabaseConfiguration({ NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: legacyKey })).toBe(true)
  })

  it('rejects missing or placeholder credentials under both names', () => {
    expect(() => getSupabasePublishableKey({ NEXT_PUBLIC_APP_ENV: 'staging' })).toThrow(/Missing/)
    expect(() =>
      getSupabasePublishableKey({
        NEXT_PUBLIC_APP_ENV: 'staging',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'your-publishable-key',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-anon-key',
      })
    ).toThrow(/placeholder/)
    expect(
      hasSupabaseConfiguration({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'your-publishable-key',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-anon-key',
      })
    ).toBe(false)
  })

  it('never accepts a secret/service-role key as a browser key', () => {
    expect(isSecretSupabaseKey('sb_secret_abcdefghijklmnop')).toBe(true)
    expect(isSecretSupabaseKey(serviceRoleJwt)).toBe(true)
    expect(isSecretSupabaseKey(newKey)).toBe(false)
    expect(isSecretSupabaseKey(anonJwt)).toBe(false)

    expect(() =>
      getSupabasePublishableKey({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_abcdefghijklmnop',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: legacyKey,
      })
    ).toThrow(/service-role\/secret key/)
    expect(() =>
      getSupabasePublishableKey({ NEXT_PUBLIC_SUPABASE_ANON_KEY: serviceRoleJwt })
    ).toThrow(/service-role\/secret key/)
    expect(
      hasSupabaseConfiguration({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: serviceRoleJwt,
      })
    ).toBe(false)
  })

  it('reports the client-safe key in validation for either variable name', () => {
    const viaNew = validateEnv({
      NEXT_PUBLIC_APP_ENV: 'staging',
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: newKey,
      SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_abcdefghijklmnop',
    })
    const viaLegacy = validateEnv({
      NEXT_PUBLIC_APP_ENV: 'staging',
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: legacyKey,
      SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_abcdefghijklmnop',
    })
    expect(viaNew.supabase.publishableKey).toBe(true)
    expect(viaNew.supabase.anonKey).toBe(true)
    expect(viaNew.problems).toHaveLength(0)
    expect(viaLegacy.supabase.publishableKey).toBe(true)
    expect(viaLegacy.problems).toHaveLength(0)
  })
})
