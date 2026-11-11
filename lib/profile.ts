import { z } from 'zod'

/**
 * Developer profile rules.
 *
 * New professional fields (headline, location, portfolio, skills,
 * technologies) are part of the Phase 1B migration proposal. Until that
 * migration is applied, writes that include them are retried without the new
 * columns so the existing profile remains editable, and the API reports which
 * fields were skipped.
 */

export const PROFILE_NEW_COLUMNS = ['headline', 'location', 'cover_image_path', 'portfolio_url', 'skills', 'technologies'] as const

export const MAX_LIST_ITEMS = 20
export const MAX_LIST_ITEM_LENGTH = 40

const username = z
  .string()
  .trim()
  .min(3, 'Usernames need at least 3 characters.')
  .max(24, 'Usernames can be at most 24 characters.')
  .regex(/^[a-zA-Z0-9_]+$/, 'Use letters, numbers, and underscores only.')

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(2, 'Enter your name.').max(80).optional(),
  username: username.optional(),
  headline: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(600).optional(),
  location: z.string().trim().max(120).optional(),
  website: z.string().trim().max(300).optional(),
  github: z.string().trim().max(120).optional(),
  portfolioUrl: z.string().trim().max(300).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
  coverImagePath: z.string().trim().max(500).optional(),
  skills: z.array(z.string().trim().min(1).max(MAX_LIST_ITEM_LENGTH)).max(MAX_LIST_ITEMS).optional(),
  technologies: z.array(z.string().trim().min(1).max(MAX_LIST_ITEM_LENGTH)).max(MAX_LIST_ITEMS).optional(),
  interests: z.array(z.string().trim().min(1).max(MAX_LIST_ITEM_LENGTH)).max(MAX_LIST_ITEMS).optional(),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

export const finalizeProfileSchema = z.object({
  displayName: z.string().trim().min(2, 'Enter your name.').max(80),
  username,
  bio: z.string().trim().max(600).optional().default(''),
  headline: z.string().trim().max(120).optional().default(''),
  github: z.string().trim().max(120).optional().default(''),
  website: z.string().trim().max(300).optional().default(''),
  interests: z.array(z.string().trim().min(1).max(MAX_LIST_ITEM_LENGTH)).max(MAX_LIST_ITEMS).default([]),
})

/**
 * Normalise a user-supplied link. Returns null for empty input and throws away
 * anything that is not http(s) — `javascript:` and `data:` URLs never persist.
 */
export function normalizeUrl(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return null
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (!url.hostname.includes('.')) return null
    return url.toString()
  } catch {
    return null
  }
}

/** Accept a GitHub handle or URL and store a canonical profile URL. */
export function normalizeGithub(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return null
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return normalizeUrl(trimmed)
  const handle = trimmed.replace(/^@/, '').replace(/^github\.com\//i, '').split('/')[0]
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(handle)) return null
  return `https://github.com/${handle}`
}

/** Split a comma or newline separated list into a de-duplicated, capped list. */
export function parseList(value: string, max = MAX_LIST_ITEMS): string[] {
  const seen = new Set<string>()
  const items: string[] = []
  for (const raw of value.split(/[,\n]/)) {
    const item = raw.trim().replace(/\s+/g, ' ').slice(0, MAX_LIST_ITEM_LENGTH)
    if (!item) continue
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    items.push(item)
    if (items.length >= max) break
  }
  return items
}

export function formatList(value: string[] | null | undefined): string {
  return (value ?? []).join(', ')
}

/** Strip columns that the live database may not have yet. */
export function toLegacyProfileUpdate(payload: Record<string, unknown>): { legacy: Record<string, unknown>; skipped: string[] } {
  const legacy: Record<string, unknown> = {}
  const skipped: string[] = []
  for (const [key, value] of Object.entries(payload)) {
    if ((PROFILE_NEW_COLUMNS as readonly string[]).includes(key)) {
      skipped.push(key)
      continue
    }
    legacy[key] = value
  }
  return { legacy, skipped }
}

export function isMissingColumnError(error: { code?: string | null; message?: string | null } | null | undefined): boolean {
  if (!error) return false
  if (error.code === 'PGRST204' || error.code === '42703') return true
  const message = (error.message ?? '').toLowerCase()
  return message.includes('could not find') || message.includes('column')
}

export type ProfileCompleteness = { completed: number; total: number; missing: string[] }

const COMPLETENESS_FIELDS: { key: string; label: string }[] = [
  { key: 'display_name', label: 'Display name' },
  { key: 'username', label: 'Username' },
  { key: 'headline', label: 'Headline' },
  { key: 'bio', label: 'Biography' },
  { key: 'avatar_url', label: 'Profile picture' },
  { key: 'skills', label: 'Skills' },
  { key: 'technologies', label: 'Technologies' },
  { key: 'website', label: 'Website or portfolio' },
]

export function profileCompleteness(profile: Record<string, unknown> | null | undefined): ProfileCompleteness {
  if (!profile) return { completed: 0, total: COMPLETENESS_FIELDS.length, missing: COMPLETENESS_FIELDS.map((field) => field.label) }
  const missing = COMPLETENESS_FIELDS.filter((field) => {
    const value = profile[field.key]
    if (Array.isArray(value)) return value.length === 0
    return value === null || value === undefined || String(value).trim() === ''
  }).map((field) => field.label)
  return { completed: COMPLETENESS_FIELDS.length - missing.length, total: COMPLETENESS_FIELDS.length, missing }
}
