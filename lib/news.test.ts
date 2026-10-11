import { describe, expect, it } from 'vitest'
import { categorizeNews, normalizeCanonicalUrl } from './news'

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
