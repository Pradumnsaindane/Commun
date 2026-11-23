/**
 * Legacy compatibility adapter.
 *
 * Canonical implementation: `/api/v1/reactions`.
 * The response contract is unchanged; the domain logic lives in
 * `server/modules/interactions/service.ts`.
 */
export { GET, POST } from '@/app/api/v1/reactions/route'
