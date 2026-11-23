import { toResponse } from '@/server/http/result'
import { getConnectStatus, startConnect } from '@/server/modules/billing/service'

export async function GET() {
  return toResponse(await getConnectStatus())
}

export async function POST() {
  return toResponse(await startConnect())
}
