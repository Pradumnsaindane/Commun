/**
 * Domain results are transport-agnostic. Services return these values; route
 * adapters are the only layer that knows about HTTP status codes and headers.
 */

export type ServiceIssue = { path: string; message: string }

export type ServiceSuccess<T> = {
  ok: true
  data: T
  status?: number
  headers?: HeadersInit
}

export type ServiceFailure = {
  ok: false
  error: string
  status: number
  headers?: HeadersInit
  issues?: ServiceIssue[]
  code?: string
  skipped?: string[]
  elevated?: boolean
}

export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure

export function success<T>(data: T, status = 200, headers?: HeadersInit): ServiceSuccess<T> {
  return { ok: true, data, status, headers }
}

export function failure(
  error: string,
  status: number,
  extra: Omit<ServiceFailure, 'ok' | 'error' | 'status'> = {}
): ServiceFailure {
  return { ok: false, error, status, ...extra }
}

export function toResponse(result: ServiceResult<unknown>) {
  if (result.ok) {
    // 204 responses must not carry a body; Response.json(null) would throw.
    if (result.status === 204) {
      return new Response(null, { status: 204, headers: result.headers })
    }
    return Response.json(result.data, {
      status: result.status ?? 200,
      headers: result.headers,
    })
  }
  return Response.json(
    {
      error: result.error,
      ...(result.issues ? { issues: result.issues } : {}),
      ...(result.code ? { code: result.code } : {}),
      ...(result.skipped ? { skipped: result.skipped } : {}),
      ...(result.elevated === undefined ? {} : { elevated: result.elevated }),
    },
    { status: result.status, headers: result.headers }
  )
}
