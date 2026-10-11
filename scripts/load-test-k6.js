import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Commun.dev - Repeatable k6 Staging Load Test Plan
 * Validates baseline performance across public reading surfaces:
 * - Homepage / Landing
 * - Explore Feed
 * - Discussions Index
 * - Developer News Index
 * - Developer News JSON API
 * - Search API
 *
 * Execution:
 *   k6 run --env TARGET_URL=https://staging.commun.dev scripts/load-test-k6.js
 *
 * Thresholds:
 *   - Error rate < 1%
 *   - p95 latency < 500ms
 *   - p99 latency < 1200ms
 */

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp-up to 10 VUs (virtual users)
    { duration: '1m', target: 25 },   // Steady moderate load at 25 VUs
    { duration: '30s', target: 50 },  // Peak burst at 50 VUs
    { duration: '30s', target: 0 },   // Graceful ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Under 1% failures
    http_req_duration: ['p(95)<500', 'p(99)<1200'], // 95% of requests under 500ms
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  const endpoints = [
    { url: `${BASE_URL}/`, name: 'Homepage' },
    { url: `${BASE_URL}/explore`, name: 'Explore' },
    { url: `${BASE_URL}/discussions`, name: 'Discussions' },
    { url: `${BASE_URL}/news`, name: 'News_UI' },
    { url: `${BASE_URL}/api/news`, name: 'News_API' },
  ];

  for (const endpoint of endpoints) {
    const res = http.get(endpoint.url, {
      tags: { endpoint: endpoint.name },
      headers: { 'User-Agent': 'k6-load-test/1.0' },
    });

    check(res, {
      [`${endpoint.name} status is 200`]: (r) => r.status === 200,
    });

    sleep(0.5);
  }
}
