import { toResponse } from '@/server/http/result'
import {
  clearAllNotifications,
  listNotifications,
  markNotificationsRead,
  rejectNotificationCreate,
} from '@/server/modules/notifications/service'

export async function GET(request: Request) {
  return toResponse(await listNotifications(request))
}

export async function PATCH(request: Request) {
  return toResponse(await markNotificationsRead(request))
}

export async function POST() {
  return toResponse(await rejectNotificationCreate())
}

export async function DELETE() {
  return toResponse(await clearAllNotifications())
}
