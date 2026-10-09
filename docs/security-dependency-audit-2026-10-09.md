# Dependency Security Audit — 2026-10-09

## Scope

Audited branch `v0/notification-reply-hardening` after commit `fa8d0dd`. No production infrastructure, environment variables, databases, or RLS policies were changed. `npm audit fix --force` was not run.

## Counts

- Initial: 15 vulnerabilities — 2 critical, 9 high, 4 moderate.
- Final: 14 vulnerabilities — 2 critical, 8 high, 4 moderate.
- Dependency exposure: 31 production packages, 553 development packages, 116 optional packages.

The one reduction came from the compatible `source-map-js` lockfile update. The final audit is not clean.

## Remediation

- Updated direct `vitest` from `1.6.0` to `1.6.1`, a compatible patch release. This resolves the Vitest advisory affecting versions `<1.6.1`, but does not resolve the separate `tinypool`, Vite, and esbuild advisories.
- Regenerated `package-lock.json` with npm. The lockfile-only audit fix updated compatible transitive metadata/package resolutions, including `source-map-js` to a fixed version.
- Did not upgrade Next.js; it remains pinned to `16.3.8`.
- Did not upgrade Tailwind, ESLint, or Vitest major versions.

## Remaining critical/high findings

- `vitest` → `tinypool`: critical prototype-pollution/RCE advisories. The safe fix requires Vitest 5, a major upgrade; deferred.
- `vitest` → `vite`/`vite-node`/`esbuild`: high/moderate development-server advisories. The available audit fix requires a Vitest major upgrade; deferred.
- `tailwindcss@3.4.17` → `chokidar`/`braces`/`micromatch`/`postcss-nested`/`postcss-selector-parser`: high/moderate development-tooling advisories. The available fix requires Tailwind 4, a major migration; deferred.
- `eslint-config-next@16.3.8` → `@next/eslint-plugin-next`/`fast-glob`/`micromatch`: high development-tooling advisory path. The audit resolver proposes an incompatible older `eslint-config-next@14.2.35`; no downgrade was applied because it would misalign with Next 16.3.8. Revisit with a compatible Next ESLint release.

## Production versus development exposure

All remaining vulnerable paths are marked development-only by npm audit. No vulnerable package was identified in the production dependency graph. Development risks still matter for CI/developer machines and should be addressed before exposing local test/UI servers to untrusted networks.

## Validation

Run after the dependency update:

- `npm audit`: completed; 14 residual findings remain.
- `npm audit`: completed; 14 residual findings remain (2 critical, 8 high, 4 moderate).
- `npm test`: passed — 2 files, 8 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 0 errors and 8 warnings.
- `npm run build`: passed with Next.js 16.3.8; 41 static pages generated.
- `git diff --check`: passed.

## Separate migration plan

1. Upgrade Vitest in an isolated branch, then update Vite/Vite Node/tinypool and run the full test suite.
2. Migrate Tailwind 3 to Tailwind 4 separately, including PostCSS/config and visual regression review.
3. Revisit ESLint/Next alignment only with a version explicitly compatible with Next 16.3.8.
4. Re-run audit and production build after each migration; do not combine these major changes with application security fixes.
