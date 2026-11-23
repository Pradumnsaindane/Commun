import { toResponse } from '@/server/http/result'
import { listAdminUsers, updateAdminUser } from '@/server/modules/admin/service'

export async function GET(request: Request) {
  return toResponse(await listAdminUsers(request))
}

export async function PATCH(request: Request) {
  return toResponse(await updateAdminUser(request))
}
