import type { SupabaseClient } from '@supabase/supabase-js'
import type { z } from 'zod'
import type { postInputSchema } from '@/lib/posts'
import {
  repositoryListResult,
  repositoryResult,
  type RepositoryListResult,
  type RepositoryResult,
} from './types'

export type PostInput = z.infer<typeof postInputSchema>

export type PostSummaryRow = {
  id: string
  author_id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_path: string | null
  status: string
  access_level: string
  reading_time_minutes: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export type PostDetailRow = PostSummaryRow & { body: string }

export type PostOwnerRow = {
  id: string
  author_id: string
  status?: string
}

export type PostNotificationTarget = {
  author_id: string
  slug: string
  title: string
}

export const POST_SUMMARY_COLUMNS =
  'id,author_id,title,slug,excerpt,cover_image_path,status,access_level,reading_time_minutes,published_at,created_at,updated_at'

export const POST_DETAIL_COLUMNS =
  'id,author_id,title,slug,excerpt,body,cover_image_path,status,access_level,reading_time_minutes,published_at,created_at,updated_at'

export async function listPublishedPosts(
  supabase: SupabaseClient,
  options: { page: number; limit: number; authorId?: string | null }
): Promise<RepositoryListResult<PostSummaryRow>> {
  const from = (options.page - 1) * options.limit
  let query = supabase
    .from('posts')
    .select(POST_SUMMARY_COLUMNS, { count: 'exact' })
    .eq('status', 'PUBLISHED')
    .order('published_at', { ascending: false })
    .range(from, from + options.limit - 1)

  if (options.authorId) query = query.eq('author_id', options.authorId)
  return repositoryListResult<PostSummaryRow>(await query)
}

export async function findPostBySlug(
  supabase: SupabaseClient,
  slug: string,
  columns = POST_DETAIL_COLUMNS
): Promise<RepositoryResult<PostDetailRow>> {
  return repositoryResult<PostDetailRow>(
    await supabase.from('posts').select(columns).eq('slug', slug).maybeSingle()
  )
}

export async function findPostById(
  supabase: SupabaseClient,
  id: string,
  columns = 'id,author_id,status'
): Promise<RepositoryResult<PostOwnerRow>> {
  return repositoryResult<PostOwnerRow>(
    await supabase.from('posts').select(columns).eq('id', id).maybeSingle()
  )
}

export async function findPostSlugOwner(
  supabase: SupabaseClient,
  slug: string
): Promise<RepositoryResult<PostOwnerRow>> {
  return repositoryResult<PostOwnerRow>(
    await supabase.from('posts').select('id,author_id,status').eq('slug', slug).maybeSingle()
  )
}

export async function insertPost(
  supabase: SupabaseClient,
  row: Record<string, unknown>
): Promise<RepositoryResult<{ id: string; slug: string }>> {
  return repositoryResult<{ id: string; slug: string }>(
    await supabase.from('posts').insert(row).select('id,slug').single()
  )
}

export async function updatePostById(
  supabase: SupabaseClient,
  id: string,
  row: Record<string, unknown>
): Promise<RepositoryResult<{ id: string; slug: string }>> {
  return repositoryResult<{ id: string; slug: string }>(
    await supabase.from('posts').update(row).eq('id', id).select('id,slug').single()
  )
}

export async function softRemovePost(supabase: SupabaseClient, id: string) {
  return supabase
    .from('posts')
    .update({ status: 'REMOVED', updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function replacePostTopics(
  supabase: SupabaseClient,
  postId: string,
  topicIds: string[]
) {
  await supabase.from('post_topics').delete().eq('post_id', postId)
  if (topicIds.length) {
    await supabase.from('post_topics').insert(topicIds.map((topic_id) => ({ post_id: postId, topic_id })))
  }
}

export async function insertPostTopics(
  supabase: SupabaseClient,
  postId: string,
  topicIds: string[]
) {
  if (!topicIds.length) return { error: null }
  return supabase.from('post_topics').insert(topicIds.map((topic_id) => ({ post_id: postId, topic_id })))
}

export async function findPostNotificationTarget(
  supabase: SupabaseClient,
  postId: string
): Promise<RepositoryResult<PostNotificationTarget>> {
  return repositoryResult<PostNotificationTarget>(
    await supabase.from('posts').select('author_id,slug,title').eq('id', postId).maybeSingle()
  )
}
