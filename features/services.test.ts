import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiRequestMock = vi.fn()

vi.mock('@/features/api-client', () => ({
  ApiError: class ApiError extends Error {
    readonly status: number

    constructor(message: string, status: number) {
      super(message)
      this.name = 'ApiError'
      this.status = status
    }
  },
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}))

import { updateAdminUser } from '@/features/admin/api'
import { recordProductEvent } from '@/features/analytics/api'
import { openBillingPortal, startMembershipCheckout } from '@/features/billing/api'
import { submitFeedback } from '@/features/feedback/api'
import { actOnReport, submitReport } from '@/features/moderation/api'

beforeEach(() => {
  apiRequestMock.mockReset()
})

describe('feature API services', () => {
  it('starts membership checkout through the versioned billing endpoint', async () => {
    apiRequestMock.mockResolvedValue({ url: 'https://checkout.test/session' })

    await expect(startMembershipCheckout('creator-1')).resolves.toBe('https://checkout.test/session')
    expect(apiRequestMock).toHaveBeenCalledWith('/billing/checkout', {
      method: 'POST',
      body: { creatorId: 'creator-1' },
    })
  })

  it('rejects a billing response without a redirect URL', async () => {
    apiRequestMock.mockResolvedValue({})

    await expect(openBillingPortal()).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Billing portal unavailable.',
    })
  })

  it('encodes report ids when acting on a report', async () => {
    apiRequestMock.mockResolvedValue({ ok: true })

    await actOnReport('report/1', 'REMOVE')
    expect(apiRequestMock).toHaveBeenCalledWith('/moderation/reports/report%2F1', {
      method: 'POST',
      body: { action: 'REMOVE' },
    })
  })

  it('submits reports and feedback to their canonical endpoints', async () => {
    apiRequestMock.mockResolvedValue({ ok: true })

    await submitReport({ targetType: 'POST', targetId: 'post-1', reason: 'SPAM' })
    expect(apiRequestMock).toHaveBeenLastCalledWith('/reports', {
      method: 'POST',
      body: { targetType: 'POST', targetId: 'post-1', reason: 'SPAM' },
    })

    await submitFeedback({ category: 'BUG', message: 'Something broke', path: '/feed' })
    expect(apiRequestMock).toHaveBeenLastCalledWith('/feedback', {
      method: 'POST',
      body: { category: 'BUG', message: 'Something broke', path: '/feed' },
    })
  })

  it('keeps product analytics best-effort with keepalive', async () => {
    apiRequestMock.mockResolvedValue(undefined)

    await recordProductEvent('article_viewed', '/post/example', { postId: 'post-1' })
    expect(apiRequestMock).toHaveBeenCalledWith('/analytics', {
      method: 'POST',
      body: {
        event: 'article_viewed',
        path: '/post/example',
        metadata: { postId: 'post-1' },
      },
      keepalive: true,
    })
  })

  it('routes admin user changes through the versioned admin endpoint', async () => {
    apiRequestMock.mockResolvedValue({ ok: true })

    await updateAdminUser({ userId: 'user-1', status: 'SUSPENDED' })
    expect(apiRequestMock).toHaveBeenCalledWith('/admin/users', {
      method: 'PATCH',
      body: { userId: 'user-1', status: 'SUSPENDED' },
    })
  })
})
