/**
 * Legacy compatibility adapter.
 *
 * Canonical implementation: `/api/v1/notifications`.
 * The response contract is unchanged; the domain logic lives in
 * `server/modules/notifications/service.ts`.
 */
export { DELETE, GET, PATCH, POST } from '@/app/api/v1/notifications/route'
