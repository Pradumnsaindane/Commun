import { toResponse } from '@/server/http/result'
import { deleteComment, updateComment } from '@/server/modules/comments/service'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return toResponse(await updateComment(request, id))
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return toResponse(await deleteComment(request, id))
}
