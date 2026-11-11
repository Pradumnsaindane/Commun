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
    dark: {
      background: 'hsl(228, 27%, 5%)', // #090a0f
      foreground: 'hsl(220, 20%, 94%)', // #eceef2
      surface: 'hsl(226, 22%, 10%)', // #141720
      surfaceHover: 'hsl(226, 22%, 14%)',
      elevated: 'hsl(226, 21%, 13%)', // #1a1e2a
      border: 'hsl(225, 19%, 17%)', // #1f2330
      borderSubtle: 'hsl(225, 19%, 14%)',
      borderStrong: 'hsl(225, 19%, 25%)',
      accent: 'hsl(24, 94%, 53%)', // #f97316 (signature Commun warm orange)
      accentMuted: 'hsla(24, 94%, 53%, 0.12)',
      accentHover: 'hsl(24, 94%, 48%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      muted: 'hsl(220, 10%, 62%)',
      subtle: 'hsl(220, 10%, 42%)',
      card: 'hsl(226, 22%, 9%)',
      cardBorder: 'hsl(225, 19%, 16%)',
      highlightIndigo: 'hsl(238, 84%, 67%)',
      highlightEmerald: 'hsl(152, 69%, 45%)',
      highlightSky: 'hsl(199, 89%, 48%)',
      highlightViolet: 'hsl(262, 83%, 68%)',
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
    subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    elevated: '0 10px 30px -10px rgba(0, 0, 0, 0.4)',
    glow: '0 0 35px -5px hsla(24, 94%, 53%, 0.25)',
    card: '0 14px 40px -28px rgba(0, 0, 0, 0.85)',
    darkNav: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
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

