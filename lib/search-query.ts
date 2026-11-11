/**
 * Safe construction of PostgREST search filters.
 *
 * PostgREST `.or()` / `.ilike()` filters are a small grammar, not a parameterised
 * query language. Interpolating raw user input lets a caller inject `,`, `(`,
 * `)` or `*` and change the filter's structure (for example to bypass a
 * `status = 'ACTIVE'` restriction or to probe unrelated columns).
 *
 * The rules here are deliberately conservative:
 *   1. Collapse and trim whitespace, then normalise the Unicode form.
 *   2. Drop every character that is not a letter, number, space, or one of
 *      `._@+#-`. That removes the PostgREST grammar characters entirely.
 *   3. Cap the length so a filter cannot be inflated.
 *   4. Escape LIKE wildcards (`%`, `_`, `\`) so the term matches literally.
 *
 * Column names are never taken from user input; callers pass a fixed list.
 */

export const SEARCH_TERM_MAX_LENGTH = 80
export const SEARCH_TERM_MIN_LENGTH = 2

const DISALLOWED_CHARACTERS = /[^\p{L}\p{N} ._@+#-]/gu
const LIKE_WILDCARDS = /[\\%_]/g

export function sanitizeSearchTerm(raw: string | null | undefined, maxLength = SEARCH_TERM_MAX_LENGTH): string {
  if (!raw) return ''
  return raw
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(DISALLOWED_CHARACTERS, '')
    .slice(0, Math.max(1, maxLength))
}

export function isSearchableTerm(term: string): boolean {
  return term.length >= SEARCH_TERM_MIN_LENGTH
}

/** Escape LIKE metacharacters so the sanitised term is matched literally. */
export function ilikePattern(term: string): string {
  return `%${term.replace(LIKE_WILDCARDS, (character) => `\\${character}`)}%`
}

/**
 * Build an `.or()` value for a fixed list of columns. Returns null when the
 * term is too short to search, so callers can skip the filter entirely.
 */
export function orIlikeFilter(columns: readonly string[], term: string): string | null {
  if (!columns.length || !isSearchableTerm(term)) return null
  const pattern = ilikePattern(term)
  return columns.map((column) => `${column}.ilike.${pattern}`).join(',')
}

/** A single-column `.ilike()` pattern, or null when the term is too short. */
export function ilikeFilter(term: string): string | null {
  return isSearchableTerm(term) ? ilikePattern(term) : null
}
