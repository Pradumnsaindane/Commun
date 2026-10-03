export type ProductEvent = 'signup_completed' | 'onboarding_completed' | 'article_viewed' | 'article_created' | 'article_published' | 'article_liked' | 'article_saved' | 'comment_created' | 'discussion_created' | 'reply_created' | 'follow_created' | 'notification_opened' | 'report_created'

export function track(event: ProductEvent, metadata?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return
  void fetch('/api/analytics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event, path: window.location.pathname, metadata }), keepalive: true }).catch(() => {})
}
