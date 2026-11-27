import { toResponse } from '@/server/http/result'
import { requestBillingRefund } from '@/server/modules/billing/phonepe-service'

export async function POST(request: Request) {
  return toResponse(await requestBillingRefund(request))
}
