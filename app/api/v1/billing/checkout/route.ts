import { toResponse } from '@/server/http/result'
import { createCheckout } from '@/server/modules/billing/service'

export async function POST(request: Request) {
  return toResponse(await createCheckout(request))
}
