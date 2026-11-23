/**
 * Shared HTTP response helpers for route adapters.
 *
 * Route handlers stay thin: they translate a domain result into a status code
 * and a JSON body. Domain services never construct HTTP responses.
 */

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export function jsonOk(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers })
}

export function jsonPrivate(data: unknown, status = 200) {
  return jsonOk(data, status, { 'cache-control': 'private, no-store' })
}

export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
