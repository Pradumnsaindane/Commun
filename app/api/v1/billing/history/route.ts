import { toResponse } from '@/server/http/result'
import { getBillingHistory } from '@/server/modules/billing/phonepe-service'

export async function GET() {
  return toResponse(await getBillingHistory())
}
