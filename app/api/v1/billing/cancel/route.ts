import { toResponse } from '@/server/http/result'
import { cancelBillingSubscription } from '@/server/modules/billing/phonepe-service'

export async function POST(request: Request) {
  return toResponse(await cancelBillingSubscription(request))
}
