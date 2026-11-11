import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { finalizeProfileSchema, isMissingColumnError, normalizeGithub, normalizeUrl } from '@/lib/profile'

/**
 * Server-side onboarding finalisation.
 *
 * This is the ONLY place the application sets an account to ACTIVE. Identity
 * comes from the session; the request body can only carry profile facts. The
 * browser no longer writes `status` at all.
 *
 * Defence in depth: the proposed migration in
 * supabase/proposed_phase_1b_social.sql adds a column-level rule so a direct
 * PostgREST update from a user session cannot set `status` or `role` either.
 * Until that migration is applied, this route removes the app-level hole but
 * cannot change the database's own policy surface.
 */

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 422 })
  }

  const parsed = finalizeProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Please check your profile details.' },
      { status: 422 }
    )
  }
  const input = parsed.data
  const username = input.username.toLowerCase()

  const { data: taken } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .neq('id', user.id)
    .limit(1)
    .maybeSingle()
  if (taken) return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })

  const website = input.website ? normalizeUrl(input.website) : null
  const github = input.github ? normalizeGithub(input.github) : null
  if (input.website && !website) return NextResponse.json({ error: 'Enter a valid website URL.' }, { status: 422 })
  if (input.github && !github) return NextResponse.json({ error: 'Enter a valid GitHub profile.' }, { status: 422 })

  const payload: Record<string, unknown> = {
    display_name: input.displayName,
    username,
    bio: input.bio || null,
    headline: input.headline || null,
    github,
    website,
    interests: input.interests,
    onboarding_completed: true,
    status: 'ACTIVE',
  }

  // Prefer the service-role client so the status transition stays possible once
  // the proposed column-protection trigger is applied. Without a service key we
  // fall back to the user session and report that the transition was not
  // elevated, rather than pretending it was.
  const admin = createAdminClient()
  const writer = admin ?? supabase
  let result = await writer.from('profiles').update(payload).eq('id', user.id).select('id,username,status').maybeSingle()
  let skipped: string[] = []

  if (result.error && isMissingColumnError(result.error)) {
    const { headline, ...legacy } = payload
    skipped = headline ? ['headline'] : []
    result = await writer.from('profiles').update(legacy).eq('id', user.id).select('id,username,status').maybeSingle()
  }

  if (result.error?.code === '23505') return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })
  if (result.error) return NextResponse.json({ error: 'Unable to finish setting up your profile.' }, { status: 500 })

  return NextResponse.json({ ok: true, profile: result.data ?? null, skipped, elevated: Boolean(admin) })
}
