import { toResponse } from '@/server/http/result'
import { listAdminAuditLogs } from '@/server/modules/admin/service'

export async function GET(request: Request) {
  return toResponse(await listAdminAuditLogs(request))
}
