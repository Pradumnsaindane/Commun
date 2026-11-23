import { toResponse } from '@/server/http/result'
import { getPostInteraction, togglePostInteraction } from '@/server/modules/interactions/service'

export async function GET(request: Request) {
  return toResponse(await getPostInteraction(request))
}

export async function POST(request: Request) {
  return toResponse(await togglePostInteraction(request))
}
