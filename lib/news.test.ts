import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { categorizeNews, getDeveloperNews, normalizeCanonicalUrl, parseNewsQuery } from './news'

describe('developer news normalization and categorization', () => {
  it('normalizes canonical URLs by stripping tracking parameters', () => {
    const raw = 'https://github.blog/2026-10-01-security-update/?utm_source=twitter&utm_medium=social&ref=feed#header'
    expect(normalizeCanonicalUrl(raw)).toBe('https://github.blog/2026-10-01-security-update')
  })

  it('preserves essential query parameters while removing UTMs', () => {
    const raw = 'https://dev.to/article?id=12345&utm_campaign=weekly'
    expect(normalizeCanonicalUrl(raw)).toBe('https://dev.to/article?id=12345')
  })

  it('correctly categorizes AI & Machine Learning articles', () => {
    const cat = categorizeNews(
      'Building RAG applications with DeepSeek and LLMs',
      'A practical guide to vector search and neural embeddings.'
    )
    expect(cat).toBe('Artificial Intelligence and Machine Learning')
  })

  it('correctly categorizes Cybersecurity articles', () => {
    const cat = categorizeNews(
      'Critical zero-day vulnerability patched in open-source library',
      'CVE-2026-9999 allows remote exploit through improper buffer validation.'
    )
    expect(cat).toBe('Cybersecurity')
  })

  it('correctly categorizes DevOps and Platform Engineering articles', () => {
    const cat = categorizeNews(
      'Deploying Kubernetes clusters with Terraform and CI/CD pipelines',
      'Infrastructure as code automation for scalable container deployments.'
    )
    expect(cat).toBe('DevOps and Platform Engineering')
  })

  it('correctly categorizes Databases articles', () => {
    const cat = categorizeNews(
      'Optimizing PostgreSQL query plans and index scans',
      'How to eliminate sequential scans in high-throughput database workloads.'
    )
    expect(cat).toBe('Databases')
  })

  it('correctly categorizes JavaScript and TypeScript articles', () => {
    const cat = categorizeNews(
      'TypeScript 5.8 feature overview and Node.js performance',
      'New syntax changes and typing improvements for frontend and backend code.'
    )
    expect(cat).toBe('JavaScript and TypeScript')
  })

  it('correctly categorizes System Design articles', () => {
    const cat = categorizeNews(
      'Designing distributed microservices for 100k requests per second',
      'System design patterns, consensus algorithms, and event streams.'
    )
    expect(cat).toBe('System Design')
  })
})

describe('news query validation', () => {
  it('applies safe defaults for missing or invalid parameters', () => {
    expect(parseNewsQuery({})).toEqual({ category: 'All', q: '', page: 1, limit: 20 })
    expect(parseNewsQuery({ category: 'DROP TABLE', q: 'x'.repeat(200), page: '0', limit: '999' })).toEqual({
      category: 'All',
      q: '',
      page: 1,
      limit: 20,
    })
  })

  it('keeps valid categories and clamps pagination', () => {
    const parsed = parseNewsQuery({ category: 'Databases', q: ' indexes ', page: '3', limit: '25' })
    expect(parsed).toEqual({ category: 'Databases', q: 'indexes', page: 3, limit: 25 })
  })

  it('sanitises PostgREST grammar out of the search filter', async () => {
    const calls: Array<{ or?: string; eq?: [string, string] }> = []
    const builder = {
      select: () => builder,
      order: () => builder,
      eq: (column: string, value: string) => {
        calls.push({ eq: [column, value] })
        return builder
      },
      or: (filter: string) => {
        calls.push({ or: filter })
        return builder
      },
      range: async () => ({
        data: [
          {
            id: '1',
            title: 'Example',
            summary: '',
            canonical_url: 'https://example.dev/post',
            source_name: 'Example',
            source_domain: 'example.dev',
            published_at: '2026-01-01T00:00:00Z',
            ingested_at: '2026-01-01T00:00:00Z',
            category: 'Databases',
            tags: [],
            image_url: null,
            score: 0,
          },
        ],
        count: 1,
        error: null,
      }),
    }
    const supabase = { from: () => builder } as unknown as SupabaseClient

    await getDeveloperNews({
      supabase,
      category: 'Databases',
      search: 'react,status.eq.ACTIVE)%',
      page: 1,
      limit: 10,
    })

    expect(calls.find((call) => call.eq)?.eq).toEqual(['category', 'Databases'])
    const filter = calls.find((call) => call.or)?.or ?? ''
    expect(filter.startsWith('title.ilike.')).toBe(true)
    expect(filter).toContain('summary.ilike.')
    expect(filter.split(',')).toHaveLength(2)
    expect(filter).not.toMatch(/[()*=]/)
    expect(filter).toBe('title.ilike.%reactstatus.eq.ACTIVE%,summary.ilike.%reactstatus.eq.ACTIVE%')
  })
})
