import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  isMissingColumnError,
  normalizeGithub,
  normalizeUrl,
  profileUpdateSchema,
  toLegacyProfileUpdate,
} from '@/lib/profile'

/**
 * Own-profile reads and writes.
 *
 * Ownership always comes from the session. The payload is whitelisted, so a
 * caller can never set `status`, `role`, `id`, or `onboarding_completed`
 * through this route. New professional columns are part of the Phase 1B
 * migration proposal; when they are absent the write is retried with the
 * existing columns and the response reports what was skipped.
 */

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (error) return NextResponse.json({ error: 'Unable to load your profile.' }, { status: 500 })
  return NextResponse.json({ profile: data ?? null }, { headers: { 'cache-control': 'private, no-store' } })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 422 })
  }

  const parsed = profileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Please check the profile fields.',
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      },
      { status: 422 }
    )
  }
  const input = parsed.data

  const payload: Record<string, unknown> = {}
  const invalid: string[] = []

  if (input.displayName !== undefined) payload.display_name = input.displayName
  if (input.bio !== undefined) payload.bio = input.bio || null
  if (input.headline !== undefined) payload.headline = input.headline || null
  if (input.location !== undefined) payload.location = input.location || null
  if (input.coverImagePath !== undefined) payload.cover_image_path = input.coverImagePath || null
  if (input.skills !== undefined) payload.skills = input.skills
  if (input.technologies !== undefined) payload.technologies = input.technologies
  if (input.interests !== undefined) payload.interests = input.interests

  for (const [key, value] of [
    ['website', input.website],
    ['github', input.github],
    ['portfolio_url', input.portfolioUrl],
    ['avatar_url', input.avatarUrl],
  ] as const) {
    if (value === undefined) continue
    if (!value.trim()) {
      payload[key] = null
      continue
    }
    const normalized = key === 'github' ? normalizeGithub(value) : normalizeUrl(value)
    if (!normalized) {
      invalid.push(key)
      continue
    }
    payload[key] = normalized
  }

  if (invalid.length) {
    return NextResponse.json({ error: `Enter a valid link for: ${invalid.join(', ')}.` }, { status: 422 })
  }

  if (input.username !== undefined) {
    const username = input.username.toLowerCase()
    const { data: taken } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .neq('id', user.id)
      .limit(1)
      .maybeSingle()
    if (taken) return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })
    payload.username = username
  }

  if (!Object.keys(payload).length) return NextResponse.json({ error: 'Nothing to update.' }, { status: 422 })

  let result = await supabase.from('profiles').update(payload).eq('id', user.id).select('*').maybeSingle()
  let skipped: string[] = []

  if (result.error && isMissingColumnError(result.error)) {
    const { legacy, skipped: removed } = toLegacyProfileUpdate(payload)
    skipped = removed
    if (Object.keys(legacy).length) {
      result = await supabase.from('profiles').update(legacy).eq('id', user.id).select('*').maybeSingle()
    } else {
      return NextResponse.json(
        { error: 'Those profile fields need the Phase 1B database update.', code: 'SCHEMA_REQUIRED', skipped },
        { status: 409 }
      )
    }
  }

  if (result.error?.code === '23505') return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })
  if (result.error) return NextResponse.json({ error: 'Unable to save your profile.' }, { status: 500 })

  return NextResponse.json(
    { profile: result.data ?? null, skipped },
    { headers: { 'cache-control': 'private, no-store' } }
  )
}
