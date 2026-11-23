import { toResponse } from '@/server/http/result'
import { getFeed } from '@/server/modules/feed/service'

export async function GET(request: Request) {
  return toResponse(await getFeed(request))
}
