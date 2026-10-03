import { createClient } from '@/lib/supabase/server'
import { isActiveProfile, jsonError, postInputSchema, readingTime, uniqueSlug } from '@/lib/posts'

export async function GET(request: Request) {
  const url = new URL(request.url); const page = Math.max(1, Number(url.searchParams.get('page')) || 1); const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit')) || 10)); const supabase = await createClient()
  let query = supabase.from('posts').select('id,author_id,title,slug,excerpt,cover_image_path,status,reading_time_minutes,published_at,created_at,updated_at', { count: 'exact' }).eq('status', 'PUBLISHED').order('published_at', { ascending: false }).range((page - 1) * limit, page * limit - 1)
  const author = url.searchParams.get('author'); if (author) query = query.eq('author_id', author)
  const { data, count, error } = await query; if (error) return jsonError('Unable to load articles.', 500); return Response.json({ posts: data ?? [], page, limit, total: count ?? 0 })
}

export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return jsonError('Authentication required.', 401)
  const { data: profile } = await supabase.from('profiles').select('status').eq('id', user.id).maybeSingle(); let payload: unknown; try { payload = await request.json() } catch { return jsonError('Invalid JSON.', 422) }
  const parsed = postInputSchema.safeParse(payload); if (!parsed.success) return jsonError('Please check the article fields.', 422)
  const status = parsed.data.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'; if (status === 'PUBLISHED' && !isActiveProfile(profile)) return jsonError('Your profile must be verified and active before publishing.', 403)
  const slug = await uniqueSlug(supabase, parsed.data.title); const now = new Date().toISOString(); const { data: post, error } = await supabase.from('posts').insert({ author_id: user.id, title: parsed.data.title, slug, excerpt: parsed.data.excerpt, body: parsed.data.body, cover_image_path: parsed.data.coverImagePath, status, reading_time_minutes: readingTime(parsed.data.body), published_at: status === 'PUBLISHED' ? now : null, updated_at: now }).select('id,slug').single(); if (error) return jsonError('Unable to save article.', 500)
  if (parsed.data.topicIds.length) await supabase.from('post_topics').insert(parsed.data.topicIds.map((topic_id) => ({ post_id: post.id, topic_id })))
  return Response.json({ post }, { status: 201 })
}
