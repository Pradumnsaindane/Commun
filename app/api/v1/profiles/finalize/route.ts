import { toResponse } from '@/server/http/result'
import { finalizeProfile } from '@/server/modules/profiles/service'

export async function POST(request: Request) {
  return toResponse(await finalizeProfile(request))
}
