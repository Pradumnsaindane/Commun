import { toResponse } from '@/server/http/result'
import { deleteNotification } from '@/server/modules/notifications/service'

export async function DELETE(request: Request) {
  return toResponse(await deleteNotification(request))
}
