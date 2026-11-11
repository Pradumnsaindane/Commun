import { z } from 'zod'
import { HIGHLIGHT_LANGUAGES } from './highlight'

/**
 * Composer input for social post types.
 *
 * Articles keep using `postInputSchema` in lib/posts.ts; this schema covers the
 * new short forms. Persistence requires the Phase 1B columns (`post_type`,
 * `language`, `link_url`) — see supabase/proposed_phase_1b_social.sql. When the
 * database has not been updated, the API returns an explicit schema error
 * instead of silently writing an article-shaped row.
 */

export const SOCIAL_POST_TYPES = ['POST', 'SNIPPET', 'LINK'] as const
export type SocialPostType = (typeof SOCIAL_POST_TYPES)[number]

export const MAX_POST_LENGTH = 3000
export const MAX_SNIPPET_LENGTH = 8000
export const MAX_TITLE_LENGTH = 120

const httpUrl = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((value) => /^https?:\/\//i.test(value), 'Use a full http(s) link.')

export const socialPostSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('POST'), body: z.string().trim().min(1, 'Write something first.').max(MAX_POST_LENGTH), title: z.string().trim().max(MAX_TITLE_LENGTH).optional() }),
  z.object({
    type: z.literal('SNIPPET'),
    body: z.string().trim().min(1, 'Paste the code you want to share.').max(MAX_SNIPPET_LENGTH),
    language: z.enum(HIGHLIGHT_LANGUAGES),
    title: z.string().trim().max(MAX_TITLE_LENGTH).optional(),
  }),
  z.object({
    type: z.literal('LINK'),
    linkUrl: httpUrl,
    body: z.string().trim().max(MAX_POST_LENGTH).optional(),
    title: z.string().trim().max(MAX_TITLE_LENGTH).optional(),
  }),
])

export type SocialPostInput = z.infer<typeof socialPostSchema>

export function isSocialPostType(value: string): value is SocialPostType {
  return (SOCIAL_POST_TYPES as readonly string[]).includes(value)
}

/** Derive a human title from the first meaningful line of the input. */
export function deriveTitle(input: SocialPostInput): string {
  if ('title' in input && input.title?.trim()) return input.title.trim().slice(0, MAX_TITLE_LENGTH)
  const source = input.type === 'LINK' ? input.body?.trim() || hostnameOf(input.linkUrl) : input.body
  const firstLine = (source ?? '')
    .split('\n')
    .map((line) => line.replace(/^[#>\s]+/, '').replace(/[`*_]/g, '').trim())
    .find((line) => line.length > 0)
  if (!firstLine) return input.type === 'LINK' ? 'Shared link' : 'Untitled post'
  return firstLine.slice(0, MAX_TITLE_LENGTH)
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Short excerpt used by the feed for non-article posts. */
export function deriveExcerpt(input: SocialPostInput, limit = 280): string {
  const source = input.type === 'LINK' ? input.body ?? hostnameOf(input.linkUrl) : input.body
  const text = (source ?? '').replace(/\s+/g, ' ').trim()
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text
}

export function readingMinutesFor(text: string): number {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 200))
}

/**
 * PostgREST reports a missing column as PGRST204 (and sometimes mentions the
 * column in the message). Callers translate that into an actionable error
 * rather than a generic 500.
 */
export function isMissingColumnError(error: { code?: string | null; message?: string | null } | null | undefined): boolean {
  if (!error) return false
  if (error.code === 'PGRST204' || error.code === '42703') return true
  const message = (error.message ?? '').toLowerCase()
  return message.includes('could not find') || message.includes('column')
}
