/**
 * Legacy compatibility adapter.
 *
 * Canonical implementation: `/api/v1/profiles`.
 * The response contract is unchanged; the domain logic lives in
 * `server/modules/profiles/service.ts`.
 */
export { GET, PATCH } from '@/app/api/v1/profiles/route'
