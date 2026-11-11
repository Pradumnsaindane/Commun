import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { enforceRateLimit, requestKey } from '@/lib/rate-limit'
import { sanitizeSearchTerm } from '@/lib/search-query'

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

export async function GET(request: Request) {
  const rate = await enforceRateLimit(requestKey(request, 'availability'), 'availability', 30, '1 m')
  if (!rate.success) return NextResponse.json({ error: 'Too many checks. Try again shortly.' }, { status: 429 })

  const raw = new URL(request.url).searchParams.get('username') ?? ''
  const parsed = usernameSchema.safeParse(sanitizeSearchTerm(raw, 24))
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid username.' }, { status: 422 })

  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('id').ilike('username', parsed.data).limit(1).maybeSingle()
  if (error) return NextResponse.json({ error: 'Unable to check that username right now.' }, { status: 500 })

  return NextResponse.json(
    { username: parsed.data.toLowerCase(), available: !data },
    { headers: { 'cache-control': 'no-store' } }
  )
}
