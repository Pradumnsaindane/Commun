import type { SupabaseClient } from '@supabase/supabase-js'

export async function countPostLikes(supabase: SupabaseClient, postId: string) {
  return supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId)
}

export async function countPostSaves(supabase: SupabaseClient, postId: string) {
  return supabase.from('post_saves').select('*', { count: 'exact', head: true }).eq('post_id', postId)
}

export async function findPostLike(supabase: SupabaseClient, postId: string, userId: string) {
  return supabase
    .from('post_likes')
    .select('user_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()
}

export async function findPostSave(supabase: SupabaseClient, postId: string, userId: string) {
  return supabase
    .from('post_saves')
    .select('user_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()
}

export async function addPostLike(supabase: SupabaseClient, postId: string, userId: string) {
  return supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
}

export async function removePostLike(supabase: SupabaseClient, postId: string, userId: string) {
  return supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
}

export async function addPostSave(supabase: SupabaseClient, postId: string, userId: string) {
  return supabase.from('post_saves').insert({ post_id: postId, user_id: userId })
}

export async function removePostSave(supabase: SupabaseClient, postId: string, userId: string) {
  return supabase.from('post_saves').delete().eq('post_id', postId).eq('user_id', userId)
}

export async function findFollowTarget(supabase: SupabaseClient, userId: string) {
  return supabase.from('profiles').select('id').eq('id', userId).maybeSingle()
}

export async function insertFollow(supabase: SupabaseClient, followerId: string, followingId: string) {
  return supabase.from('follows').insert({ follower_id: followerId, following_id: followingId })
}

export async function deleteFollow(supabase: SupabaseClient, followerId: string, followingId: string) {
  return supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
}
