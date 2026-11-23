import { toResponse } from '@/server/http/result'
import { actOnModerationReport, getModerationReport } from '@/server/modules/moderation/service'

type Context = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Context) {
  return toResponse(await getModerationReport(await params))
}

export async function POST(request: Request, { params }: Context) {
  return toResponse(await actOnModerationReport(request, await params))
}
