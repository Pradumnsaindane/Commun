# CI/CD Pipeline & Deployment Automation Architecture

This document defines the Continuous Integration (CI) and Continuous Deployment (CD) pipeline for **Commun.dev** (`commun-dev`), detailing release gates, automated verification stages, deployment smoke tests, environment configurations, and rollback criteria.

---

## 1. CI/CD Architecture

The Commun.dev release pipeline uses **GitHub Actions** for automated validation and quality gates, paired with **Vercel native Git integration** for zero-downtime Preview and Production deployments.

```
                           ┌────────────────────────────┐
                           │      Pull Request / Push   │
                           │         (to `main`)        │
                           └─────────────┬──────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │    GitHub Actions: CI Pipeline       │
                      │  (.github/workflows/ci.yml)         │
                      ├──────────────────────────────────────┤
                      │ 1. Checkout (actions/checkout@v4)    │
                      │ 2. Setup Node.js 20 LTS + Cache      │
                      │ 3. Clean Install (npm ci)            │
                      │ 4. Vitest Suite (npm run test)       │
                      │ 5. TypeScript (npm run typecheck)    │
                      │ 6. ESLint (npm run lint)             │
                      │ 7. Production Build (npm run build)  │
                      │ 8. Dependency Security Audit         │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                                   [ CI PASS ]
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
       ┌────────────────────────┐                ┌────────────────────────┐
       │   Pull Request Branch  │                │     `main` Branch      │
       ├────────────────────────┤                ├────────────────────────┤
       │ Vercel Preview Deploy  │                │ Vercel Production      │
       │ (Isolated Preview Env) │                │ Deployment (Live Site) │
       └────────────┬───────────┘                └────────────┬───────────┘
                    │                                         │
                    └────────────────────┬────────────────────┘
                                         ▼
                      ┌──────────────────────────────────────┐
                      │  Post-Deployment Smoke Tests         │
                      │  (.github/workflows/smoke-test.yml)  │
                      │  - Target reachability & HTTP 200    │
                      │  - Auth guard HTTP 401 (/api/*)      │
                      │  - Route redirection (/feed, etc.)   │
                      │  - SEO endpoints (/robots.txt, etc.) │
                      └──────────────────────────────────────┘
```

---

## 2. Pipeline Stages & Triggers

### 2.1 Continuous Integration (`.github/workflows/ci.yml`)

#### Triggers
- `pull_request` targeting `main`: Executes validation on incoming candidate changes.
- `push` to `main`: Verifies merged code in the release trunk.
- `workflow_dispatch`: Enables manual triggering for ad-hoc validation.

#### Execution Stages
1. **Repository Checkout**: Uses `actions/checkout@v4` with read-only permissions (`permissions: contents: read`).
2. **Node.js LTS Environment**: Pinned to Node.js 20 LTS using `actions/setup-node@v4` with native `cache: 'npm'`.
3. **Deterministic Dependency Installation**: Runs `npm ci` to ensure lockfile fidelity with `package-lock.json`.
4. **Automated Unit & Security Tests**: Runs `npm run test` (`vitest run`), validating utility helpers, authorization barriers, and token signing.
5. **TypeScript Compilation Verification**: Runs `npm run typecheck` (`tsc --noEmit`), enforcing zero compiler errors.
6. **ESLint Code Quality**: Runs `npm run lint` (`eslint .`), checking Next.js App Router rules and React component invariants.
7. **Production Build Compilation**: Runs `npm run build` (`next build`), compiling server route handlers, client components, and static routes with mock environment fallback values.
8. **Dependency Security Audit**:
   - **Production Runtime Gate**: Runs `npm audit --omit=dev --audit-level=high`. Fails immediately if any high or critical vulnerability enters production runtime packages.
   - **Development Tooling Report**: Emits full vulnerability report to `$GITHUB_STEP_SUMMARY` while documenting known dev-only advisories (Tailwind 3, Vitest, ESLint).

---

## 3. Required GitHub Actions Workflows

| File | Purpose | Concurrency Rule |
|---|---|---|
| [`.github/workflows/ci.yml`](file:///Users/pradumnbharatsaindane/Documents/Commun.com/.github/workflows/ci.yml) | Validates lint, types, tests, builds, and dependencies | `${{ github.workflow }}-${{ github.ref }}` (cancel in-progress) |
| [`.github/workflows/smoke-test.yml`](file:///Users/pradumnbharatsaindane/Documents/Commun.com/.github/workflows/smoke-test.yml) | Runs post-deployment endpoint and security guard tests | `${{ github.workflow }}-${{ inputs.environment }}` |

---

## 4. Branch Protection & Required Status Checks

To prevent broken code or unverified changes from reaching production:

1. **Target Branch**: Protect the `main` branch in GitHub Repository Settings (`Settings` → `Branches` → `Branch protection rules`).
2. **Require a Pull Request before merging**: Enable `Require a pull request before merging` (require at least 1 approving review).
3. **Require Status Checks to Pass**:
   - Enable `Require status checks to pass before merging`.
   - Mark the following check as strictly required:
     - `Code Validation, Testing & Build` (from `.github/workflows/ci.yml`)
4. **Require Linear History / Up-to-Date Branches**: Enable `Require branches to be up to date before merging` to ensure tested commits match the final merge commit.

---

## 5. Vercel Preview & Production Behavior

The project relies on Vercel's native GitHub integration configured via [`vercel.json`](file:///Users/pradumnbharatsaindane/Documents/Commun.com/vercel.json) (`{"framework": "nextjs"}`):

- **Pull Requests (Preview Deployments)**:
  - Vercel automatically generates an ephemeral preview deployment URL for pull requests.
  - Preview deployments run isolated and **must not receive production secrets**.
- **Production Deployments**:
  - Pushes or merges into `main` trigger a production deployment to `commun.dev`.
  - Deployment is gated by GitHub Branch Protection: PRs cannot be merged until all CI checks pass.
- **No Duplicate Pipelines**:
  - The pipeline does not invoke custom deployment actions or duplicate Vercel CLI scripts in GitHub Actions, eliminating redundant runner costs and token exposure.

---

## 6. Required Secrets and Variables (By Name Only)

All secrets must be configured in **GitHub Repository Secrets** and **Vercel Project Environment Variables**.

> [!CAUTION]
> Never commit actual secret values to version control. Only reference them by name.

### Secrets Matrix

| Variable / Secret Name | Environment Scope | Sensitivity | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Preview & Production | Public | Supabase project API gateway endpoint |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Preview & Production | Public | Supabase publishable / anon client API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (Server-Only) | **Critical Secret** | Supabase privileged service-role key for admin actions and audit logging |
| `KV_REST_API_URL` | Preview & Production | Server-Only | Upstash Redis REST endpoint for rate limiting |
| `KV_REST_API_TOKEN` | Preview & Production | **Critical Secret** | Upstash Redis authorization bearer token |
| `NEXT_PUBLIC_SITE_URL` | Preview & Production | Public | Canonical site URL (e.g., `https://commun.dev`) for sitemap and robots |

---

## 7. Separate Staging & Production Configuration

- **Staging / Preview Isolation**:
  - Staging and Preview environments must use a dedicated, isolated Supabase project and Redis instance.
  - If a dedicated staging Supabase project is unavailable, preview deployments must use disposable test data and never perform destructive mutations.
- **Production Protection**:
  - Production credentials (`SUPABASE_SERVICE_ROLE_KEY`, production `KV_REST_API_TOKEN`) must only be assigned to Vercel's **Production** environment scope.
  - Untrusted pull request branches must never be granted access to production secrets.

---

## 8. Local Pipeline Validation Commands

Before pushing commits or opening a pull request, run the exact local pre-flight sequence:

```bash
# 1. Clean installation
npm ci

# 2. Run unit and security tests
npm test

# 3. Validate TypeScript types
npm run typecheck

# 4. Run ESLint checks
npm run lint

# 5. Verify Next.js production build
NEXT_PUBLIC_SUPABASE_URL="https://example.supabase.co" \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="mock_key" \
npm run build

# 6. Check for whitespace/git diff issues
git diff --check

# 7. Audit production runtime dependencies
npm audit --omit=dev --audit-level=high

# 8. Run deployment smoke tests (against a local or deployed server)
npm run test:smoke -- --url=http://localhost:3000
```

---

## 9. Smoke-Test Behavior (`scripts/smoke-test.mjs`)

The smoke test runner requires an explicitly configured URL (via `--url=...` or `TARGET_URL` environment variable) and performs non-destructive HTTP verification:

1. **Target Reachability & Landing Page**: Verifies `${TARGET_URL}/` responds with HTTP `200 OK`. Network failures and timeouts (10s threshold) are logged as explicit failures.
2. **Public Core Pages**: Verifies `/explore`, `/discussions`, `/login`, `/register`, `/robots.txt`, and `/sitemap.xml` return HTTP `200` with expected MIME types.
3. **Protected Route Redirection**: Verifies unauthenticated GET requests to `/dashboard`, `/feed`, `/write`, `/saved`, `/notifications`, `/settings`, `/moderation`, and `/admin/*` return HTTP `302`/`307` redirects pointing to `/login`.
4. **API Auth Boundaries**: Verifies unauthenticated requests to protected API routes (`/api/notifications` and `/api/feedback`) return HTTP `401 Unauthorized`.
5. **Security Headers Baseline**: Confirms `X-Content-Type-Options` and `X-Frame-Options` headers are present.

---

## 10. Rollback and Recovery Procedures

1. **Vercel Instant Rollback**:
   - In the Vercel Dashboard (`Deployments` tab), select the previous known-good deployment and click **Promote to Production** (Instant Rollback completes in < 5 seconds).
2. **Git Revert**:
   - If a rollback commit is needed, create a revert commit: `git revert <commit-sha> -m 1` and push through standard CI.
3. **Database Migration Safety**:
   - Database migrations in `supabase/migrations/` must be forward-compatible.
   - Never reset or run destructive down-migrations against the production database.

---

## 11. Known Limitations & Manual Configuration Requirements

1. **Development Tooling Advisories**:
   - `npm audit` reports 14 vulnerabilities strictly confined to development dependencies (`tailwindcss` 3.4.17, `vitest` 1.6.1, `eslint-config-next`).
   - `npm audit --omit=dev` verifies **0 vulnerabilities** in production runtime packages. Upgrading Tailwind to v4 or Vitest to v5 constitutes major breaking migrations and must be scheduled separately.
2. **Vercel Output Framework**:
   - Ensure the Vercel project build settings reflect the Next.js preset (ensured via [`vercel.json`](file:///Users/pradumnbharatsaindane/Documents/Commun.com/vercel.json)).
3. **GitHub Branch Protection Activation**:
   - Enabling required status checks and branch protection requires administrative permissions in the GitHub repository web settings.
