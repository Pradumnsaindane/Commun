import { apiRequest } from '@/features/api-client'
import type { InteractionState } from '@shared/index'

export type InteractionAction = 'like' | 'unlike' | 'save' | 'unsave'

export function getPostInteraction(postId: string) {
  return apiRequest<InteractionState>(`/reactions?postId=${encodeURIComponent(postId)}`)
}

export function togglePostInteraction(postId: string, action: InteractionAction) {
  return apiRequest<{ ok: true; active: boolean }>('/reactions', {
    method: 'POST',
    body: { postId, action },
  })
}

export function followDeveloper(followingId: string) {
  return apiRequest<{ following: true }>('/follows', {
    method: 'POST',
    body: { followingId },
  })
}

export function unfollowDeveloper(followingId: string) {
  return apiRequest<{ following: false }>('/follows', {
    method: 'DELETE',
    body: { followingId },
  })
}
