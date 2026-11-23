/**
 * Legacy compatibility adapter.
 *
 * Canonical implementation: `/api/v1/auth/availability`.
 * The response contract is unchanged; the domain logic lives in
 * `server/modules/auth/service.ts`.
 */
export { GET } from '@/app/api/v1/auth/availability/route'
