import { describe, expect, it } from 'vitest'
import { ilikeFilter, ilikePattern, isSearchableTerm, orIlikeFilter, sanitizeSearchTerm } from './search-query'

describe('search term sanitisation', () => {
  it('keeps ordinary developer search terms intact', () => {
    expect(sanitizeSearchTerm('  Next.js 16  ')).toBe('Next.js 16')
    expect(sanitizeSearchTerm('C++')).toBe('C++')
    expect(sanitizeSearchTerm('@alex_99')).toBe('@alex_99')
  })

  it('removes PostgREST grammar characters that could alter a filter', () => {
    expect(sanitizeSearchTerm('alex,status.eq.SUSPENDED')).toBe('alexstatus.eq.SUSPENDED')
    expect(sanitizeSearchTerm('alex),or(id.not.is.null')).toBe('alexorid.not.is.null')
    expect(sanitizeSearchTerm('a*b(c)d')).toBe('abcd')
  })

  it('drops quotes and backslashes used to break out of a filter value', () => {
    expect(sanitizeSearchTerm('"alex\\')).toBe('alex')
    expect(sanitizeSearchTerm("O'Brien; drop table")).toBe('OBrien drop table')
  })

  it('caps the length of a term', () => {
    const long = 'a'.repeat(400)
    expect(sanitizeSearchTerm(long).length).toBe(80)
    expect(sanitizeSearchTerm(long, 10).length).toBe(10)
  })

  it('requires a minimum length before searching', () => {
    expect(isSearchableTerm('')).toBe(false)
    expect(isSearchableTerm('a')).toBe(false)
    expect(isSearchableTerm('ab')).toBe(true)
  })
})

describe('PostgREST filter construction', () => {
  it('builds an or-filter only from sanitised input', () => {
    const filter = orIlikeFilter(['display_name', 'username', 'bio'], sanitizeSearchTerm('alex,or(1=1)'))
    expect(filter).toBe('display_name.ilike.%alexor11%,username.ilike.%alexor11%,bio.ilike.%alexor11%')
    expect(filter).not.toContain(',or(')
  })

  it('returns null instead of an empty or unsafe filter', () => {
    expect(orIlikeFilter(['username'], '')).toBeNull()
    expect(orIlikeFilter(['username'], 'a')).toBeNull()
    expect(orIlikeFilter([], 'alex')).toBeNull()
  })

  it('escapes LIKE wildcards so they match literally', () => {
    expect(ilikePattern('100%_done')).toBe('%100\\%\\_done%')
    expect(ilikeFilter('alex')).toBe('%alex%')
    expect(ilikeFilter('a')).toBeNull()
  })
})
