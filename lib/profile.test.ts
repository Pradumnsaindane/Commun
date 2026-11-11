import { describe, expect, it } from 'vitest'
import {
  finalizeProfileSchema,
  formatList,
  isMissingColumnError,
  normalizeGithub,
  normalizeUrl,
  parseList,
  profileCompleteness,
  profileUpdateSchema,
  toLegacyProfileUpdate,
} from './profile'

describe('profile validation', () => {
  it('accepts a realistic profile update', () => {
    const parsed = profileUpdateSchema.safeParse({
      displayName: 'Alex Rivera',
      username: 'alex_rivera',
      headline: 'Backend engineer working on distributed systems',
      bio: 'I build APIs and write about reliability.',
      location: 'Berlin, Germany',
      website: 'https://alex.dev',
      github: 'alexrivera',
      skills: ['Go', 'PostgreSQL'],
      technologies: ['Docker', 'Kubernetes'],
      interests: ['Databases'],
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects invalid usernames and oversized fields', () => {
    expect(profileUpdateSchema.safeParse({ username: 'no spaces' }).success).toBe(false)
    expect(profileUpdateSchema.safeParse({ username: 'ab' }).success).toBe(false)
    expect(profileUpdateSchema.safeParse({ headline: 'x'.repeat(121) }).success).toBe(false)
    expect(profileUpdateSchema.safeParse({ skills: Array(21).fill('Go') }).success).toBe(false)
  })

  it('requires name and username when finalizing onboarding', () => {
    expect(finalizeProfileSchema.safeParse({ displayName: 'Alex', username: 'alex_rivera' }).success).toBe(true)
    expect(finalizeProfileSchema.safeParse({ displayName: '', username: 'alex_rivera' }).success).toBe(false)
    expect(finalizeProfileSchema.safeParse({ displayName: 'Alex', username: 'a' }).success).toBe(false)
  })
})

describe('link normalisation', () => {
  it('adds https and accepts valid hosts', () => {
    expect(normalizeUrl('alex.dev')).toBe('https://alex.dev/')
    expect(normalizeUrl('https://alex.dev/work')).toBe('https://alex.dev/work')
  })

  it('refuses dangerous or malformed links', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeUrl('data:text/html,<script>')).toBeNull()
    expect(normalizeUrl('not a url')).toBeNull()
    expect(normalizeUrl('')).toBeNull()
  })

  it('canonicalises GitHub handles', () => {
    expect(normalizeGithub('@alex')).toBe('https://github.com/alex')
    expect(normalizeGithub('github.com/alex/repo')).toBe('https://github.com/alex')
    expect(normalizeGithub('https://github.com/alex')).toBe('https://github.com/alex')
    expect(normalizeGithub('!!')).toBeNull()
  })
})

describe('list handling and schema fallbacks', () => {
  it('parses, de-duplicates, and caps lists', () => {
    expect(parseList('Go, postgresql , Go\nDocker')).toEqual(['Go', 'postgresql', 'Docker'])
    expect(parseList(Array.from({ length: 30 }, (_, index) => `skill${index}`).join(','))).toHaveLength(20)
    expect(formatList(['Go', 'SQL'])).toBe('Go, SQL')
  })

  it('strips columns the live schema may not have yet', () => {
    const { legacy, skipped } = toLegacyProfileUpdate({ display_name: 'Alex', headline: 'Hi', skills: ['Go'], location: 'Berlin' })
    expect(legacy).toEqual({ display_name: 'Alex' })
    expect(skipped).toEqual(['headline', 'skills', 'location'])
  })

  it('recognises missing-column errors', () => {
    expect(isMissingColumnError({ code: 'PGRST204' })).toBe(true)
    expect(isMissingColumnError({ message: "Could not find the 'skills' column" })).toBe(true)
    expect(isMissingColumnError({ code: '23505' })).toBe(false)
  })

  it('reports profile completeness from real fields', () => {
    const result = profileCompleteness({ display_name: 'Alex', username: 'alex', skills: [], technologies: ['Go'] })
    expect(result.total).toBe(8)
    expect(result.missing).toContain('Headline')
    expect(result.missing).toContain('Skills')
    expect(result.missing).not.toContain('Technologies')
  })
})
