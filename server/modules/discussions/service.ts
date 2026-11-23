import { z } from 'zod'
import { nextReplyDepth } from '@/lib/security-validation'
import { getRequestContext } from '@/server/http/auth'
import { failure, success } from '@/server/http/result'
import { readJson } from '@/server/http/response'
import {
  findDiscussion,
  findParentReply,
  insertDiscussion,
  insertReply,
  listDiscussions,
  listReplies,
} from '@/server/repositories/discussions'

const discussionSchema = z.object({
  title: z.string().trim().min(3).max(180),
  content: z.string().trim().min(1).max(10000),
  topicId: z.string().uuid().optional().nullable(),
})

const replySchema = z.object({
  discussionId: z.string().uuid(),
  content: z.string().trim().min(1).max(5000),
  parentId: z.string().uuid().optional().nullable(),
})

export async function getDiscussions() {
  const { supabase } = await getRequestContext()
  const { data, error } = await listDiscussions(supabase)
  if (error) return failure('Unable to load discussions.', 500)
  return success({ discussions: data ?? [] })
}

export async function createDiscussion(request: Request) {
  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Sign in required.', 401)

  const parsed = discussionSchema.safeParse(await readJson(request))
  if (!parsed.success) return failure('Enter a valid title and discussion.', 400)

  const { data, error } = await insertDiscussion(supabase, {
    authorId: user.id,
    title: parsed.data.title,
    content: parsed.data.content,
    topicId: parsed.data.topicId,
  })
  if (error) return failure('Unable to create discussion.', 400)
  return success({ discussion: data }, 201)
}

export async function getReplies(request: Request) {
  const discussionId = new URL(request.url).searchParams.get('discussionId')
  if (!discussionId) return failure('Discussion is required.', 400)

  const { supabase } = await getRequestContext()
  const { data, error } = await listReplies(supabase, discussionId)
  if (error) return failure('Unable to load replies.', 500)
  return success({ replies: data ?? [] })
}

export async function createReply(request: Request) {
  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Sign in required.', 401)

  const parsed = replySchema.safeParse(await readJson(request))
  if (!parsed.success) return failure('Enter a valid reply.', 400)

  const [{ data: profile }, { data: discussion }] = await Promise.all([
    supabase.from('profiles').select('id,status').eq('id', user.id).maybeSingle(),
    findDiscussion(supabase, parsed.data.discussionId),
  ])
  if (profile?.status !== 'ACTIVE') {
    return failure('Only active, verified members can reply.', 403)
  }
  if (!discussion || discussion.is_removed) return failure('Discussion not found.', 404)
  if (discussion.is_closed) return failure('This discussion is closed.', 409)

  let depth = nextReplyDepth(null)
  if (parsed.data.parentId) {
    const { data: parent } = await findParentReply(supabase, parsed.data.parentId)
    if (!parent || parent.is_removed || parent.discussion_id !== parsed.data.discussionId) {
      return failure('Invalid parent reply.', 422)
    }
    depth = nextReplyDepth(parent.depth)
    if (depth === null) return failure('Reply nesting limit reached.', 422)
  }

  const { data, error } = await insertReply(supabase, {
    discussionId: parsed.data.discussionId,
    authorId: user.id,
    parentId: parsed.data.parentId,
    depth: depth ?? 0,
    content: parsed.data.content,
  })
  if (error) return failure('Unable to add reply.', 400)
  return success({ reply: data }, 201)
}
