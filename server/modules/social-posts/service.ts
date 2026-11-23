import { z } from 'zod'
import { isActiveProfile, readingTime } from '@/lib/posts'
import { enforceRateLimit, requestKey } from '@/lib/rate-limit'
import {
  deriveExcerpt,
  deriveTitle,
  isMissingColumnError,
  readingMinutesFor,
  socialPostSchema,
} from '@/lib/social-posts'
import { getRequestContext } from '@/server/http/auth'
import { failure, success } from '@/server/http/result'
import { readJson } from '@/server/http/response'
import {
  findPostById,
  insertPost,
  softRemovePost,
  updatePostById,
} from '@/server/repositories/posts'
import { uniqueSlug } from '@/lib/posts'

const idSchema = z.string().uuid()

/**
 * Create a social post (text, code snippet, or link).
 *
 * If the Phase 1B columns are not present yet, the post is still persisted in
 * the existing article shape and the response reports `degraded: true` so the
 * UI never claims more than the database actually stored.
 */
export async function createSocialPost(request: Request) {
  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Sign in to publish.', 401)

  const rate = await enforceRateLimit(requestKey(request, user.id), 'social-posts', 12, '10 m')
  if (!rate.success) {
    return failure('You are publishing too quickly. Try again shortly.', 429)
  }

  const parsed = socialPostSchema.safeParse(await readJson(request))
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? 'Please check your post.', 422)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .maybeSingle()
  if (!isActiveProfile(profile)) {
    return failure('Complete your profile before publishing.', 403)
  }

  const input = parsed.data
  const title = deriveTitle(input)
  const body =
    input.type === 'LINK'
      ? [input.body?.trim(), input.linkUrl].filter(Boolean).join('\n\n')
      : input.body
  const excerpt = deriveExcerpt(input)
  const slug = await uniqueSlug(supabase, title)
  const now = new Date().toISOString()

  const base: Record<string, unknown> = {
    author_id: user.id,
    title,
    slug,
    excerpt,
    body,
    status: 'PUBLISHED',
    access_level: 'FREE',
    reading_time_minutes:
      input.type === 'SNIPPET' ? readingMinutesFor(body) : readingTime(body || title),
    published_at: now,
  }

  const typed: Record<string, unknown> = {
    ...base,
    post_type: input.type,
    language: input.type === 'SNIPPET' ? input.language : null,
    link_url: input.type === 'LINK' ? input.linkUrl : null,
  }

  let result = await insertPost(supabase, typed)
  let degraded = false

  if (result.error && isMissingColumnError(result.error)) {
    degraded = true
    result = await insertPost(supabase, base)
  }

  if (result.error || !result.data) return failure('Unable to publish your post.', 500)

  return success({ post: { id: result.data.id, slug: result.data.slug }, degraded }, 201)
}

export async function updateSocialPost(id: string, request: Request) {
  if (!idSchema.safeParse(id).success) return failure('Post not found.', 404)

  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Authentication required.', 401)

  const { data: existing } = await findPostById(supabase, id)
  if (!existing) return failure('Post not found.', 404)
  if (existing.author_id !== user.id) return failure('You cannot edit this post.', 403)

  const parsed = socialPostSchema.safeParse(await readJson(request))
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? 'Please check your post.', 422)
  }

  const input = parsed.data
  const body =
    input.type === 'LINK'
      ? [input.body?.trim(), input.linkUrl].filter(Boolean).join('\n\n')
      : input.body

  const payload: Record<string, unknown> = {
    title: deriveTitle(input),
    excerpt: deriveExcerpt(input),
    body,
    reading_time_minutes:
      input.type === 'SNIPPET' ? readingMinutesFor(body) : readingTime(body || 'post'),
    edited_at: new Date().toISOString(),
  }
  const typed = {
    ...payload,
    post_type: input.type,
    language: input.type === 'SNIPPET' ? input.language : null,
    link_url: input.type === 'LINK' ? input.linkUrl : null,
  }

  let result = await updatePostById(supabase, id, typed)
  if (result.error && isMissingColumnError(result.error)) {
    const { edited_at, ...legacy } = payload
    void edited_at
    result = await updatePostById(supabase, id, legacy)
  }
  if (result.error || !result.data) return failure('Unable to update your post.', 500)

  return success({ post: { id: result.data.id, slug: result.data.slug } })
}

export async function deleteSocialPost(id: string) {
  if (!idSchema.safeParse(id).success) return failure('Post not found.', 404)

  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Authentication required.', 401)

  const { data: existing } = await findPostById(supabase, id, 'id,author_id')
  if (!existing) return failure('Post not found.', 404)
  if (existing.author_id !== user.id) return failure('You cannot delete this post.', 403)

  const { error } = await softRemovePost(supabase, id)
  if (error) return failure('Unable to remove your post.', 500)
  return success(null, 204)
}
