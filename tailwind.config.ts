import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
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
          orange: 'hsl(24, 94%, 53%)',
          indigo: 'hsl(238, 84%, 67%)',
          emerald: 'hsl(152, 69%, 45%)',
          sky: 'hsl(199, 89%, 48%)',
          violet: 'hsl(262, 83%, 68%)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        elevated: '0 10px 30px -10px rgba(0, 0, 0, 0.4)',
        glow: '0 0 35px -5px hsla(24, 94%, 53%, 0.25)',
        'glow-indigo': '0 0 35px -5px hsla(238, 84%, 67%, 0.25)',
        'dark-nav': '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        card: '0 14px 40px -28px rgba(0, 0, 0, 0.85)',
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
