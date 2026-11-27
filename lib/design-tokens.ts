/**
 * Commun.dev Design System Tokens
 * Defines the shared visual language for the developer social platform.
 */

export const tokens = {
  brand: {
    name: 'Commun',
    tagline: 'Discover. Connect. Create. Collaborate. Earn.',
    mission:
      'Build a global ecosystem where developers share technical knowledge, showcase their work, collaborate, and grow professionally.',
    supportText:
      'Commun.dev is a global developer community for technical publishing, social connection, project showcases, and professional opportunity.',
  },
  colors: {
    // Permanent light palette. Mirrors app/globals.css so design decisions have
    // one documented source even outside Tailwind.
    light: {
      background: 'hsl(0, 0%, 100%)', // #FFFFFF
      foreground: 'hsl(222, 47%, 11%)', // #0F172A
      surface: 'hsl(0, 0%, 100%)', // #FFFFFF
      surfaceHover: 'hsl(210, 40%, 98%)', // #F8FAFC
      elevated: 'hsl(214, 100%, 97%)', // #EFF6FF
      border: 'hsl(214, 32%, 91%)', // #E2E8F0
      borderSubtle: 'hsl(210, 40%, 96%)', // #F1F5F9
      borderStrong: 'hsl(213, 27%, 84%)', // #CBD5E1
      primary: 'hsl(221, 83%, 53%)', // #2563EB
      primaryHover: 'hsl(224, 76%, 48%)', // #1D4ED8
      secondary: 'hsl(217, 91%, 60%)', // #3B82F6
      accentLight: 'hsl(213, 94%, 68%)', // #60A5FA
      lightBlue: 'hsl(214, 100%, 97%)', // #EFF6FF
      darkBlue: 'hsl(224, 64%, 43%)', // #1E40AF
      darkText: 'hsl(222, 47%, 11%)', // #0F172A
      secondaryText: 'hsl(215, 16%, 47%)', // #64748B
      // Semantic aliases retained for existing components.
      accent: 'hsl(221, 83%, 53%)', // #2563EB
      accentMuted: 'hsla(221, 83%, 53%, 0.10)',
      accentHover: 'hsl(224, 76%, 48%)', // #1D4ED8
      accentForeground: 'hsl(0, 0%, 100%)',
      muted: 'hsl(215, 16%, 47%)', // #64748B
      subtle: 'hsl(215, 20%, 65%)', // #94A3B8
      card: 'hsl(0, 0%, 100%)',
      cardBorder: 'hsl(214, 32%, 91%)',
      highlightIndigo: 'hsl(243, 75%, 45%)',
      highlightEmerald: 'hsl(160, 84%, 28%)',
      highlightSky: 'hsl(201, 90%, 32%)',
      highlightViolet: 'hsl(262, 60%, 45%)',
    },
  },
  typography: {
    fontSans: 'Geist, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    fontMono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontDisplay: 'Geist, ui-sans-serif, system-ui, sans-serif',
  },
  radii: {
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },
  shadows: {
    subtle: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px -1px rgb(15 23 42 / 0.06)',
    elevated: '0 12px 32px -16px rgb(15 23 42 / 0.18)',
    glow: '0 0 35px -12px hsl(221 83% 53% / 0.18)',
    card: '0 16px 40px -32px rgb(15 23 42 / 0.16)',
    header: '0 12px 30px -24px rgb(15 23 42 / 0.18), 0 1px 0 rgb(15 23 42 / 0.04)',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const

export type DesignTokens = typeof tokens

