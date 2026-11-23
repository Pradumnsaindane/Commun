import { toResponse } from '@/server/http/result'
import { createBillingPortal } from '@/server/modules/billing/service'

export async function POST() {
  return toResponse(await createBillingPortal())
}
