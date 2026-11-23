import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          hover: 'hsl(var(--surface-hover))',
        },
        elevated: 'hsl(var(--elevated))',
        border: {
          DEFAULT: 'hsl(var(--border))',
          subtle: 'hsl(var(--border-subtle))',
          strong: 'hsl(var(--border-strong))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          muted: 'hsl(var(--accent-muted))',
          hover: 'hsl(var(--accent-hover))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted))',
        },
        subtle: 'hsl(var(--subtle))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          border: 'hsl(var(--card-border))',
        },
        brand: {
          // Accessible on white surfaces; these are text/icon colors, not fills.
          orange: 'hsl(21, 90%, 40%)',
          indigo: 'hsl(243, 75%, 45%)',
          emerald: 'hsl(160, 84%, 28%)',
          sky: 'hsl(201, 90%, 32%)',
          violet: 'hsl(262, 60%, 45%)',
        },
      },
      fontFamily: {
        // Loaded with next/font in app/layout.tsx and exposed as CSS variables.
        sans: ['var(--font-sans)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px -1px rgb(15 23 42 / 0.06)',
        elevated: '0 12px 32px -16px rgb(15 23 42 / 0.18)',
        glow: '0 0 35px -12px hsl(21 90% 40% / 0.18)',
        'glow-indigo': '0 0 35px -12px hsl(243 75% 45% / 0.15)',
        header: '0 12px 30px -24px rgb(15 23 42 / 0.18), 0 1px 0 rgb(15 23 42 / 0.04)',
        card: '0 16px 40px -32px rgb(15 23 42 / 0.16)',
      },
      keyframes: {
        'beam-dash': {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        flicker: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '0.3' },
          '25%, 75%': { opacity: '0.95' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'beam-dash': 'beam-dash 12s linear infinite',
        flicker: 'flicker 4s ease-in-out infinite',
        'float-slow': 'float-slow 5s ease-in-out infinite',
        shimmer: 'shimmer 3s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
