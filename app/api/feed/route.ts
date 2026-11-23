/**
 * Legacy compatibility adapter.
 *
 * Canonical implementation: `/api/v1/feed`.
 * The response contract is unchanged; the domain logic lives in
 * `server/modules/feed/service.ts`.
 */
export { GET } from '@/app/api/v1/feed/route'
