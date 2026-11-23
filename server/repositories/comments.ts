import type { SupabaseClient } from '@supabase/supabase-js'

type CommentRow = {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  pinned: boolean
  created_at: string
  profiles:
    | { display_name: string | null; username: string | null; avatar_url: string | null }
    | { display_name: string | null; username: string | null; avatar_url: string | null }[]
    | null
}

export async function listCommentsForPost(supabase: SupabaseClient, postId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(
      'id,post_id,author_id,parent_id,content,pinned,created_at,profiles:author_id(display_name,username,avatar_url)'
    )
    .eq('post_id', postId)
    .eq('is_removed', false)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) return { comments: [], error }

  const comments = ((data ?? []) as CommentRow[]).map((comment) => {
    const profile = Array.isArray(comment.profiles)
      ? comment.profiles[0] ?? null
      : comment.profiles ?? null
    return { ...comment, author: profile, profiles: undefined }
  })

  return { comments, error: null }
}

export async function insertComment(
  supabase: SupabaseClient,
  input: { postId: string; authorId: string; parentId?: string | null; content: string }
) {
  return supabase
    .from('comments')
    .insert({
      post_id: input.postId,
      author_id: input.authorId,
      parent_id: input.parentId ?? null,
      content: input.content,
    })
    .select('id,post_id,author_id,parent_id,content,pinned,created_at')
    .single()
}

export async function findCommentAuthor(supabase: SupabaseClient, commentId: string) {
  return supabase.from('comments').select('author_id').eq('id', commentId).maybeSingle()
}
