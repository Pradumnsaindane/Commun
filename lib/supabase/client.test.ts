import { describe, expect, it, vi } from 'vitest'

const createBrowserClientMock = vi.fn(() => ({ mocked: true }))
const getUrlMock = vi.fn(() => 'http://127.0.0.1:54331')
const getKeyMock = vi.fn(() => 'test-public-key')

vi.mock('@supabase/ssr', () => ({ createBrowserClient: createBrowserClientMock }))
vi.mock('@/lib/env-browser', () => ({
  getBrowserSupabaseUrl: getUrlMock,
  getBrowserSupabasePublishableKey: getKeyMock,
}))

describe('browser Supabase client', () => {
  it('passes statically inlined public values to createBrowserClient', async () => {
    const { createClient } = await import('./client')
    expect(createClient()).toMatchObject({ mocked: true })
    expect(getUrlMock).toHaveBeenCalledTimes(1)
    expect(getKeyMock).toHaveBeenCalledTimes(1)
    expect(createBrowserClientMock).toHaveBeenCalledWith('http://127.0.0.1:54331', 'test-public-key')
  })
})
