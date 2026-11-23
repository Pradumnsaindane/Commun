/**
 * Legacy compatibility adapter.
 *
 * Canonical implementation: `/api/v1/search`.
 * The response contract is unchanged; the domain logic lives in
 * `server/modules/search/service.ts`.
 */
export { GET } from '@/app/api/v1/search/route'
