import { z } from 'zod'
import { extractMentions } from '@/lib/mentions'
import { createNotification } from '@/lib/notifications'
import { isActiveProfile } from '@/lib/posts'
import { getRequestContext } from '@/server/http/auth'
import { failure, success } from '@/server/http/result'
import { readJson } from '@/server/http/response'
import {
  deleteComment as deleteCommentRepo,
  findCommentAuthor,
  insertComment,
  listCommentsForPost,
  updateComment as updateCommentRepo,
} from '@/server/repositories/comments'
import { findPostNotificationTarget } from '@/server/repositories/posts'

const commentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
  parentId: z.string().uuid().nullable().optional(),
})

export async function listComments(request: Request) {
  const postId = new URL(request.url).searchParams.get('postId')
  if (!postId) return failure('A post is required.', 400)

  const { supabase } = await getRequestContext()
  const { comments, error } = await listCommentsForPost(supabase, postId)
  if (error) return failure('Unable to load comments.', 500)
  return success({ comments })
}

const updateSchema = z.object({
  content: z.string().trim().min(1).max(2000),
})

export async function updateComment(request: Request, commentId: string) {
  const parsed = updateSchema.safeParse(await readJson(request))
  if (!parsed.success) return failure('Write a comment under 2,000 characters.', 400)

  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Sign in to edit comments.', 401)

  const { data: comment, error } = await updateCommentRepo(supabase, commentId, user.id, parsed.data.content)
  if (error) return failure('Unable to update comment.', 400)
  if (!comment) return failure('Comment not found or not owned by you.', 404)
  return success({ comment })
}

export async function deleteComment(request: Request, commentId: string) {
  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Sign in to delete comments.', 401)

  const { data: comment, error } = await deleteCommentRepo(supabase, commentId, user.id)
  if (error) return failure('Unable to delete comment.', 400)
  if (!comment) return failure('Comment not found or not owned by you.', 404)
  return success(undefined, 204)
}

export async function createComment(request: Request) {
  const parsed = commentSchema.safeParse(await readJson(request))
  if (!parsed.success) return failure('Write a comment under 2,000 characters.', 400)

  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Sign in to comment.', 401)

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .maybeSingle()
  if (!isActiveProfile(profile)) return failure('Complete your profile before commenting.', 403)

  const { data, error } = await insertComment(supabase, {
    postId: parsed.data.postId,
    authorId: user.id,
    parentId: parsed.data.parentId,
    content: parsed.data.content,
  })
  if (error) return failure('Unable to add comment.', 400)

  const { data: post } = await findPostNotificationTarget(supabase, parsed.data.postId)
  const recipientId = parsed.data.parentId
    ? (await findCommentAuthor(supabase, parsed.data.parentId)).data?.author_id
    : post?.author_id

  if (recipientId) {
    await createNotification(supabase, {
      recipientId,
      actorId: user.id,
      type: parsed.data.parentId ? 'REPLY' : 'COMMENT',
      entityId: data.id,
      targetSlug: post?.slug,
      targetTitle: post?.title,
    })
  }

  const mentions = extractMentions(parsed.data.content)
  if (mentions.length) {
    const { data: mentioned } = await supabase.from('profiles').select('id').in('username', mentions)
    for (const mention of mentioned ?? []) {
      if (mention.id === user.id) continue
      await createNotification(supabase, {
        recipientId: mention.id,
        actorId: user.id,
        type: 'MENTION',
        entityId: data.id,
        targetSlug: post?.slug,
        targetTitle: post?.title,
      })
    }
  }

  return success({ comment: data }, 201)
}
