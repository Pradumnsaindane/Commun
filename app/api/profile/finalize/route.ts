/**
 * Legacy compatibility adapter.
 *
 * Canonical implementation: `/api/v1/profiles/finalize`.
 * The response contract is unchanged; the domain logic lives in
 * `server/modules/profiles/service.ts`.
 */
export { POST } from '@/app/api/v1/profiles/finalize/route'
