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

export function updateComment(commentId: string, content: string) {
  return apiRequest<{ comment: CommentView }>(`/comments/${commentId}`, { method: 'PATCH', body: { content } })
}

export function deleteComment(commentId: string) {
  return apiRequest<void>(`/comments/${commentId}`, { method: 'DELETE' })
}
