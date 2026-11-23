/**
 * Legacy compatibility adapter.
 *
 * Canonical implementation: `/api/v1/comments`.
 * The response contract is unchanged; the domain logic lives in
 * `server/modules/comments/service.ts`.
 */
export { GET, POST } from '@/app/api/v1/comments/route'
