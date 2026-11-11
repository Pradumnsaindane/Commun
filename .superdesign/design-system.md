# Commun Visual System — Shared Marketing and Workspace

## Direction

Commun should feel like one calm, reliable product. The public site introduces the same workspace users continue into after sign-in. Use the existing white-first identity, but reduce visual noise: warm white canvas, ink text, restrained orange accents, consistent compact controls, and quiet surfaces. Prefer actual workspace UI patterns and transparent unavailable states over illustrative operational records.

## Shared tokens

| Token | Light | Dark |
| --- | --- | --- |
| Canvas | `#FFFFFF` | `#0E1118` |
| Secondary surface | `#F5F6F8` | `#151922` |
| Raised surface | `#FFFFFF` | `#1A1F29` |
| Primary text | `#172033` | `#F2F4F7` |
| Secondary text | `#667085` | `#A3ADBC` |
| Border | `#E5E7EB` | `#293140` |
| Brand accent | `#F97316` | `#F97316` |
| Accent text on light | `#C2410C` | `#FDBA74` |

- Type: Inter/system sans; JetBrains Mono/system mono only for small metadata and shortcuts. Use a 12/14/16/20/24/32/48 scale; hero max 64px, dashboard page titles 32px. Avoid all-caps labels except short eyebrow metadata.
- Spacing: 4px base, 8px rhythm; content width 1200px marketing and 1440px workspace; 24px desktop gutters, 16px mobile gutters.
- Radius: controls 10px, small cards 14px, large panels 20px, hero preview 24px, pills full.
- Shadows: neutral and low-opacity, e.g. `0 16px 48px -36px rgb(23 32 51 / .24)`. Avoid glow shadows on ordinary controls.
- Glass is selective: navigation, popovers, mobile drawer, contextual overlays. Use 82–92% surface opacity, 12–16px blur, 1px neutral border. Main cards, forms, tables, documents, and product previews are solid.

## Shared background field

Use one reusable `.ambient-field` on the landing hero and the authenticated workspace canvas. Keep content surfaces above it and opaque enough to preserve contrast. The field consists of two fixed radial lights: a warm orange wash centered at `50% 2%` with a maximum alpha of `.055`, and a neutral cool wash at `88% 18%` with maximum alpha `.035`. No grid, beam, particle, or cursor-following layer.

The one ambient layer may drift along a fixed 12px horizontal / 8px vertical path over 32 seconds using `ease-in-out`, alternating opacity `.5–.8`; the companion wash remains still. Keep all movement on `transform` and `opacity`. On viewports below 768px, lower opacity to `.35` and disable the drift. Under `prefers-reduced-motion: reduce`, keep the static gradient and remove animation. Do not animate the page background color.

## Interaction motion

- Route/content entrance: fade plus 4px vertical translation, 180–240ms.
- Popovers: opacity and 3px translation, 140–180ms.
- Modal: opacity with 4px translation and 0.99–1 scale, 160–200ms.
- Hover: border/shadow change; maximum lift 1px on cards. No continuous motion for controls or cards.
- Reduced motion disables ambient drift, entrance transforms, and nonessential transitions.

## Responsive and accessibility rules

- Keep focus rings visible on every interactive element; minimum 44px touch targets.
- Ensure text/background combinations meet WCAG AA; use the readable orange token for small text.
- At mobile widths, remove expensive blur from large regions and keep cards/form controls solid.
- Preserve real auth, route behavior, data boundaries, and unavailable states. Never invent operational counts, people, activity, project progress, or security guarantees.

## Current design debt to resolve in implementation

1. `app/globals.css` and `lib/design-tokens.ts` define different light palette values; consolidate so Tailwind, CSS, and TypeScript use one source.
2. `components/landing/hero.tsx` uses moving diagonal beams, a visible grid, and multiple colored glows. Replace them with the shared fixed ambient field.
3. Landing product illustrations show named people, task titles, counts, progress, and security claims that are not backed by work-management data. Replace these with faithful UI structure and clearly unavailable/empty preview states.
4. Landing and workspace use separate navigation composition and different active theme/storage behavior. Keep separate interaction models but share typography, surface tokens, border, radius, and motion.
5. Preserve the current functional public sections, links, auth routes, dashboard metrics that are sourced from real account data, and all Supabase calls.
