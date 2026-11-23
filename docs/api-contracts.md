# API contracts

## Canonical prefix

All application API traffic uses `/api/v1`. The constant `API_BASE` in `packages/shared/constants/index.ts` is the single source of truth, and `features/api-client.ts` prefixes every relative request with it.

Legacy unversioned routes still resolve, but they are compatibility adapters only:

```text
/api/feed  →  /api/v1/feed
/api/posts →  /api/v1/posts
...
```

Do not add new frontend calls to unversioned paths.

## Frontend usage

```ts
import { apiRequest } from '@/features/api-client'

export function listFeed(options: { tab: 'following' | 'latest' }) {
  const query = new URLSearchParams(options)
  return apiRequest<FeedPageResponse>(`/feed?${query}`)
}
```

Preferred pattern:

1. Add or extend a typed function in `features/<domain>/api.ts`.
2. Call that function from components.
3. Catch `ApiError` (or use `errorMessage()`) to display server messages.
4. Never call `fetch('/api/...')` from a component.

`apiRequest` behavior:

| Case | Result |
| --- | --- |
| `204` response | Resolves `undefined` |
| Success JSON | Resolves parsed payload |
| Non-JSON failure | Generic message based on status |
| `401` | Throws `SessionExpiredError` |
| Network failure | Throws `NetworkError` |
| Validation failure | Throws `ApiError` with `payload.issues` when supplied |
| `429` | `ApiError.headers` retains `Retry-After` |

## Endpoint inventory

### Public or mixed access

| Endpoint | Methods | Notes |
| --- | --- | --- |
| `/api/v1/auth/availability` | GET | Public username availability check |
| `/api/v1/news` | GET | Developer news; falls back to external sources when uncached |
| `/api/v1/posts/[slug]` | GET | Article reader; enforces membership gating server-side |
| `/api/v1/search` | GET | Search across developers, articles, discussions, and topics |

### Authenticated social core

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/v1/feed` | GET | Following/latest article and post feed |
| `/api/v1/posts` | GET, POST | Article list and creation |
| `/api/v1/posts/[slug]` | PATCH, DELETE | Owner article mutations |
| `/api/v1/social-posts` | POST | Short post, snippet, or link creation |
| `/api/v1/social-posts/[id]` | PATCH, DELETE | Owner social post mutations |
| `/api/v1/comments` | GET, POST | Article comments and replies |
| `/api/v1/discussions` | GET, POST | Discussion list and creation |
| `/api/v1/replies` | GET, POST | Discussion replies |
| `/api/v1/reactions` | GET, POST | Like/save state and toggles |
| `/api/v1/follows` | POST, DELETE | Follow/unfollow developers |
| `/api/v1/profiles` | GET, PATCH | Own profile read/update |
| `/api/v1/profiles/finalize` | POST | Onboarding completion |
| `/api/v1/notifications` | GET, POST, PATCH, DELETE | Notification list, creation helpers, read/clear |
| `/api/v1/reports` | GET, POST | Own report list and report submission |

### Trust, safety, and administration

| Endpoint | Methods | Access |
| --- | --- | --- |
| `/api/v1/moderation/reports` | GET | Moderator/admin |
| `/api/v1/moderation/reports/[id]` | GET, POST | Moderator/admin |
| `/api/v1/admin/users` | GET, PATCH | Admin |
| `/api/v1/admin/audit-logs` | GET | Admin |

Supported moderator actions are `RESOLVE`, `DISMISS`, `REMOVE`, and `RESTORE`. User-suspension actions are intentionally not advertised by the API because they are not implemented by this handler; use `/api/v1/admin/users` for status changes.

### Product telemetry and billing

| Endpoint | Methods | Notes |
| --- | --- | --- |
| `/api/v1/analytics` | POST | Best-effort product event insertion, authenticated |
| `/api/v1/feedback` | POST | Private beta feedback, authenticated and rate limited |
| `/api/v1/billing/checkout` | POST | Creates Stripe Checkout session for a creator |
| `/api/v1/billing/portal` | POST | Opens Stripe Billing Portal |
| `/api/v1/billing/connect` | GET, POST | Payout account status and Connect onboarding link |

Billing handlers return HTTP 503 when Stripe is not configured. UI surfaces hide purchase actions in that state.

### Operational endpoints

| Endpoint | Methods | Notes |
| --- | --- | --- |
| `/api/v1/news/ingest` | POST | Requires `CRON_SECRET` bearer token or admin session |
| `/api/webhooks/stripe` | POST | Intentionally unversioned; Stripe signature verified |
| `/auth/callback` | GET | Intentionally unversioned Supabase OAuth/PKCE callback |

## Error shape

Failures use a consistent JSON envelope:

```json
{ "error": "A safe user-facing message." }
```

Validation errors may include details:

```json
{
  "error": "Invalid request.",
  "issues": [{ "path": "title", "message": "Required" }]
}
```

Status conventions:

| Status | Meaning |
| --- | --- |
| `401` | Authentication required or expired session |
| `403` | Role, status, ownership, or entitlement check failed |
| `404` | Resource not found |
| `409` | Conflict, duplicate, or invalid state transition |
| `422` | Validation failed |
| `429` | Rate limit exceeded; `Retry-After` when available |
| `503` | Required external integration is not configured |
| `500` | Internal failure; do not expose raw database or provider errors |

## Validation and input boundaries

- All request bodies are parsed with Zod or a validated shared schema.
- Query parameters are coerced and bounded before reaching repositories.
- IDs are treated as opaque strings at the HTTP boundary and encoded when used in client URLs.
- PostgREST `.or()` filters must escape user input; see `lib/search-query.ts` for the shared helper.
- Request bodies are read through `server/http/response.ts` where available to avoid unbounded parsing.

## Rate limiting

`lib/rate-limit.ts` uses Upstash Redis when `UPSTASH_REDIS_REST_*` or `KV_REST_API_*` variables are configured. When they are absent, it uses an in-process fixed-window fallback so rate-limited routes do not fail closed with HTTP 500. Shared Redis is required for correct limits across multiple server instances.

## Adding a new endpoint

1. Define shared request/response types in `packages/shared` when the contract is reused.
2. Implement business behavior in `server/modules/<domain>/service.ts` and return a `ServiceResult`.
3. Add repository functions in `server/repositories` for Supabase access.
4. Add a thin adapter in `app/api/v1/<domain>/route.ts`.
5. Add a legacy re-export only if an existing client needs the old path.
6. Add a typed function in `features/<domain>/api.ts`.
7. Add focused tests for validation, service results, and client error handling.
