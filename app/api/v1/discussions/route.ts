import { toResponse } from '@/server/http/result'
import { createDiscussion, getDiscussions } from '@/server/modules/discussions/service'

export async function GET() {
  return toResponse(await getDiscussions())
}

export async function POST(request: Request) {
  return toResponse(await createDiscussion(request))
}
