import { describe, expect, it } from 'vitest'
import {
  hasServiceRoleConfiguration,
  hasSupabaseConfiguration,
  hasUpstashConfiguration,
  isConfiguredValue,
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
