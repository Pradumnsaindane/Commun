/**
 * Legacy compatibility adapter.
 *
 * Canonical implementation: `/api/v1/posts/[slug]`.
 * The response contract is unchanged; the domain logic lives in
 * `server/modules/posts/service.ts`.
 */
export { DELETE, GET, PATCH } from '@/app/api/v1/posts/[slug]/route'
