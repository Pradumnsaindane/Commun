import { toResponse } from '@/server/http/result'
import { recordProductEvent } from '@/server/modules/product-telemetry/service'

export async function POST(request: Request) {
  return toResponse(await recordProductEvent(request))
}
