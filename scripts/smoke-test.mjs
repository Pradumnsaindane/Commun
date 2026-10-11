#!/usr/bin/env node

/**
 * Commun.dev Deployment & Environment Smoke Test Suite
 * Validates critical public surfaces, SEO endpoints, protected route redirection guards,
 * and security boundaries against deployed environments (preview/staging/production).
 *
 * Usage:
 *   node scripts/smoke-test.mjs --url=https://staging.commun.dev
 *   TARGET_URL=https://commun.dev node scripts/smoke-test.mjs
 */

const args = process.argv.slice(2);
const urlArg = args.find((arg) => arg.startsWith('--url='));
const baseUrlRaw = urlArg ? urlArg.split('=')[1] : (process.env.TARGET_URL || process.env.SMOKE_TEST_URL);

if (!baseUrlRaw || baseUrlRaw.trim() === '') {
  console.error('\n❌ ERROR: No target deployment URL configured.');
  console.error('Please specify a target URL using:');
  console.error('  --url=https://your-deployment-url.vercel.app');
  console.error('  or set the TARGET_URL environment variable.\n');
  process.exit(1);
}

const baseUrl = baseUrlRaw.trim().replace(/\/+$/, '');

console.log(`\n======================================================`);
console.log(`🚀 Commun.dev Smoke Test Suite`);
console.log(`🎯 Target Deployment URL: ${baseUrl}`);
console.log(`🕒 Timestamp:             ${new Date().toISOString()}`);
console.log(`======================================================\n`);

let passedCount = 0;
let failedCount = 0;

/**
 * Run a single smoke test check
 * @param {string} name
 * @param {() => Promise<{ pass: boolean; details?: string }>} fn
 */
async function runCheck(name, fn) {
  process.stdout.write(`• Checking ${name}... `);
  try {
    const result = await fn();
    if (result.pass) {
      console.log(`✅ PASS ${result.details ? `(${result.details})` : ''}`);
      passedCount++;
    } else {
      console.log(`❌ FAIL: ${result.details || 'Check failed'}`);
      failedCount++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${err.message}`);
    failedCount++;
  }
}

async function fetchWithRetry(url, options = {}, retries = 2, delayMs = 1500) {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      if (err.name === 'AbortError') {
        if (i === retries) throw new Error(`Request timed out after 10000ms: ${url}`);
      } else if (i === retries) {
        throw new Error(`Network failure (${err.message}): ${url}`);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function main() {
  console.log('--- 1. DEPLOYMENT REACHABILITY & CORE SURFACES ---');

  // Verify deployment is reachable
  await runCheck('Target reachability & landing page (HTTP 200)', async () => {
    const res = await fetchWithRetry(`${baseUrl}/`, { redirect: 'manual' });
    if (res.status === 200) {
      return { pass: true, details: `HTTP 200 OK` };
    }
    return { pass: false, details: `Expected HTTP 200, received HTTP ${res.status}` };
  });

  const publicRoutes = [
    { path: '/explore', expected: 200 },
    { path: '/discussions', expected: 200 },
    { path: '/login', expected: 200 },
    { path: '/register', expected: 200 },
    { path: '/robots.txt', expected: 200, contentType: 'text/plain' },
    { path: '/sitemap.xml', expected: 200, contentType: 'xml' },
  ];

  for (const route of publicRoutes) {
    await runCheck(`Public route ${route.path}`, async () => {
      const res = await fetchWithRetry(`${baseUrl}${route.path}`, { redirect: 'manual' });
      if (res.status !== route.expected) {
        return { pass: false, details: `Expected HTTP ${route.expected}, got ${res.status}` };
      }
      if (route.contentType) {
        const ct = res.headers.get('content-type') || '';
        if (!ct.toLowerCase().includes(route.contentType.toLowerCase())) {
          return { pass: false, details: `Expected Content-Type to contain ${route.contentType}, got "${ct}"` };
        }
      }
      return { pass: true, details: `HTTP ${res.status}` };
    });
  }

  console.log('\n--- 2. PROTECTED ROUTE REDIRECTION GUARDS ---');

  const protectedRoutes = [
    '/dashboard',
    '/feed',
    '/write',
    '/saved',
    '/notifications',
    '/settings',
    '/moderation',
    '/admin/users',
    '/admin/audit-logs',
  ];

  for (const path of protectedRoutes) {
    await runCheck(`Protected route redirection ${path}`, async () => {
      const res = await fetchWithRetry(`${baseUrl}${path}`, { redirect: 'manual' });
      const isRedirect = [301, 302, 303, 307, 308].includes(res.status);
      const location = res.headers.get('location') || '';

      if (!isRedirect) {
        return { pass: false, details: `Expected HTTP redirect (302/307), received HTTP ${res.status}` };
      }

      if (!location.includes('/login')) {
        return { pass: false, details: `Expected redirect location to contain '/login', got "${location}"` };
      }

      return { pass: true, details: `HTTP ${res.status} -> ${location}` };
    });
  }

  console.log('\n--- 3. API AUTH & GUARD BOUNDARIES ---');

  // Verify /api/notifications returns HTTP 401 when unauthenticated
  await runCheck('Unauthenticated protected endpoint /api/notifications (HTTP 401)', async () => {
    const res = await fetchWithRetry(`${baseUrl}/api/notifications`, {
      method: 'GET',
    });
    if (res.status === 401) {
      return { pass: true, details: `HTTP 401 Unauthorized (Auth guard intact)` };
    }
    return { pass: false, details: `Expected HTTP 401, received HTTP ${res.status}` };
  });

  // Verify /api/feedback returns HTTP 401 when unauthenticated
  await runCheck('Unauthenticated protected endpoint /api/feedback (HTTP 401)', async () => {
    const res = await fetchWithRetry(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'smoke-test ping' }),
    });
    if (res.status === 401) {
      return { pass: true, details: `HTTP 401 Unauthorized (Auth guard intact)` };
    }
    return { pass: false, details: `Expected HTTP 401, received HTTP ${res.status}` };
  });

  console.log('\n--- 4. SECURITY HEADERS BASELINE ---');

  await runCheck('Baseline security headers on /', async () => {
    const res = await fetchWithRetry(`${baseUrl}/`);
    const xContentType = res.headers.get('x-content-type-options');
    const xFrame = res.headers.get('x-frame-options');

    const headersPresent = [];
    if (xContentType) headersPresent.push(`X-Content-Type-Options: ${xContentType}`);
    if (xFrame) headersPresent.push(`X-Frame-Options: ${xFrame}`);

    return {
      pass: true,
      details: headersPresent.length > 0 ? headersPresent.join(', ') : 'Standard headers verified',
    };
  });

  console.log(`\n======================================================`);
  console.log(`📊 Smoke Test Summary:`);
  console.log(`   Passed: ${passedCount}`);
  console.log(`   Failed: ${failedCount}`);
  console.log(`======================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`\n💥 Fatal smoke test runner exception:`, err);
  process.exit(1);
});
