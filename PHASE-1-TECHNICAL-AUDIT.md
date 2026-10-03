# Commun Phase 1 Technical Audit

## Audit scope

This audit records the repository state before implementing the Phase 1 foundation described in `commun-dev-build-spec.md`. No product features or backend behavior are implemented by this change.

## Current implementation

- **Framework/build:** Vite 5 multi-page static site with vanilla HTML, CSS, and JavaScript.
- **Primary source:** The repository root is the active Vite project (`package.json`, `vite.config.js`, `index.html`, shared `main.js`, and shared stylesheets).
- **Secondary copy:** `commun.dev/` contains a second, largely duplicated Vite site with its own `package.json` and `vite.config.js`. It is not the root build entry and creates a source-of-truth risk.
- **Routes:** The root Vite configuration exposes 24 HTML entry points, including public marketing/auth pages and authenticated-looking workspace pages.
- **State/data:** Content is hardcoded in HTML. Interaction state is DOM-only. `main.js` provides presentation handlers for likes, saves, follows, tabs, navigation, toasts, and writer interactions.
- **Persistence/auth:** No backend, database, authentication, authorization, API, or durable storage is connected. Login, registration, OAuth, settings security, and token controls are currently presentation/demo flows.
- **Testing/tooling:** No TypeScript, ESLint, Prettier, Vitest, or Playwright configuration is present. There are no test files.
- **Design system:** The current visual language already has a dark-first palette and reusable CSS classes, but styles are distributed across `style.css`, `page-shell.css`, `workspace-shell-fix.css`, `workspace-polish.css`, and `commun-refresh.css`.

## Phase 1 requirements versus current state

| Requirement | Status | Finding |
| --- | --- | --- |
| Next.js App Router | Not met | Current app is Vite multi-page HTML. |
| TypeScript with strict mode | Not met | JavaScript/HTML only; no `tsconfig.json`. |
| Tailwind CSS | Not met | Styling is handwritten CSS. |
| shadcn/ui primitives | Not met | No `components.json` or shadcn component layer. |
| Commun design tokens | Partial | Palette and typography intent exist in CSS; tokens are not centralized in a typed/component system. |
| Responsive shell | Partial | Desktop/mobile shell exists across static pages, but not as reusable React shell components. |
| Empty feed container | Not met | Root pages contain hardcoded content instead of a deliberate empty-state shell. |
| Strict build validation | Partial | Vite production build succeeds; there is no TypeScript/lint/test validation. |
| Zero mock/placeholder data in components | Not met | Static demo copy and named sample content are embedded throughout the HTML pages. |

## Key risks and cleanup decisions

1. **Choose one canonical source before Phase 1 implementation.** Use the repository root as the source of truth because it is the active Git project and the root build is the project-level build. Archive or remove the `commun.dev/` duplicate only in a separate approved cleanup change; do not silently merge both trees.
2. **Treat the current static pages as visual reference, not runtime architecture.** Reuse visual intent and route inventory, but do not port hardcoded content into new React component arrays.
3. **Do not connect auth or persistence in Phase 1.** Those belong to Phase 2+ and require the database/auth integration and schema work specified by the build spec.
4. **Preserve honest zero states.** The Phase 1 shell should render structural containers and explicit empty states rather than fabricated feed, writer, topic, notification, or project records.
5. **Centralize tokens during migration.** Carry forward the existing dark palette, orange accent, surface/border colors, sans/mono typography, spacing, and responsive breakpoints into one token layer before extracting shell components.
6. **Add validation before feature work.** The new foundation should add strict TypeScript, linting, formatting, and a minimal browser smoke path before Phase 2 begins.

## Phase 1 implementation boundary

The next implementation pass should be limited to:

- scaffolding the Next.js App Router + TypeScript foundation in the canonical root;
- establishing Tailwind/shadcn configuration and Commun design tokens;
- extracting the responsive shell into reusable navigation components;
- creating an empty, responsive public feed shell with honest zero-state presentation;
- adding build, typecheck, lint, format, and smoke-test validation;
- leaving authentication, database access, API routes, real content, and mutations for later phases.

## Validation recorded for this audit

- `npm run build` (root): **passes** with Vite 5.
- `cd commun.dev && npm run build`: **passes** with Vite 5.
- `npm run typecheck`: **not available**; package has no `typecheck` script.
- `npm test`: **not available**; package has no `test` script.

## Readiness decision

The repository is suitable for Phase 1 **as a migration baseline**, not as a completed Phase 1 foundation. The existing static prototype is visually useful, but the required Next.js/TypeScript/Tailwind/shadcn architecture, reusable shell components, strict validation, and zero-data foundation still need to be introduced. No major feature implementation should begin until that foundation is in place.

## Recommended first commit after approval

Create the Phase 1 application foundation in the root project while preserving the existing static prototype as migration reference until the new shell is validated. Keep the change reversible and avoid deleting the duplicate `commun.dev/` tree in the same commit.

---

Sources reviewed: `commun-dev-build-spec.md`, root `package.json`, root `vite.config.js`, root `README.md`, root `main.js`, root `style.css`, `commun.dev/package.json`, `commun.dev/vite.config.js`, and the root/duplicate route trees.
