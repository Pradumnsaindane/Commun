import { toResponse } from '@/server/http/result'
import { createReply, getReplies } from '@/server/modules/discussions/service'

export async function GET(request: Request) {
  return toResponse(await getReplies(request))
}

export async function POST(request: Request) {
  return toResponse(await createReply(request))
}
