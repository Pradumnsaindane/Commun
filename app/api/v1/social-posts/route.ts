import { toResponse } from '@/server/http/result'
import { createSocialPost } from '@/server/modules/social-posts/service'

export async function POST(request: Request) {
  return toResponse(await createSocialPost(request))
}
