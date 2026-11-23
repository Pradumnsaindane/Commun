import { toResponse } from '@/server/http/result'
import { checkUsernameAvailability } from '@/server/modules/auth/service'

export async function GET(request: Request) {
  return toResponse(await checkUsernameAvailability(request))
}
