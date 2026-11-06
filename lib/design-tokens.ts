/**
 * Commun SaaS Design System Tokens
 * Defines the unified visual language for Commun productivity & work-management platform.
 */

export const tokens = {
  brand: {
    name: 'Commun',
    tagline: 'One workspace. Better work. More time.',
    mission: 'Work smarter. Learn faster. Make time for what matters.',
    supportText:
      'Commun helps professionals and teams organize their work, collaborate effectively, manage knowledge, and make more time for meaningful progress.',
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
    light: {
      background: 'hsl(210, 20%, 98%)', // #f8fafc
      foreground: 'hsl(222, 47%, 11%)', // #0f172a
      surface: 'hsl(0, 0%, 100%)', // #ffffff
      surfaceHover: 'hsl(210, 20%, 95%)',
      elevated: 'hsl(0, 0%, 100%)',
      border: 'hsl(214, 32%, 91%)', // #e2e8f0
      borderSubtle: 'hsl(214, 32%, 94%)',
      borderStrong: 'hsl(215, 25%, 82%)',
      accent: 'hsl(24, 94%, 50%)',
      accentMuted: 'hsla(24, 94%, 50%, 0.1)',
      accentHover: 'hsl(24, 94%, 45%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      muted: 'hsl(215, 16%, 47%)',
      subtle: 'hsl(215, 16%, 65%)',
      card: 'hsl(0, 0%, 100%)',
      cardBorder: 'hsl(214, 32%, 89%)',
      highlightIndigo: 'hsl(238, 70%, 55%)',
      highlightEmerald: 'hsl(152, 65%, 38%)',
      highlightSky: 'hsl(199, 85%, 42%)',
      highlightViolet: 'hsl(262, 70%, 55%)',
    },
  },
  typography: {
    fontSans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontDisplay: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
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

