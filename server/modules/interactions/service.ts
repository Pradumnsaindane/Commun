import { z } from 'zod'
import { createNotification } from '@/lib/notifications'
import { isActiveProfile } from '@/lib/posts'
import { getRequestContext } from '@/server/http/auth'
import { failure, success } from '@/server/http/result'
import { readJson } from '@/server/http/response'
import {
  addPostLike,
  addPostSave,
  countPostLikes,
  countPostSaves,
  deleteFollow,
  findFollowTarget,
  findPostLike,
  findPostSave,
  insertFollow,
  removePostLike,
  removePostSave,
} from '@/server/repositories/interactions'
import { findPostNotificationTarget } from '@/server/repositories/posts'

const interactionSchema = z.object({
  postId: z.string().uuid(),
  action: z.enum(['like', 'unlike', 'save', 'unsave']),
})

const followSchema = z.object({ followingId: z.string().uuid() })

export async function togglePostInteraction(request: Request) {
  const parsed = interactionSchema.safeParse(await readJson(request))
  if (!parsed.success) return failure('Invalid interaction.', 400)

  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Sign in to interact with articles.', 401)

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .maybeSingle()
  if (!isActiveProfile(profile)) return failure('Complete your profile before interacting.', 403)

  const { postId, action } = parsed.data
  const removing = action === 'unlike' || action === 'unsave'
  const result = action.includes('like')
    ? removing
      ? await removePostLike(supabase, postId, user.id)
      : await addPostLike(supabase, postId, user.id)
    : removing
      ? await removePostSave(supabase, postId, user.id)
      : await addPostSave(supabase, postId, user.id)

  if (result.error && result.error.code !== '23505') {
    return failure('Unable to update this interaction.', 400)
  }

  if (!removing && action === 'like') {
    const { data: post } = await findPostNotificationTarget(supabase, postId)
    if (post) {
      await createNotification(supabase, {
        recipientId: post.author_id,
        actorId: user.id,
        type: 'LIKE',
        entityId: postId,
        targetSlug: post.slug,
        targetTitle: post.title,
      })
    }
  }

  return success({ ok: true, active: !removing })
}

export async function getPostInteraction(request: Request) {
  const postId = new URL(request.url).searchParams.get('postId')
  if (!postId) return failure('A post is required.', 400)

  const { supabase, user } = await getRequestContext()
  const [{ count: likes }, { count: saves }] = await Promise.all([
    countPostLikes(supabase, postId),
    countPostSaves(supabase, postId),
  ])

  let liked = false
  let saved = false
  if (user) {
    const [{ data: like }, { data: save }] = await Promise.all([
      findPostLike(supabase, postId, user.id),
      findPostSave(supabase, postId, user.id),
    ])
    liked = Boolean(like)
    saved = Boolean(save)
  }

  return success({ likes: likes ?? 0, saves: saves ?? 0, liked, saved })
}

export async function followDeveloper(request: Request) {
  const parsed = followSchema.safeParse(await readJson(request))
  if (!parsed.success) return failure('Invalid target user', 422)

  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Authentication required', 401)
  if (parsed.data.followingId === user.id) return failure('You cannot follow yourself', 409)

  const { data: target } = await findFollowTarget(supabase, parsed.data.followingId)
  if (!target) return failure('Developer not found', 404)

  const { error } = await insertFollow(supabase, user.id, parsed.data.followingId)
  if (error?.code === '23505') return failure('Already following', 409)
  if (error) return failure('Could not follow developer', 500)

  await createNotification(supabase, {
    recipientId: parsed.data.followingId,
    actorId: user.id,
    type: 'FOLLOW',
    entityId: user.id,
  })
  return success({ following: true })
}

export async function unfollowDeveloper(request: Request) {
  const parsed = followSchema.safeParse(await readJson(request))
  if (!parsed.success) return failure('Invalid target user', 422)

  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Authentication required', 401)

  const { error } = await deleteFollow(supabase, user.id, parsed.data.followingId)
  if (error) return failure('Could not unfollow developer', 500)
  return success({ following: false })
}
