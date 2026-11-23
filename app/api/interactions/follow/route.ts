/**
 * Legacy compatibility adapter.
 *
 * Canonical implementation: `/api/v1/follows`.
 * The response contract is unchanged; the domain logic lives in
 * `server/modules/interactions/service.ts`.
 */
export { DELETE, POST } from '@/app/api/v1/follows/route'
