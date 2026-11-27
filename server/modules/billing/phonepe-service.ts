import { getAuthContext } from '@/lib/auth'
import { failure, type ServiceResult } from '@/server/http/result'
import {
  cancelPhonePeMembership,
  getPhonePeBillingHistory,
  requestPhonePeRefund,
} from '@/server/modules/billing/providers/phonepe'

export async function cancelBillingSubscription(request: Request): Promise<ServiceResult<{ status: 'canceled' }>> {
  const context = await getAuthContext()
  if (!context) return failure('Sign in to manage billing.', 401)
  return cancelPhonePeMembership(request, context)
}

export async function requestBillingRefund(request: Request) {
  const context = await getAuthContext()
  if (!context) return failure('Sign in to request a refund.', 401)
  return requestPhonePeRefund(request, context)
}

export async function getBillingHistory() {
  const context = await getAuthContext()
  if (!context) return failure('Sign in to view billing history.', 401)
  return getPhonePeBillingHistory(context)
}
