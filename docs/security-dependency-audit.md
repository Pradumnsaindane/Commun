# Security dependency audit

Audit baseline: `v0/next-security-patch` at Next.js `16.3.8`.

## Findings

| Dependency | Severity | Direct/Transitive | Production impact | Fix available | Action | Remaining risk |
| --- | --- | --- | --- | --- | --- | --- |
| `vitest` → `vite` → `esbuild` | Critical/high/moderate | Direct dev dependency with transitive dev-only path | Development/test tooling only; not shipped by the production build | `npm audit` proposes `vitest@1.6.1`, which is within the declared major but the installed audit graph still requires review; latest Vitest is a major upgrade | No blind upgrade applied. Keep pinned at `1.6.0` pending a dedicated Vitest compatibility change | Dev server request exposure advisory remains in tooling; do not expose the dev server to untrusted networks |
| `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces` | High | Direct dev dependency with transitive dev-only path | Lint tooling only; not included in runtime bundle | `npm audit` proposes `eslint-config-next@14.2.35`, which is incompatible with Next 16 and is not a safe fix | Deferred. Kept `eslint-config-next@16.3.8` aligned with Next | Lint dependency graph retains the advisory until the Next-compatible package graph publishes a safe fix |
| `tailwindcss` → `chokidar`/`fast-glob`/`micromatch` → `braces` | High | Direct dev dependency with transitive dev-only path | CSS build tooling only; not included in runtime bundle | `npm audit` proposes Tailwind 4.3.3, a breaking major migration | Deferred. Tailwind 3.4.17 is intentional and no forced migration was made | Deeply nested pattern DoS remains in the local build dependency graph; CI/build inputs are trusted |

## Commands and result

- `npm audit`: 11 findings total — 1 critical, 8 high, 2 moderate.
- `npm audit --json`: confirmed all listed vulnerable paths are development-only (`isDirect` identifies `vitest`, `tailwindcss`, and `eslint-config-next` as direct dev dependencies).
- `npm outdated`: reports available majors for ESLint, React, Tailwind, TypeScript, and Vitest; no upgrade was applied because this audit is not a broad dependency modernization.
- `npm audit fix --force` was not run.

## Middleware migration

Next.js 16 reported the `middleware` convention deprecation. The small, behavior-preserving migration is complete: `middleware.ts` is now `proxy.ts` and exports `proxy`. The matcher, Supabase session refresh, protected routes, auth redirects, and cookie handling are unchanged.

## Verification

The audit patch must pass:

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- `npm list next` → `next@16.3.8`

Remaining release risk is the dev-only audit graph above, not a production runtime dependency. Avoid treating `npm audit` as clean until compatible non-breaking fixes are available or the intentional major migrations are separately planned and tested.
