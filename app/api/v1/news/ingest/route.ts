import { toResponse } from '@/server/http/result'
import { ingestNews } from '@/server/modules/news/service'

export async function POST(request: Request) {
  return toResponse(await ingestNews(request))
}
