import { apiRequest } from '@/features/api-client'
import type { CommentView } from '@shared/index'

export function listComments(postId: string) {
  return apiRequest<{ comments: CommentView[] }>(`/comments?postId=${encodeURIComponent(postId)}`)
}

export function createComment(input: {
  postId: string
  content: string
  parentId?: string | null
}) {
  return apiRequest<{ comment: CommentView }>('/comments', { method: 'POST', body: input })
}
