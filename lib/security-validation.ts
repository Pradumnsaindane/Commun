export const TRUSTED_NOTIFICATION_TYPES = ['LIKE', 'COMMENT', 'REPLY', 'FOLLOW', 'NEW_POST', 'MODERATION'] as const
export type TrustedNotificationType = (typeof TRUSTED_NOTIFICATION_TYPES)[number]

export function isTrustedNotificationType(value: string): value is TrustedNotificationType {
  return TRUSTED_NOTIFICATION_TYPES.includes(value as TrustedNotificationType)
}

export function nextReplyDepth(parentDepth: number | null): number | null {
  if (parentDepth === null) return 0
  if (!Number.isInteger(parentDepth) || parentDepth < 0 || parentDepth >= 2) return null
  return parentDepth + 1
}
