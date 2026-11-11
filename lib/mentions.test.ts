import { describe, expect, it } from 'vitest'
import { extractMentions, mentionsUser } from './mentions'

describe('mention extraction', () => {
  it('finds unique handles case-insensitively', () => {
    expect(extractMentions('thanks @Alex_99 and @alex_99 and @sam')).toEqual(['alex_99', 'sam'])
  })

  it('ignores short or malformed handles', () => {
    expect(extractMentions('email me at alex@example.dev')).toEqual(['example'])
    expect(extractMentions('@ab @ @!!!')).toEqual([])
  })

  it('caps the number of mentions', () => {
    const text = Array.from({ length: 12 }, (_, index) => `@user${index}0`).join(' ')
    expect(extractMentions(text)).toHaveLength(5)
  })

  it('checks a specific user', () => {
    expect(mentionsUser('nice work @alex_99', 'ALEX_99')).toBe(true)
    expect(mentionsUser('nice work @alex_99', 'sam')).toBe(false)
    expect(mentionsUser('no mentions', null)).toBe(false)
  })
})
