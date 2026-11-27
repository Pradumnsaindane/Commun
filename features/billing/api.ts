import { ApiError, apiRequest } from '@/features/api-client'

function requireRedirectUrl(payload: { url?: string | null }, fallback: string): string {
  if (!payload.url) throw new ApiError(fallback, 502)
  return payload.url
}

export function startMembershipCheckout(creatorId: string) {
  return apiRequest<{ url: string }>('/billing/checkout', {
    method: 'POST',
    body: { creatorId },
  }).then((payload) => requireRedirectUrl(payload, 'Checkout could not be created.'))
}

export function cancelMembership() {
  return apiRequest<{ status: string }>('/billing/cancel', { method: 'POST' })
}

export function openBillingPortal() {
  return apiRequest<{ url: string }>('/billing/portal', { method: 'POST' }).then((payload) =>
    requireRedirectUrl(payload, 'Billing portal unavailable.')
  )
}

export function startConnectOnboarding() {
  return apiRequest<{ url: string }>('/billing/connect', { method: 'POST' }).then((payload) =>
    requireRedirectUrl(payload, 'Onboarding link unavailable.')
  )
}
