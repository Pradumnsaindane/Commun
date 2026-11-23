import { apiRequest } from '@/features/api-client'
import type { ProductEvent } from '@/lib/analytics'

/** Best-effort product telemetry; failures are intentionally ignored by callers. */
export function recordProductEvent(
  event: ProductEvent,
  path: string,
  metadata?: Record<string, string | number | boolean>
) {
  return apiRequest<void>('/analytics', {
    method: 'POST',
    body: { event, path, metadata },
    keepalive: true,
  })
}
