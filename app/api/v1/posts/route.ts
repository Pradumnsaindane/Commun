import { toResponse } from '@/server/http/result'
import { createPost, listPosts } from '@/server/modules/posts/service'

export async function GET(request: Request) {
  return toResponse(await listPosts(request))
}

export async function POST(request: Request) {
  return toResponse(await createPost(request))
}
