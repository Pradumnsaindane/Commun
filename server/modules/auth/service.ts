import { z } from 'zod'
import { enforceRateLimit, requestKey } from '@/lib/rate-limit'
import { sanitizeSearchTerm } from '@/lib/search-query'
import { getRequestContext } from '@/server/http/auth'
import { failure, success } from '@/server/http/result'
import { findUsernameOwner } from '@/server/repositories/profiles'

/**
 * Username availability.
 *
 * Usernames are already public (they appear in profile URLs), so confirming
 * whether one is taken leaks nothing that browsing the directory would not.
 * Email availability is deliberately NOT exposed here — it would turn this
 * endpoint into an account-existence oracle.
 */
const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(24)
  .regex(/^[a-zA-Z0-9_]+$/)

export async function checkUsernameAvailability(request: Request) {
  const rate = await enforceRateLimit(requestKey(request, 'availability'), 'availability', 30, '1 m')
  if (!rate.success) return failure('Too many checks. Try again shortly.', 429)

  const raw = new URL(request.url).searchParams.get('username') ?? ''
  const parsed = usernameSchema.safeParse(sanitizeSearchTerm(raw, 24))
  if (!parsed.success) return failure('Enter a valid username.', 422)

  const { supabase } = await getRequestContext()
  const { data, error } = await findUsernameOwner(supabase, parsed.data)
  if (error) return failure('Unable to check that username right now.', 500)

  return success(
    { username: parsed.data.toLowerCase(), available: !data },
    200,
    { 'cache-control': 'no-store' }
  )
}
