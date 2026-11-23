import { toResponse } from '@/server/http/result'
import { createComment, listComments } from '@/server/modules/comments/service'

export async function GET(request: Request) {
  return toResponse(await listComments(request))
}

export async function POST(request: Request) {
  return toResponse(await createComment(request))
}
