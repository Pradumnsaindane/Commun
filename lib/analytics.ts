import { recordProductEvent } from '@/features/analytics/api'

export type ProductEvent = 'signup_completed' | 'onboarding_completed' | 'article_viewed' | 'article_created' | 'article_published' | 'article_liked' | 'article_saved' | 'comment_created' | 'discussion_created' | 'reply_created' | 'follow_created' | 'notification_opened' | 'report_created'

export function track(event: ProductEvent, metadata?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return
  void recordProductEvent(event, window.location.pathname, metadata).catch(() => {})
}
