import { describe, expect, it } from 'vitest'
import { highlightCode, normalizeLanguage } from './highlight'

describe('code highlighting', () => {
  it('escapes HTML before adding token markup', () => {
    const html = highlightCode('const x = "<script>alert(1)</script>"', 'typescript')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('tok-string')
  })

  it('marks keywords, comments, strings, and numbers', () => {
    const html = highlightCode('// note\nconst total = 42\nconst name = "alex"', 'typescript')
    expect(html).toContain('<span class="tok-comment">// note</span>')
    expect(html).toContain('<span class="tok-keyword">const</span>')
    expect(html).toContain('<span class="tok-number">42</span>')
    expect(html).toContain('<span class="tok-string">&quot;alex&quot;</span>')
  })

  it('handles language-specific comment syntax', () => {
    expect(highlightCode('# comment\ndef run(): pass', 'python')).toContain('tok-comment')
    expect(highlightCode('-- comment\nselect 1;', 'sql')).toContain('tok-comment')
  })

  it('falls back to escaped plain text for unknown languages', () => {
    const html = highlightCode('<b>unsafe</b>', 'brainfuck')
    expect(html).toBe('&lt;b&gt;unsafe&lt;/b&gt;')
    expect(normalizeLanguage('tsx')).toBe('typescript')
    expect(normalizeLanguage('nope')).toBe('text')
  })
})
