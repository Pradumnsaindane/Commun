import { toResponse } from '@/server/http/result'
import { listOwnReports, submitReport } from '@/server/modules/reports/service'

export async function GET() {
  return toResponse(await listOwnReports())
}

export async function POST(request: Request) {
  return toResponse(await submitReport(request))
}
