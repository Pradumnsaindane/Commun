import { toResponse } from '@/server/http/result'
import { getOwnProfile, updateOwnProfile } from '@/server/modules/profiles/service'

export async function GET() {
  return toResponse(await getOwnProfile())
}

export async function PATCH(request: Request) {
  return toResponse(await updateOwnProfile(request))
}
