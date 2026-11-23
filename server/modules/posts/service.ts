import { canViewPost, gatedPostPayload } from '@/lib/monetization'
import { isActiveProfile } from '@/lib/posts'
import { postInputSchema, readingTime, uniqueSlug } from '@/lib/posts'
import { getRequestContext } from '@/server/http/auth'
import { failure, success } from '@/server/http/result'
import { readJson } from '@/server/http/response'
import {
  findPostById,
  findPostBySlug,
  findPostSlugOwner,
  insertPost,
  insertPostTopics,
  listPublishedPosts,
  replacePostTopics,
  softRemovePost,
  updatePostById,
} from '@/server/repositories/posts'

export async function listPosts(request: Request) {
  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit')) || 10))
  const author = url.searchParams.get('author')

  const { supabase } = await getRequestContext()
  const { data, count, error } = await listPublishedPosts(supabase, {
    page,
    limit,
    authorId: author,
  })
  if (error) return failure('Unable to load articles.', 500)

  return success({ posts: data ?? [], page, limit, total: count ?? 0 })
}

export async function createPost(request: Request) {
  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Authentication required.', 401)

  const payload = await readJson(request)
  if (payload === null) return failure('Invalid JSON.', 422)

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .maybeSingle()

  const parsed = postInputSchema.safeParse(payload)
  if (!parsed.success) return failure('Please check the article fields.', 422)

  const status = parsed.data.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
  if (status === 'PUBLISHED' && !isActiveProfile(profile)) {
    return failure('Your profile must be verified and active before publishing.', 403)
  }

  const slug = await uniqueSlug(supabase, parsed.data.title)
  const now = new Date().toISOString()
  const { data: post, error } = await insertPost(supabase, {
    author_id: user.id,
    title: parsed.data.title,
    slug,
    excerpt: parsed.data.excerpt,
    body: parsed.data.body,
    cover_image_path: parsed.data.coverImagePath,
    status,
    access_level: parsed.data.accessLevel,
    reading_time_minutes: readingTime(parsed.data.body),
    published_at: status === 'PUBLISHED' ? now : null,
    updated_at: now,
  })
  if (error || !post) return failure('Unable to save article.', 500)

  await insertPostTopics(supabase, post.id, parsed.data.topicIds)
  return success({ post }, 201)
}

export async function getPost(slug: string) {
  const { supabase, user } = await getRequestContext()
  const { data: post, error } = await findPostBySlug(supabase, slug)
  if (error || !post || post.status !== 'PUBLISHED') return failure('Article not found.', 404)

  const allowed = await canViewPost(supabase, post, user?.id ?? null)
  return success(gatedPostPayload(post, allowed))
}

export async function updatePost(slug: string, request: Request) {
  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Authentication required.', 401)

  const { data: existing } = await findPostSlugOwner(supabase, slug)
  if (!existing) return failure('Article not found.', 404)
  if (existing.author_id !== user.id) return failure('You cannot edit this article.', 403)

  const payload = await readJson(request)
  if (payload === null) return failure('Invalid JSON.', 422)
  const parsed = postInputSchema.safeParse(payload)
  if (!parsed.success) return failure('Please check the article fields.', 422)

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .maybeSingle()
  const status = parsed.data.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
  if (status === 'PUBLISHED' && !isActiveProfile(profile)) {
    return failure('Your profile must be verified and active before publishing.', 403)
  }

  const now = new Date().toISOString()
  const updated: Record<string, unknown> = {
    title: parsed.data.title,
    excerpt: parsed.data.excerpt,
    body: parsed.data.body,
    cover_image_path: parsed.data.coverImagePath,
    status,
    access_level: parsed.data.accessLevel,
    reading_time_minutes: readingTime(parsed.data.body),
    published_at: status === 'PUBLISHED' ? now : null,
    updated_at: now,
  }
  if (status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
    updated.slug = await uniqueSlug(supabase, parsed.data.title, existing.id)
  }

  const { data: post, error } = await updatePostById(supabase, existing.id, updated)
  if (error) return failure('Unable to update article.', 500)

  await replacePostTopics(supabase, existing.id, parsed.data.topicIds)
  return success({ post })
}

export async function deletePost(slug: string) {
  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Authentication required.', 401)

  const { data: existing } = await findPostSlugOwner(supabase, slug)
  if (!existing) return failure('Article not found.', 404)
  if (existing.author_id !== user.id) return failure('You cannot delete this article.', 403)

  const { error } = await softRemovePost(supabase, existing.id)
  if (error) return failure('Unable to remove article.', 500)

  return success(null, 204)
}

export async function getPostByIdForOwner(id: string) {
  const { supabase, user } = await getRequestContext()
  if (!user) return failure('Authentication required.', 401)
  const { data: post, error } = await findPostById(supabase, id)
  if (error || !post) return failure('Post not found.', 404)
  if (post.author_id !== user.id) return failure('You cannot act on this post.', 403)
  return success({ post, supabase, user })
}
