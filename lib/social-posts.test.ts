import { describe, expect, it } from 'vitest'
import { deriveExcerpt, deriveTitle, isMissingColumnError, isSocialPostType, socialPostSchema } from './social-posts'

describe('composer validation', () => {
  it('accepts text, snippet, and link posts', () => {
    expect(socialPostSchema.safeParse({ type: 'POST', body: 'Shipping a small API client today.' }).success).toBe(true)
    expect(socialPostSchema.safeParse({ type: 'SNIPPET', body: 'const a = 1', language: 'typescript' }).success).toBe(true)
    expect(socialPostSchema.safeParse({ type: 'LINK', linkUrl: 'https://example.dev/post' }).success).toBe(true)
  })

  it('rejects empty bodies, unknown languages, and non-http links', () => {
    expect(socialPostSchema.safeParse({ type: 'POST', body: '   ' }).success).toBe(false)
    expect(socialPostSchema.safeParse({ type: 'SNIPPET', body: 'x', language: 'cobol' }).success).toBe(false)
    expect(socialPostSchema.safeParse({ type: 'LINK', linkUrl: 'javascript:alert(1)' }).success).toBe(false)
    expect(socialPostSchema.safeParse({ type: 'LINK', linkUrl: 'example.dev' }).success).toBe(false)
  })

  it('rejects unknown post types', () => {
    expect(isSocialPostType('POST')).toBe(true)
    expect(isSocialPostType('ARTICLE')).toBe(false)
    expect(socialPostSchema.safeParse({ type: 'ARTICLE', body: 'x' }).success).toBe(false)
  })
})

describe('derived titles and excerpts', () => {
  it('uses the first meaningful line', () => {
    expect(deriveTitle({ type: 'POST', body: '## First line\nsecond' })).toBe('First line')
    expect(deriveTitle({ type: 'POST', body: '```\ncode\n```' })).toBe('code')
  })

  it('falls back to the link host for link posts', () => {
    expect(deriveTitle({ type: 'LINK', linkUrl: 'https://www.example.dev/deep/path' })).toBe('example.dev')
  })

  it('truncates long excerpts', () => {
    const excerpt = deriveExcerpt({ type: 'POST', body: 'word '.repeat(200) }, 60)
    expect(excerpt.length).toBeLessThanOrEqual(60)
    expect(excerpt.endsWith('…')).toBe(true)
  })
})

describe('schema error detection', () => {
  it('recognises PostgREST missing-column responses', () => {
    expect(isMissingColumnError({ code: 'PGRST204' })).toBe(true)
    expect(isMissingColumnError({ message: "Could not find the 'post_type' column" })).toBe(true)
    expect(isMissingColumnError({ code: '23505', message: 'duplicate key' })).toBe(false)
    expect(isMissingColumnError(null)).toBe(false)
  })
})
