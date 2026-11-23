import { apiRequest } from '@/features/api-client'
import type { DiscussionView, ReplyView } from '@shared/index'

export function listDiscussions() {
  return apiRequest<{ discussions: DiscussionView[] }>('/discussions')
}

export function createDiscussion(input: { title: string; content: string; topicId?: string | null }) {
  return apiRequest<{ discussion: { id: string; title: string; content: string; created_at: string } }>(
    '/discussions',
    { method: 'POST', body: input }
  )
}

export function listReplies(discussionId: string) {
  return apiRequest<{ replies: ReplyView[] }>(`/replies?discussionId=${encodeURIComponent(discussionId)}`)
}

export function createReply(input: { discussionId: string; content: string; parentId?: string | null }) {
  return apiRequest<{ reply: ReplyView }>('/replies', { method: 'POST', body: input })
}
