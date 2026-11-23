import { toResponse } from '@/server/http/result'
import { search } from '@/server/modules/search/service'

export async function GET(request: Request) {
  return toResponse(await search(request))
}
