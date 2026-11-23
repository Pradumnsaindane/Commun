import { toResponse } from '@/server/http/result'
import { deletePost, getPost, updatePost } from '@/server/modules/posts/service'

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(_: Request, context: RouteContext) {
  const { slug } = await context.params
  return toResponse(await getPost(slug))
}

export async function PATCH(request: Request, context: RouteContext) {
  const { slug } = await context.params
  return toResponse(await updatePost(slug, request))
}

export async function DELETE(_: Request, context: RouteContext) {
  const { slug } = await context.params
  return toResponse(await deletePost(slug))
}
