import { describe, it, expect } from 'vitest'
import { tokens } from './design-tokens'

describe('Commun Design Tokens', () => {
  it('defines correct brand positioning and messaging', () => {
    expect(tokens.brand.name).toBe('Commun')
    expect(tokens.brand.tagline).toBe('Discover. Connect. Create. Collaborate. Earn.')
    expect(tokens.brand.mission).toContain('developers')
    expect(tokens.brand.supportText).toContain('developer community')
  })

  it('defines the permanent light palette with an accessible Commun blue accent', () => {
    expect(tokens.colors.light.accent).toContain('221, 83%, 53%')
    expect(tokens.colors.light.primary).toContain('221, 83%, 53%')
    expect(tokens.colors.light.primaryHover).toContain('224, 76%, 48%')
    expect(tokens.colors.light.background).toContain('0, 0%, 100%')
    expect(tokens.colors.light.surface).toContain('0, 0%, 100%')
    expect(tokens.colors.light.foreground).toContain('222, 47%, 11%')
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

