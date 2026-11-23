export { hostnameOf } from '../../../lib/social-posts'
export { cn } from '../../../lib/utils'

/** Format an ISO timestamp for display without leaking timezone assumptions. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

/** Initials for avatar fallbacks. */
export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return `${parts[0]![0]}${parts.length > 1 ? parts[parts.length - 1]![0] : ''}`.toUpperCase()
}
