/**
 * Legacy compatibility adapter.
 *
 * Canonical implementation: `/api/v1/social-posts`.
 * The response contract is unchanged; the domain logic lives in
 * `server/modules/social-posts/service.ts`.
 */
export { POST } from '@/app/api/v1/social-posts/route'
