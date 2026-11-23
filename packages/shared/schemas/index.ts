/**
 * Validation schemas shared by the client and the server.
 *
 * The definitions live in `lib/` for historical reasons; this module is the
 * supported import path for new code and prevents teams from reaching into
 * implementation folders directly.
 */
export { postInputSchema } from '../../../lib/posts'
export { profileUpdateSchema, finalizeProfileSchema } from '../../../lib/profile'
export { socialPostSchema } from '../../../lib/social-posts'
export { checkoutRequestSchema } from '../../../lib/monetization'
