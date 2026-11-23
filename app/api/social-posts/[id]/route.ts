/**
 * Legacy compatibility adapter.
 *
 * Canonical implementation: `/api/v1/social-posts/[id]`.
 * The response contract is unchanged; the domain logic lives in
 * `server/modules/social-posts/service.ts`.
 */
export { DELETE, PATCH } from '@/app/api/v1/social-posts/[id]/route'
