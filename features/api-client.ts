import { z } from 'zod'
import { API_BASE, type ApiErrorPayload } from '@shared/index'

/** Runtime guard for the error envelope returned by the versioned API. */
const apiErrorPayloadSchema = z.object({
  error: z.string(),
  issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  code: z.string().optional(),
  skipped: z.array(z.string()).optional(),
  elevated: z.boolean().optional(),
}) satisfies z.ZodType<ApiErrorPayload>

/**
 * The only module allowed to build API URLs and translate HTTP failures for
 * frontend features. Components never call `fetch('/api/...')` directly.
 */
export class ApiError extends Error {
  readonly status: number
  readonly payload: ApiErrorPayload | null
  readonly headers: Headers | null

  constructor(
    message: string,
    status: number,
    payload: ApiErrorPayload | null = null,
    headers: Headers | null = null
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
    this.headers = headers
  }
}

export class SessionExpiredError extends ApiError {
  constructor(message = 'Your session has expired. Sign in again.', headers: Headers | null = null) {
    super(message, 401, null, headers)
    this.name = 'SessionExpiredError'
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'The service is temporarily unavailable. Try again shortly.') {
    super(message, 0)
    this.name = 'NetworkError'
  }
}

export type ApiRequestInit = Omit<RequestInit, 'body'> & { body?: unknown }

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const url = /^https?:\/\//.test(path) ? path : `${API_BASE}${path}`
  const { body, headers, ...rest } = init

  let response: Response
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new NetworkError()
  }

  if (response.status === 204) return undefined as T

  const payload: unknown = await response.json().catch(() => null)
  const parsedError = apiErrorPayloadSchema.safeParse(payload)
  const errorPayload: ApiErrorPayload | null = parsedError.success ? parsedError.data : null

  if (!response.ok) {
    const message = errorPayload?.error ?? (response.status >= 500 ? 'The service is temporarily unavailable.' : 'The request could not be completed.')
    if (response.status === 401) throw new SessionExpiredError(message, response.headers)
    throw new ApiError(message, response.status, errorPayload, response.headers)
  }

  return payload as T
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message || fallback
  return fallback
}
