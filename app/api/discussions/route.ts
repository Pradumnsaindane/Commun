/**
 * Legacy compatibility adapter.
 *
 * Canonical implementation: `/api/v1/discussions`.
 * The response contract is unchanged; the domain logic lives in
 * `server/modules/discussions/service.ts`.
 */
export { GET, POST } from '@/app/api/v1/discussions/route'
