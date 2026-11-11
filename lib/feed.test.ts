import { describe, expect, it } from 'vitest'
import { buildKeysetFilter, clampFeedLimit, decodeCursor, encodeCursor, parseFeedTab, previewFrom } from './feed'

const ID = '0f4b9d3a-6f4c-4a3f-9c1b-2f0a7c8d5e11'
const PUBLISHED = '2026-11-11T09:30:00.000Z'

describe('feed tabs and limits', () => {
  it('defaults to following and accepts latest', () => {
    expect(parseFeedTab(undefined)).toBe('following')
    expect(parseFeedTab('latest')).toBe('latest')
    expect(parseFeedTab('following')).toBe('following')
    expect(parseFeedTab('../../etc/passwd')).toBe('following')
  })

  it('clamps page sizes', () => {
    expect(clampFeedLimit(undefined)).toBe(10)
    expect(clampFeedLimit(0)).toBe(1)
    expect(clampFeedLimit(500)).toBe(20)
    expect(clampFeedLimit(Number.NaN)).toBe(10)
  })
})

describe('keyset pagination', () => {
  it('round-trips a valid cursor', () => {
    const cursor = { publishedAt: PUBLISHED, id: ID }
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor)
  })

  it('rejects malformed or tampered cursors', () => {
    expect(decodeCursor(null)).toBeNull()
    expect(decodeCursor('')).toBeNull()
    expect(decodeCursor('not-base64!!')).toBeNull()
    expect(decodeCursor(Buffer.from(`${PUBLISHED}|not-a-uuid`).toString('base64url'))).toBeNull()
    expect(decodeCursor(Buffer.from(`not-a-date|${ID}`).toString('base64url'))).toBeNull()
  })

  it('builds a keyset predicate from validated values only', () => {
    const filter = buildKeysetFilter({ publishedAt: PUBLISHED, id: ID })
    expect(filter).toBe(`published_at.lt.${PUBLISHED},and(published_at.eq.${PUBLISHED},id.lt.${ID})`)
  })
})

describe('feed previews', () => {
  it('strips markdown noise and collapses whitespace', () => {
    expect(previewFrom('# Title\n\nSome   text')).toBe('Title Some text')
    expect(previewFrom('```ts\nconst a = 1\n```\nReal words here')).toBe('Real words here')
  })

  it('truncates long bodies with an ellipsis', () => {
    const preview = previewFrom('word '.repeat(200), 50)
    expect(preview.length).toBeLessThanOrEqual(50)
    expect(preview.endsWith('…')).toBe(true)
  })
})
