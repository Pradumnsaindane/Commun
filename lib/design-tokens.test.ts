import { describe, it, expect } from 'vitest'
import { tokens } from './design-tokens'

describe('Commun Design Tokens', () => {
  it('defines correct brand positioning and messaging', () => {
    expect(tokens.brand.name).toBe('Commun')
    expect(tokens.brand.tagline).toBe('Discover. Connect. Create. Collaborate. Earn.')
    expect(tokens.brand.mission).toContain('developers')
    expect(tokens.brand.supportText).toContain('developer community')
  })

  it('defines the permanent dark palette with Commun orange accent', () => {
    expect(tokens.colors.dark.accent).toContain('24, 94%')
    expect(tokens.colors.dark.background).toContain('228, 27%, 5%')
    expect(tokens.colors.dark.surface).toContain('226, 22%, 10%')
  })

  it('defines typography, radii, and breakpoints', () => {
    expect(tokens.typography.fontSans).toContain('Geist')
    expect(tokens.typography.fontMono).toContain('Geist Mono')
    expect(tokens.radii.sm).toBeDefined()
    expect(tokens.radii.full).toBe('9999px')
    expect(tokens.breakpoints.sm).toBe('640px')
    expect(tokens.breakpoints.xl).toBe('1280px')
  })
})

