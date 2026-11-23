import { toResponse } from '@/server/http/result'
import { getNews } from '@/server/modules/news/service'

export async function GET(request: Request) {
  return toResponse(await getNews(request))
}
