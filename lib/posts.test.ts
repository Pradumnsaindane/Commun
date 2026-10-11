import { describe, expect, it } from 'vitest'
import {
  escapeHtml,
  isActiveProfile,
  postInputSchema,
  readingTime,
  renderMarkdown,
  slugify,
} from './posts'

describe('article publishing, slugification, and markdown rendering', () => {
  it('validates post input schema properly', () => {
    const valid = postInputSchema.safeParse({
      title: 'Building Distributed Cache in Go',
      excerpt: 'A short guide to distributed key-value stores.',
      body: 'Content here...',
      status: 'PUBLISHED',
    })
    expect(valid.success).toBe(true)

    const invalid = postInputSchema.safeParse({
      title: '', // empty title not allowed
    })
    expect(invalid.success).toBe(false)
  })

  it('generates clean URL-safe slugs', () => {
    expect(slugify('Zero to Kubernetes in Production!')).toBe('zero-to-kubernetes-in-production')
    expect(slugify('   Next.js 16 & React 19: Full Stack Guide   ')).toBe('nextjs-16-react-19-full-stack-guide')
    expect(slugify('///')).toBe('untitled-article')
  })

  it('calculates reading time realistically based on word count', () => {
    const shortText = 'Hello world'
    expect(readingTime(shortText)).toBe(1)

    const longText = Array(450).fill('word').join(' ')
    expect(readingTime(longText)).toBe(3)
  })

  it('verifies that only active profiles can publish', () => {
    expect(isActiveProfile({ status: 'ACTIVE' })).toBe(true)
    expect(isActiveProfile({ status: 'PENDING_VERIFICATION' })).toBe(false)
    expect(isActiveProfile({ status: 'SUSPENDED' })).toBe(false)
    expect(isActiveProfile(null)).toBe(false)
  })

  it('escapes dangerous HTML tags in markdown input', () => {
    const malicious = '<script>alert("xss")</script> **Safe Bold Text**'
    const rendered = renderMarkdown(malicious)
    expect(rendered).not.toContain('<script>')
    expect(rendered).toContain('&lt;script&gt;')
    expect(rendered).toContain('<strong>Safe Bold Text</strong>')
  })
})
