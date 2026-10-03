'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isActiveProfile, jsonError } from '@/lib/posts'
import { createNotification } from '@/lib/notifications'

const schema = z.object({
  postId: z.string().uuid(),
  action: z.enum(['like', 'unlike', 'save', 'unsave']),
})

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError('Invalid interaction.', 400)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return jsonError('Sign in to interact with articles.', 401)
  const { data: profile } = await supabase.from('profiles').select('status').eq('id', user.id).maybeSingle()
  if (!isActiveProfile(profile)) return jsonError('Complete your profile before interacting.', 403)
  const { postId, action } = parsed.data
  const table = action.includes('like') ? 'post_likes' : 'post_saves'
  const removing = action === 'unlike' || action === 'unsave'
  const result = removing
    ? await supabase.from(table).delete().eq('post_id', postId).eq('user_id', user.id)
    : await supabase.from(table).insert({ post_id: postId, user_id: user.id })
  if (result.error && result.error.code !== '23505') return jsonError('Unable to update this interaction.', 400)
  if (!removing && action === 'like') { const { data: post } = await supabase.from('posts').select('author_id,slug,title').eq('id', postId).maybeSingle(); if (post) await createNotification(supabase, { recipientId: post.author_id, actorId: user.id, type: 'LIKE', entityId: postId, targetSlug: post.slug, targetTitle: post.title }) }
  return Response.json({ ok: true, active: !removing })
}

export async function GET(request: Request) {
  const postId = new URL(request.url).searchParams.get('postId')
  if (!postId) return jsonError('A post is required.', 400)
  const supabase = await createClient()
  const [{ count: likes }, { count: saves }, { data: { user } }] = await Promise.all([
    supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId),
    supabase.from('post_saves').select('*', { count: 'exact', head: true }).eq('post_id', postId),
    supabase.auth.getUser(),
  ])
  let liked = false
  let saved = false
  if (user) {
    const [{ data: like }, { data: save }] = await Promise.all([
      supabase.from('post_likes').select('user_id').eq('post_id', postId).eq('user_id', user.id).maybeSingle(),
      supabase.from('post_saves').select('user_id').eq('post_id', postId).eq('user_id', user.id).maybeSingle(),
    ])
    liked = !!like
    saved = !!save
  }
  return Response.json({ likes: likes ?? 0, saves: saves ?? 0, liked, saved })
}
