import { toResponse } from '@/server/http/result'
import { submitFeedback } from '@/server/modules/product-telemetry/service'

export async function POST(request: Request) {
  return toResponse(await submitFeedback(request))
}
