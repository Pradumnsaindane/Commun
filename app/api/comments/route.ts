import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isActiveProfile, jsonError } from '@/lib/posts'
import { createNotification } from '@/lib/notifications'
import { extractMentions } from '@/lib/mentions'

const schema = z.object({ postId: z.string().uuid(), content: z.string().trim().min(1).max(2000), parentId: z.string().uuid().nullable().optional() })

export async function GET(request: Request) {
  const postId = new URL(request.url).searchParams.get('postId')
  if (!postId) return jsonError('A post is required.', 400)
  const supabase = await createClient()
  const { data, error } = await supabase.from('comments').select('id,post_id,author_id,parent_id,content,pinned,created_at,profiles:author_id(display_name,username,avatar_url)').eq('post_id', postId).eq('is_removed', false).order('pinned', { ascending: false }).order('created_at', { ascending: true })
  if (error) return jsonError('Unable to load comments.', 500)
  const comments = (data ?? []).map((comment) => {
    const profile = Array.isArray(comment.profiles) ? comment.profiles[0] ?? null : comment.profiles ?? null
    return { ...comment, author: profile, profiles: undefined }
  })
  return Response.json({ comments })
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError('Write a comment under 2,000 characters.', 400)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return jsonError('Sign in to comment.', 401)
  const { data: profile } = await supabase.from('profiles').select('status').eq('id', user.id).maybeSingle()
  if (!isActiveProfile(profile)) return jsonError('Complete your profile before commenting.', 403)
  const { data, error } = await supabase.from('comments').insert({ post_id: parsed.data.postId, author_id: user.id, parent_id: parsed.data.parentId ?? null, content: parsed.data.content }).select('id,post_id,author_id,parent_id,content,pinned,created_at').single()
  if (error) return jsonError('Unable to add comment.', 400)
  const { data: post } = await supabase.from('posts').select('author_id,slug,title').eq('id', parsed.data.postId).maybeSingle()
  const recipientId = parsed.data.parentId ? (await supabase.from('comments').select('author_id').eq('id', parsed.data.parentId).maybeSingle()).data?.author_id : post?.author_id
  if (recipientId) await createNotification(supabase, { recipientId, actorId: user.id, type: parsed.data.parentId ? 'REPLY' : 'COMMENT', entityId: data.id, targetSlug: post?.slug, targetTitle: post?.title })
  // Mention notifications resolve against real profiles; unknown handles are ignored.
  const mentions = extractMentions(parsed.data.content)
  if (mentions.length) {
    const { data: mentioned } = await supabase.from('profiles').select('id').in('username', mentions)
    for (const mention of mentioned ?? []) {
      if (mention.id === user.id) continue
      await createNotification(supabase, { recipientId: mention.id, actorId: user.id, type: 'MENTION', entityId: data.id, targetSlug: post?.slug, targetTitle: post?.title })
    }
  }
  return Response.json({ comment: data }, { status: 201 })
}
