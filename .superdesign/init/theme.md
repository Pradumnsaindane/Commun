# Theme and Design Tokens

## Compact token summary

- Light surfaces: background HSL 220 20% 98%, surface/elevated/card white; foreground HSL 222 35% 16%; muted HSL 220 9% 42%; border HSL 220 14% 90%; blue accent HSL 221 83% 53%, readable light text accent HSL 224 64% 43%.
- Dark: background HSL 228 27% 5%, surface HSL 226 22% 10%, foreground HSL 220 20% 94%, border HSL 225 19% 17%.
- Sans: Inter/system. Mono: JetBrains Mono/ui-monospace. Type scale follows Tailwind defaults with app titles 3xl–4xl; metadata ~10–12px.
- Radius: Tailwind scale; app cards commonly 2xl, buttons xl. Blur is selective via .glass-surface (18px; mobile 10px).
- Breakpoints: 640/768/1024/1280/1536px. Reduced motion handled globally.
- Note: lib/design-tokens.ts and app/globals.css currently differ in some light-theme values and should be centralized during design system work.

## Raw sources

### `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Commun's white-first workspace palette */
  --background: 220 20% 98%;
  --foreground: 222 35% 16%;
  --surface: 0 0% 100%;
  --surface-hover: 220 20% 96%;
  --elevated: 0 0% 100%;
  --border: 220 14% 90%;
  --border-subtle: 220 14% 94%;
  --border-strong: 220 12% 82%;
  --accent: 24 94% 53%;
  --accent-readable: 19 88% 40%;
  --accent-muted: 24 94% 53% / 0.10;
  --accent-hover: 24 94% 47%;
  --accent-foreground: 222 35% 16%;
  --muted: 220 9% 42%;
  --subtle: 220 8% 56%;
  --card: 0 0% 100%;
  --card-border: 220 14% 90%;
  --glass: 0 0% 100% / 0.78;
  --glass-border: 0 0% 100% / 0.82;
}

.dark {
  color-scheme: dark;
  --background: 228 27% 5%;
  --foreground: 220 20% 94%;
  --surface: 226 22% 10%;
  --surface-hover: 226 22% 14%;
  --elevated: 226 21% 13%;
  --border: 225 19% 17%;
  --border-subtle: 225 19% 14%;
  --border-strong: 225 19% 25%;
  --accent: 24 94% 53%;
  --accent-readable: 24 94% 53%;
  --accent-muted: 24 94% 53% / 0.12;
  --accent-hover: 24 94% 48%;
  --accent-foreground: 222 35% 16%;
  --muted: 220 10% 65%;
  --subtle: 220 10% 48%;
  --card: 226 22% 9%;
  --card-border: 225 19% 16%;
  --glass: 226 22% 10% / 0.78;
  --glass-border: 225 19% 28% / 0.72;
}

* {
  border-color: hsl(var(--border));
}

/* Keep small brand text readable on white while preserving the blue fill. */
.text-accent { color: hsl(var(--accent-readable)); }

html {
  color-scheme: light;
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Used selectively for navigation, floating controls and summary panels. */
.glass-surface {
  background: hsl(var(--glass));
  border: 1px solid hsl(var(--glass-border));
  box-shadow: 0 10px 32px -24px rgb(23 32 51 / .24), inset 0 1px rgb(255 255 255 / .58);
  -webkit-backdrop-filter: blur(18px) saturate(135%);
  backdrop-filter: blur(18px) saturate(135%);
}
.glass-floating { box-shadow: 0 18px 46px -30px rgb(23 32 51 / .32), 0 2px 8px rgb(23 32 51 / .04); }
.interactive-surface { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
.interactive-surface:hover { transform: translateY(-2px); box-shadow: 0 16px 36px -26px rgb(23 32 51 / .28); }
.workspace-enter { animation: workspace-enter 360ms cubic-bezier(.2,.75,.25,1) both; }
@keyframes workspace-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.route-transition { animation: route-fade 200ms ease-out both; }
@keyframes route-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.dropdown-enter { animation: dropdown-enter 160ms ease-out both; }
@keyframes dropdown-enter { from { opacity: 0; transform: translateY(4px) scale(.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
.drawer-enter { animation: drawer-enter 200ms cubic-bezier(.2,.75,.25,1) both; }
@keyframes drawer-enter { from { opacity: .7; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
.modal-enter { animation: modal-enter 180ms ease-out both; }
@keyframes modal-enter { from { opacity: 0; transform: translateY(5px) scale(.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
.dashboard-stagger > * { animation: workspace-enter 420ms cubic-bezier(.2,.75,.25,1) both; }
.dashboard-stagger > :nth-child(2) { animation-delay: 45ms; }
.dashboard-stagger > :nth-child(3) { animation-delay: 90ms; }
.dashboard-stagger > :nth-child(4) { animation-delay: 135ms; }
.calendar-view-enter { animation: workspace-enter 220ms ease-out both; }
.skeleton {
  border-radius: .65rem;
  background: linear-gradient(100deg, hsl(var(--surface-hover)) 20%, hsl(var(--border-subtle)) 42%, hsl(var(--surface-hover)) 64%);
  background-size: 220% 100%;
  animation: skeleton-shimmer 1.6s ease-in-out infinite;
}
@keyframes skeleton-shimmer { to { background-position-x: -220%; } }
@supports not ((backdrop-filter: blur(1px))) {
  .glass-surface { background: hsl(var(--surface)); }
}

:focus-visible {
  outline: 2px solid hsl(var(--accent));
  outline-offset: 3px;
}

::selection {
  background: hsl(var(--accent) / 0.28);
  color: hsl(var(--foreground));
}

button, a, input, textarea, select {
  transition-duration: 160ms;
  transition-property: color, background-color, border-color, opacity, transform, box-shadow;
}

/* Reduced motion accessibility */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
  .skeleton { animation: none; }
}
@media (max-width: 767px) { .glass-surface { -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); } }

/* Custom subtle grid background */
.bg-grid-pattern {
  background-size: 40px 40px;
  background-image: linear-gradient(to right, hsla(var(--border) / 0.35) 1px, transparent 1px),
                    linear-gradient(to bottom, hsla(var(--border) / 0.35) 1px, transparent 1px);
}

.bg-dot-pattern {
  background-size: 24px 24px;
  background-image: radial-gradient(circle, hsla(var(--border) / 0.5) 1px, transparent 1px);
}

/* Article & editorial text styling */
.article-body {
  color: hsl(var(--muted));
  font-size: 1.0625rem;
  line-height: 1.9;
}
.article-body h1, .article-body h2, .article-body h3 {
  color: hsl(var(--foreground));
  margin: 2.25rem 0 0.75rem;
  font-weight: 650;
  letter-spacing: -0.02em;
}
.article-body h1 { font-size: 2rem; }
.article-body h2 { font-size: 1.5rem; }
.article-body h3 { font-size: 1.2rem; }
.article-body p, .article-body ul, .article-body ol, .article-body blockquote, .article-body pre {
  margin: 1.25rem 0;
}
.article-body ul, .article-body ol { padding-left: 1.5rem; }
.article-body li { margin: 0.35rem 0; }
.article-body blockquote {
  border-left: 3px solid hsl(var(--accent));
  padding-left: 1rem;
  font-style: italic;
}
.article-body code {
  border-radius: 0.35rem;
  background: hsl(var(--surface));
  padding: 0.15rem 0.35rem;
  font-family: ui-monospace, monospace;
  font-size: 0.9em;
  color: hsl(var(--accent));
}
.article-body pre {
  overflow-x: auto;
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem;
  background: hsl(var(--surface));
  padding: 1rem;
  color: hsl(var(--foreground));
}
.article-body pre code {
  background: transparent;
  padding: 0;
  color: inherit;
}
.article-body a {
  color: hsl(var(--accent));
  text-decoration: underline;
  text-underline-offset: 3px;
}
.article-body hr {
  margin: 2rem 0;
  border: 0;
  border-top: 1px solid hsl(var(--border));
}

```
### `tailwind.config.ts`

```ts
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
          blue: 'hsl(221, 83%, 53%)',
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
        glow: '0 0 35px -5px hsl(221 83% 53% / 0.25)',
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

```
### `lib/design-tokens.ts`

```ts
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
      accent: 'hsl(221, 83%, 53%)', // #2563EB (signature Commun blue)
      accentMuted: 'hsl(221 83% 53% / 0.12)',
      accentHover: 'hsl(224, 76%, 48%)',
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
      accent: 'hsl(221, 83%, 48%)',
      accentMuted: 'hsl(221 83% 53% / 0.1)',
      accentHover: 'hsl(224, 64%, 43%)',
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
    glow: '0 0 35px -5px hsl(221 83% 53% / 0.25)',
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


```
