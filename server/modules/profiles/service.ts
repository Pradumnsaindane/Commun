import { createAdminClient } from '@/lib/supabase/admin'
import {
  finalizeProfileSchema,
  isMissingColumnError,
  normalizeGithub,
  normalizeUrl,
  profileUpdateSchema,
  toLegacyProfileUpdate,
} from '@/lib/profile'
import { getRequestContext } from '@/server/http/auth'
import { failure, success } from '@/server/http/result'
import { readJson } from '@/server/http/response'
import {
  findProfileById,
  findUsernameOwner,
  updateProfileById,
  updateProfileWithWriter,
} from '@/server/repositories/profiles'

const privateHeaders = { 'cache-control': 'private, no-store' }

export async function getOwnProfile() {
  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Authentication required.', 401)
  const { data, error } = await findProfileById(supabase, user.id)
  if (error) return failure('Unable to load your profile.', 500)
  return success({ profile: data ?? null }, 200, privateHeaders)
}

export async function updateOwnProfile(request: Request) {
  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Authentication required.', 401)

  const body = await readJson(request)
  if (body === null) return failure('Invalid request.', 422)

  const parsed = profileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return failure('Please check the profile fields.', 422, {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
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
    return failure(`Enter a valid link for: ${invalid.join(', ')}.`, 422)
  }

  if (input.username !== undefined) {
    const username = input.username.toLowerCase()
    const { data: taken } = await findUsernameOwner(supabase, username, user.id)
    if (taken) return failure('That username is already taken.', 409)
    payload.username = username
  }

  if (!Object.keys(payload).length) return failure('Nothing to update.', 422)

  let result = await updateProfileById(supabase, user.id, payload)
  let skipped: string[] = []

  if (result.error && isMissingColumnError(result.error)) {
    const { legacy, skipped: removed } = toLegacyProfileUpdate(payload)
    skipped = removed
    if (Object.keys(legacy).length) {
      result = await updateProfileById(supabase, user.id, legacy)
    } else {
      return failure('Those profile fields need the Phase 1B database update.', 409, {
        code: 'SCHEMA_REQUIRED',
        skipped,
      })
    }
  }

  if (result.error?.code === '23505') return failure('That username is already taken.', 409)
  if (result.error) return failure('Unable to save your profile.', 500)

  return success({ profile: result.data ?? null, skipped }, 200, privateHeaders)
}

export async function finalizeProfile(request: Request) {
  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Authentication required.', 401)

  const body = await readJson(request)
  if (body === null) return failure('Invalid request.', 422)

  const parsed = finalizeProfileSchema.safeParse(body)
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? 'Please check your profile details.', 422)
  }

  const input = parsed.data
  const username = input.username.toLowerCase()

  const { data: taken } = await findUsernameOwner(supabase, username, user.id)
  if (taken) return failure('That username is already taken.', 409)

  const website = input.website ? normalizeUrl(input.website) : null
  const github = input.github ? normalizeGithub(input.github) : null
  if (input.website && !website) return failure('Enter a valid website URL.', 422)
  if (input.github && !github) return failure('Enter a valid GitHub profile.', 422)

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
  let result = await updateProfileWithWriter(writer, user.id, payload)
  let skipped: string[] = []

  if (result.error && isMissingColumnError(result.error)) {
    const { headline, ...legacy } = payload
    skipped = headline ? ['headline'] : []
    result = await updateProfileWithWriter(writer, user.id, legacy)
  }

  if (result.error?.code === '23505') return failure('That username is already taken.', 409)
  if (result.error) return failure('Unable to finish setting up your profile.', 500)

  return success({
    ok: true,
    profile: result.data ?? null,
    skipped,
    elevated: Boolean(admin),
  })
}
