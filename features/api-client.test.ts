import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, NetworkError, SessionExpiredError, apiRequest } from './api-client'

type MockResponse = { ok?: boolean; status?: number; jsonPayload?: unknown }

function mockFetch(response: MockResponse) {
  const json = vi.fn(async () => response.jsonPayload ?? null)
  const fetchMock = vi.fn(async () => ({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json,
  }))
  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, json }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiRequest', () => {
  it('targets the versioned API and serializes JSON payloads', async () => {
    const { fetchMock } = mockFetch({ jsonPayload: { ok: true } })

    await expect(apiRequest('/profiles', { method: 'PATCH', body: { displayName: 'Ada' } })).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/profiles', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: '{"displayName":"Ada"}',
    })
  })

  it('returns undefined for 204 responses without parsing a body', async () => {
    const { json } = mockFetch({ ok: true, status: 204 })

    await expect(apiRequest<void>('/social-posts/id', { method: 'DELETE' })).resolves.toBeUndefined()
    expect(json).not.toHaveBeenCalled()
  })

  it('maps 401 responses to a session error and preserves the server message', async () => {
    mockFetch({ ok: false, status: 401, jsonPayload: { error: 'Authentication required.' } })

    await expect(apiRequest('/feed')).rejects.toMatchObject({
      name: 'SessionExpiredError',
      message: 'Authentication required.',
      status: 401,
    })
  })

  it('maps transport failures to a network error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed') }))

    await expect(apiRequest('/feed')).rejects.toBeInstanceOf(NetworkError)
  })

  it('uses a safe generic message for malformed 500 responses', async () => {
    mockFetch({ ok: false, status: 500 })

    await expect(apiRequest('/posts')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'The service is temporarily unavailable.',
      status: 500,
    })
  })

  it('exposes structured validation issues on API errors', async () => {
    mockFetch({
      ok: false,
      status: 422,
      jsonPayload: { error: 'Invalid request.', issues: [{ path: 'title', message: 'Required' }] },
    })

    const error = await apiRequest('/posts').catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).payload?.issues).toEqual([{ path: 'title', message: 'Required' }])
  })

  it('ignores malformed error envelopes instead of trusting their shape', async () => {
    mockFetch({
      ok: false,
      status: 400,
      jsonPayload: { error: { nested: 'not a string' }, issues: 'not an array' },
    })

    const error = await apiRequest('/posts').catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).payload).toBeNull()
    expect((error as ApiError).message).toBe('The request could not be completed.')
  })

  it('does not prefix absolute URLs', async () => {
    const { fetchMock } = mockFetch({ jsonPayload: { ok: true } })

    await apiRequest('https://example.test/api/health')
    expect(fetchMock).toHaveBeenCalledWith('https://example.test/api/health', expect.anything())
  })

  it('exports a session-specific error subclass', () => {
    expect(new SessionExpiredError()).toBeInstanceOf(ApiError)
  })
})
