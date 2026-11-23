import { toResponse } from '@/server/http/result'
import { listModerationReports } from '@/server/modules/moderation/service'

export async function GET(request: Request) {
  return toResponse(await listModerationReports(request))
}
