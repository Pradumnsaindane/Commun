/**
 * Legacy compatibility adapter.
 *
 * Canonical implementation: `/api/v1/posts`.
 * The response contract is unchanged; the domain logic lives in
 * `server/modules/posts/service.ts`.
 */
export { GET, POST } from '@/app/api/v1/posts/route'
