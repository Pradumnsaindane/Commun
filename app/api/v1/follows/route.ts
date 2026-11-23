import { toResponse } from '@/server/http/result'
import { followDeveloper, unfollowDeveloper } from '@/server/modules/interactions/service'

export async function POST(request: Request) {
  return toResponse(await followDeveloper(request))
}

export async function DELETE(request: Request) {
  return toResponse(await unfollowDeveloper(request))
}
