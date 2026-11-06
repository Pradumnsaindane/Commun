import { describe, it, expect } from 'vitest'
import { tokens } from './design-tokens'

describe('Commun Design Tokens', () => {
  it('defines correct brand positioning and messaging', () => {
    expect(tokens.brand.name).toBe('Commun')
    expect(tokens.brand.tagline).toBe('One workspace. Better work. More time.')
    expect(tokens.brand.mission).toBe('Work smarter. Learn faster. Make time for what matters.')
    expect(tokens.brand.supportText).toContain('Commun helps professionals and teams')
  })

  it('defines dark and light palette with warm orange accent', () => {
    expect(tokens.colors.dark.accent).toContain('24, 94%')
    expect(tokens.colors.light.accent).toContain('24, 94%')
    expect(tokens.colors.dark.background).toContain('228, 27%, 5%')
    expect(tokens.colors.light.background).toContain('210, 20%, 98%')
  })

  it('defines typography, radii, and breakpoints', () => {
    expect(tokens.typography.fontSans).toContain('Inter')
    expect(tokens.typography.fontMono).toContain('JetBrains Mono')
    expect(tokens.radii.sm).toBeDefined()
    expect(tokens.radii.full).toBe('9999px')
    expect(tokens.breakpoints.sm).toBe('640px')
    expect(tokens.breakpoints.xl).toBe('1280px')
  })
})

