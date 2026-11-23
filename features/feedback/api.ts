import { apiRequest } from '@/features/api-client'

export type FeedbackCategory = 'GENERAL' | 'BUG' | 'FEATURE' | 'CONFUSION'

export function submitFeedback(input: {
  category: FeedbackCategory
  message: string
  path?: string
}) {
  return apiRequest<{ ok: true }>('/feedback', { method: 'POST', body: input })
}
