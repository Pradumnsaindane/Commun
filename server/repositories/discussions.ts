import type { SupabaseClient } from '@supabase/supabase-js'

export async function listDiscussions(supabase: SupabaseClient) {
  return supabase
    .from('discussions')
    .select('id,title,content,is_pinned,is_closed,created_at,updated_at,author_id,topic_id')
    .eq('is_removed', false)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
}

export async function insertDiscussion(
  supabase: SupabaseClient,
  input: { authorId: string; title: string; content: string; topicId?: string | null }
) {
  return supabase
    .from('discussions')
    .insert({
      author_id: input.authorId,
      title: input.title,
      content: input.content,
      topic_id: input.topicId ?? null,
    })
    .select('id,title,content,created_at')
    .single()
}

export async function findDiscussion(supabase: SupabaseClient, id: string) {
  return supabase
    .from('discussions')
    .select('id,is_closed,is_removed')
    .eq('id', id)
    .maybeSingle()
}

export async function listReplies(supabase: SupabaseClient, discussionId: string) {
  return supabase
    .from('replies')
    .select('id,discussion_id,author_id,parent_id,depth,content,is_solution,created_at,updated_at')
    .eq('discussion_id', discussionId)
    .eq('is_removed', false)
    .order('created_at', { ascending: true })
}

export async function findParentReply(supabase: SupabaseClient, replyId: string) {
  return supabase
    .from('replies')
    .select('discussion_id,depth,is_removed')
    .eq('id', replyId)
    .maybeSingle()
}

export async function insertReply(
  supabase: SupabaseClient,
  input: {
    discussionId: string
    authorId: string
    parentId?: string | null
    depth: number
    content: string
  }
) {
  return supabase
    .from('replies')
    .insert({
      discussion_id: input.discussionId,
      author_id: input.authorId,
      parent_id: input.parentId ?? null,
      depth: input.depth,
      content: input.content,
    })
    .select('id,discussion_id,author_id,parent_id,depth,content,is_solution,created_at')
    .single()
}
