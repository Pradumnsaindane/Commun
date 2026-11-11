/**
 * Mention parsing for notifications.
 *
 * Mentions are resolved server-side against real profiles; unresolved names are
 * ignored so a post can never create a notification for a non-existent account.
 */

export const MAX_MENTIONS_PER_POST = 5

const MENTION_PATTERN = /@([a-zA-Z0-9_]{3,30})/g

export function extractMentions(text: string | null | undefined, limit = MAX_MENTIONS_PER_POST): string[] {
  if (!text) return []
  const found: string[] = []
  const seen = new Set<string>()
  for (const match of text.matchAll(MENTION_PATTERN)) {
    const handle = match[1].toLowerCase()
    if (seen.has(handle)) continue
    seen.add(handle)
    found.push(handle)
    if (found.length >= limit) break
  }
  return found
}

export function mentionsUser(text: string | null | undefined, username: string | null | undefined): boolean {
  if (!username) return false
  return extractMentions(text, 100).includes(username.toLowerCase())
}
