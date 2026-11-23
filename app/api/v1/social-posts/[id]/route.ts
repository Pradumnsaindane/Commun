import { toResponse } from '@/server/http/result'
import { deleteSocialPost, updateSocialPost } from '@/server/modules/social-posts/service'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params
  return toResponse(await updateSocialPost(id, request))
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params
  return toResponse(await deleteSocialPost(id))
}
