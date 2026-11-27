# Phase 13 — Production Dependency Security Remediation

Status: **COMPLETE**

Scope: production dependency advisories only (Next.js and Zod). No application schema, business logic, hosted infrastructure, credential, database migration, or production configuration was changed. No commit or push was made.

## 1. Original vulnerabilities

The reported CI failure was `Audit production runtime dependencies`. The reported versions were reconstructed in a temporary lockfile copy (no repository mutation) with `npm audit --omit=dev --json`, producing:

| Package | Reported/declared baseline | Audit range | Fix | Severity |
| --- | --- | --- | --- | --- |
| `next` | 16.3.8 (declared at `HEAD`) | `16.0.0 - 16.4.4` | 16.4.6 | critical (with high/moderate advisories) |
| `zod` | range `^4.6.5`, vulnerable below 4.6.6 | `<4.6.6` | 4.6.6+ | high |

Next.js advisories observed in the reconstruction:

- `GHSA-2464-fhr4-w9xw` — critical — unauthenticated RCE in image optimization with SVG.
- `GHSA-673q-mjm6-r5xr` — critical — unauthenticated RCE in `use cache` functions returning typed arrays.
- `GHSA-p3m5-59mp-jv5r` — high — DoS in App Router Server Actions.
- `GHSA-mfr8-8qww-v76h`, `GHSA-vc7v-qv4w-wrv8`, `GHSA-7qx7-33qx-rqx2`, `GHSA-f3mh-rxg3-f5g2`, `GHSA-pc58-hwjq-p385`, `GHSA-rhh4-g77r-r9qj` — moderate cache/cookie/response issues.

Zod advisory:

- `GHSA-mrhx-c7xc-m3w5` — high — memory exhaustion while validating oversized constrained collections.

At inspection time, the tracked lockfile at `HEAD` already resolved `next@16.4.6` and `zod@4.6.7`; the declared manifest still allowed the vulnerable Zod range (`^4.6.5`). This phase tightened the manifest range and verified a clean install and audit from the committed lockfile.

## 2. Environment and CI inspection

- Local: Node `v24.22.1`, npm `11.19.1`.
- GitHub Actions: `.github/workflows/ci.yml` uses `actions/setup-node@v4` with `node-version: 20` and `cache: 'npm'`. npm is the version bundled with the selected Node 20 toolchain.
- `next@16.4.6` declares `engines.node >=20.9.0`; CI Node 20 and local Node 24 satisfy that requirement.
- CI install step: `npm ci` (clean, lockfile-driven install). No `npm audit fix --force` appears anywhere in the workflows.
- CI production audit step: `npm audit --omit=dev --audit-level=high`, which fails on high and critical advisories.
- The always-run summary step previously hard-coded a passing production result. It now reports the actual `steps.production_audit.outcome`, so a failed production audit cannot be misrepresented as passing. Development-tooling advisories remain explicitly documented rather than hidden.

`.github/workflows/smoke-test.yml` also uses `npm ci` but does not perform the dependency audit; it was left unchanged.

## 3. Exact installed and upgraded versions

| Package | Before (reported / declared) | After (manifest) | After (lockfile + installed) |
| --- | --- | --- | --- |
| `next` | 16.3.8 | `^16.4.6` | **16.4.6** |
| `zod` | vulnerable `<4.6.6`; declared `^4.6.5` | `^4.6.6` | **4.6.7** |
| `react` | 19.2.0 | 19.2.0 (unchanged) | 19.2.0 |
| `react-dom` | 19.2.0 | 19.2.0 (unchanged) | 19.2.0 |
| `eslint-config-next` | 16.3.8 | 16.3.8 (unchanged, dev-only) | 16.3.8 |
| `@next/eslint-plugin-next` | 16.3.8 | unchanged, dev-only | 16.3.8 |

`next@16.4.6` peer dependencies accept `react`/`react-dom` `^19.0.0`, so React 19.2.0 remains compatible. `eslint-config-next@16.3.8` peer dependencies (`eslint >=9`, `typescript >=3.3`) are satisfied by the installed ESLint 9.39.5 and TypeScript. It is dev-only, does not enter the production bundle, and lint passes; upgrading it was unnecessary for this remediation.

The App Router architecture was preserved. The production build was run with Next.js 16.4.6 and completed all 99 static-page generation workers successfully.

## 4. Zod 3 vs Zod 4 / migration assessment

Zod 4 was already in use:

- Every application import is the standard `import { z } from 'zod'` (or `import type { z } from 'zod'`).
- No `zod/v3`, `zod/v4`, or legacy subpath imports exist.
- `npm ls zod --all` resolves a single production `zod@4.6.7`; the only other Zod edge is dev-only `zod-validation-error@4.0.2`, whose peer range is `^3.25.0 || ^4.0.0` and dedupes to 4.6.7.
- Neither `react-hook-form` nor `@hookform/resolvers` is installed, so there is no resolver compatibility blocker.
- No schema or validation code was changed; validation behavior and error messages are untouched.
- No npm override was added.

## 5. Next.js and Zod dependency graph

Direct and relevant transitive resolutions after `npm ci`:

- Next.js runtime: `next@16.4.6` → `@next/env@16.4.6`, `@swc/helpers@0.5.23`, `styled-jsx@5.1.6`, Next-local `postcss@8.5.23`, `baseline-browser-mapping@2.11.27`, `caniuse-lite@1.0.30001814`, optional `@next/swc-*@16.4.6`, optional `sharp@0.35.5`.
- Zod runtime: `zod@4.6.7` (single copy).
- Dev-only lint path: `eslint-config-next@16.3.8` → `@next/eslint-plugin-next@16.3.8` → `eslint-plugin-react-hooks@7.1.1` → `zod-validation-error@4.0.2` → `zod@4.6.7` (deduped).

No transitive dependency resolves to a vulnerable Zod version, and there is no upstream blocker to document.

## 6. Files changed

- `package.json` — Zod range tightened from `^4.6.5` to `^4.6.6`.
- `package-lock.json` — root manifest range synchronized to `^4.6.6`; resolved versions unchanged (`next@16.4.6`, `zod@4.6.7`).
- `.github/workflows/ci.yml` — production audit step given `id: production_audit`; summary now reports the real audit outcome instead of a hard-coded pass.
- `docs/phase13-dependency-security-remediation.md` — this report.

No other dependency versions were changed. Existing unrelated uncommitted work was preserved.

## 7. Test and audit evidence

All commands were run after `npm ci` from the committed lockfile.

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | 494 packages added; npm reported `found 0 vulnerabilities`. |
| `npm ls next react react-dom zod` | PASS | `next@16.4.6`, `react@19.2.0`, `react-dom@19.2.0`, `zod@4.6.7`; no invalid/peer errors. |
| `npm audit --omit=dev --audit-level=high` | PASS | `found 0 vulnerabilities`. Same command as GitHub Actions. |
| `npm audit --omit=dev --json` | PASS | metadata: high 0, critical 0, total 0; vulnerability list empty. |
| `npm run typecheck` | PASS | `tsc --noEmit` exited 0. |
| `npm run lint` | PASS | 0 errors; 16 pre-existing warnings. |
| `npm test` | PASS | 39 files, 232 tests. |
| Targeted auth/API/notification/billing tests | PASS | 10 files, 54 tests (`lib/auth/validation`, `features/api-client`, `lib/phonepe/*`, `server/modules/billing/*`, `hooks/use-notifications`). |
| `npm run build` | PASS | Next.js 16.4.6 compiled, typechecked, and generated all 99 static pages. |
| YAML parse of `ci.yml` | PASS | Parsed successfully with Ruby YAML. |
| `git diff --check` | PASS | No whitespace errors. |

Vitest 5.1.2 emits a pre-existing Vite config-loader warning about ESM syntax in `vitest.config.ts`; tests still pass. `npm ci` emits npm install-script approval warnings for `fsevents` and `unrs-resolver`; these are install-time notices, not audit advisories.

## 8. Completion criteria

1. **Reported Next.js and Zod vulnerabilities absent from production audit** — VERIFIED: `npm audit --omit=dev --audit-level=high` and JSON audit both report zero vulnerabilities.
2. **Lockfile resolves patched versions** — VERIFIED: lockfile and installed tree both resolve `next@16.4.6` and `zod@4.6.7`; manifest requires `^16.4.6` and `^4.6.6`.
3. **Existing tests pass** — VERIFIED: 39 files / 232 tests, plus 10 targeted files / 54 tests.
4. **Production build succeeds** — VERIFIED: `next build --webpack` completed on Next.js 16.4.6.
5. **Same dependency audit used in GitHub Actions passes** — VERIFIED locally with the exact workflow command: `npm audit --omit=dev --audit-level=high`.

## 9. Remaining security blockers

- Production dependency blockers: **none verified**.
- Dev-only advisories remain documented in `docs/security-dependency-audit.md`; they are outside `--omit=dev` and were not silently promoted, suppressed, or downgraded.
- `eslint-config-next@16.3.8` is intentionally unchanged: it is dev-only, peer-compatible, and lint passes. There is no production upstream blocker.
- Actual GitHub Actions execution was not triggered locally; CI workflow configuration was inspected and the identical audit command was run successfully against a clean `npm ci` install.
