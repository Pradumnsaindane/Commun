import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const commentSchema = z.object({ content: z.string().trim().min(1, 'Write a comment.').max(2000), parentId: z.string().uuid().nullable().optional() })

export async function currentActiveUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null }
  const { data: profile } = await supabase.from('profiles').select('id,status,display_name,username,avatar_url').eq('id', user.id).maybeSingle()
  return { supabase, user, profile }
}

export function mutationStatus(profile: { status?: string } | null) {
  return profile?.status === 'ACTIVE' ? null : 'Only active, verified members can do that.'
}

export function interactionError(message: string, status: number) { return Response.json({ error: message }, { status }) }

export async function toggleInteraction(request: Request, table: 'post_likes' | 'post_saves') {
  const { supabase, user, profile } = await currentActiveUser()
  if (!user) return interactionError('Authentication required.', 401)
  const blocked = mutationStatus(profile)
  if (blocked) return interactionError(blocked, 403)
  let payload: unknown = {}
  try { payload = await request.json() } catch { return interactionError('Invalid JSON.', 422) }
  const parsed = z.object({ postId: z.string().uuid(), active: z.boolean() }).safeParse(payload)
  if (!parsed.success) return interactionError('Invalid interaction.', 422)
  const { data: post } = await supabase.from('posts').select('id').eq('id', parsed.data.postId).eq('status', 'PUBLISHED').maybeSingle()
  if (!post) return interactionError('Article not found.', 404)
  if (parsed.data.active) {
    const { error } = await supabase.from(table).insert({ user_id: user.id, post_id: post.id })
    if (error && error.code !== '23505') return interactionError('Unable to save interaction.', 500)
  } else {
    const { error } = await supabase.from(table).delete().eq('user_id', user.id).eq('post_id', post.id)
    if (error) return interactionError('Unable to remove interaction.', 500)
  }
  return Response.json({ active: parsed.data.active })
}

export async function getInteractionState(supabase: any, userId: string | null, postId: string) {
  if (!userId) return { liked: false, saved: false }
  const [{ data: like }, { data: save }] = await Promise.all([
    supabase.from('post_likes').select('post_id').eq('user_id', userId).eq('post_id', postId).maybeSingle(),
    supabase.from('post_saves').select('post_id').eq('user_id', userId).eq('post_id', postId).maybeSingle(),
  ])
  return { liked: Boolean(like), saved: Boolean(save) }
}

export type CommentRecord = { id: string; post_id: string; author_id: string; parent_id: string | null; content: string; pinned: boolean; is_removed: boolean; created_at: string; updated_at: string; author?: { display_name: string; username: string | null; avatar_url: string | null } }

export async function loadComments(supabase: any, postId: string) {
  const { data } = await supabase.from('comments').select('id,post_id,author_id,parent_id,content,pinned,is_removed,created_at,updated_at,profiles:author_id(display_name,username,avatar_url)').eq('post_id', postId).order('pinned', { ascending: false }).order('created_at', { ascending: false }).range(0, 49)
  return (data ?? []).map((comment: any) => ({ ...comment, author: comment.profiles, profiles: undefined })) as CommentRecord[]
}

export function plainText(value: string) { return value.replace(/[<>]/g, '').trim() }

export const interactionPayload = z.object({ postId: z.string().uuid(), active: z.boolean() })

export function commentsByParent(comments: CommentRecord[]) { return comments.filter((comment) => comment.parent_id === null) }

export function repliesFor(comments: CommentRecord[], parentId: string) { return comments.filter((comment) => comment.parent_id === parentId) }

export function isCommentAuthor(comment: CommentRecord, userId: string | null) { return Boolean(userId && comment.author_id === userId) }

export function isPostAuthor(authorId: string, userId: string | null) { return Boolean(userId && authorId === userId) }

export function safeCommentText(value: string) { return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') }

export const commentMutationSchema = commentSchema.extend({ id: z.string().uuid().optional() })

export const interactionTables = { like: 'post_likes', save: 'post_saves' } as const

export type InteractionKind = keyof typeof interactionTables

export const interactionLabel = { like: 'Like', save: 'Save' } as const

export function interactionTable(kind: InteractionKind) { return interactionTables[kind] }

export const paginationSchema = z.object({ page: z.coerce.number().int().min(1).default(1) })

export const PAGE_SIZE = 12

export function pageRange(page: number) { return { from: (page - 1) * PAGE_SIZE, to: page * PAGE_SIZE - 1 } }

export function isUuid(value: string) { return z.string().uuid().safeParse(value).success }

export const emptyInteractionCounts = { likes: 0, comments: 0 }

export function countRows(rows: unknown[] | null | undefined) { return rows?.length ?? 0 }

export const interactionEventNames = ['like.created', 'save.created', 'comment.created', 'reply.created'] as const

export type InteractionEventName = typeof interactionEventNames[number]

export function interactionEvent(name: InteractionEventName, postId: string) { return { name, postId, occurredAt: new Date().toISOString() } }

export function normalizePage(page: number) { return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1 }

export function profileStatus(profile: { status?: string } | null) { return profile?.status ?? 'PENDING_VERIFICATION' }

export function isMutationAllowed(profile: { status?: string } | null) { return profileStatus(profile) === 'ACTIVE' }

export function commentDepth(parent: CommentRecord | null, comments: CommentRecord[]) { return !parent ? 1 : parent.parent_id ? 3 : 2 }

export function canReply(parent: CommentRecord) { return parent.parent_id === null }

export function canPin(comment: CommentRecord) { return comment.parent_id === null }

export function withoutRemoved(comments: CommentRecord[]) { return comments.filter((comment) => !comment.is_removed) }

export function commentCount(comments: CommentRecord[]) { return comments.length }

export function replyCount(comments: CommentRecord[], parentId: string) { return repliesFor(comments, parentId).length }

export function interactionUrl(postId: string, kind: InteractionKind) { return `/api/interactions/${kind}` }

export function redirectToLogin(path: string) { return `/login?next=${encodeURIComponent(path)}` }

export function commentApiUrl(postId: string) { return `/api/posts/${postId}/comments` }

export const commentLimit = 2000

export function trimComment(value: string) { return value.trim().slice(0, commentLimit) }

export const postIdSchema = z.object({ postId: z.string().uuid() })

export function isConflict(error: { code?: string } | null) { return error?.code === '23505' }

export function isNotFound(error: { code?: string } | null) { return error?.code === 'PGRST116' }

export function noRawHtml(value: string) { return value.replace(/<[^>]*>/g, '') }

export function commentPreview(value: string) { return noRawHtml(value).slice(0, 160) }

export function commentAuthorName(author?: CommentRecord['author']) { return author?.display_name ?? 'Commun member' }

export function commentInitial(author?: CommentRecord['author']) { return commentAuthorName(author).slice(0, 1).toUpperCase() }

export function formatCommentDate(value: string) { return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value)) }

export function safePath(path: string) { return path.startsWith('/') && !path.startsWith('//') ? path : '/dashboard' }

export function likeCount(rows: unknown[] | null | undefined) { return rows?.length ?? 0 }

export function saveCount(rows: unknown[] | null | undefined) { return rows?.length ?? 0 }

export function commentText(value: string) { return safeCommentText(plainText(value)) }

export function parentIsTopLevel(parent: CommentRecord | null) { return parent?.parent_id === null }

export function maxCommentPage(page: number) { return Math.min(normalizePage(page), 100) }

export function interactionMethod(active: boolean) { return active ? 'POST' : 'DELETE' }

export function requestBody(postId: string, active: boolean) { return JSON.stringify({ postId, active }) }

export function pendingMessage(kind: InteractionKind, active: boolean) { return `${active ? 'Added' : 'Removed'} ${kind}.` }

export function interactionCountLabel(kind: InteractionKind, count: number) { return `${count} ${kind}${count === 1 ? '' : 's'}` }

export function commentRole(comment: CommentRecord) { return comment.parent_id ? 'reply' : 'comment' }

export function eventForComment(comment: CommentRecord) { return interactionEvent(comment.parent_id ? 'reply.created' : 'comment.created', comment.post_id) }

export function samePost(a: CommentRecord, b: CommentRecord) { return a.post_id === b.post_id }

export function commentIdentity(comment: CommentRecord) { return `${comment.post_id}:${comment.id}` }

export function safeCommentPayload(value: unknown) { const parsed = commentSchema.safeParse(value); return parsed.success ? { content: commentText(parsed.data.content), parentId: parsed.data.parentId ?? null } : null }

export function paginationLabel(page: number) { return `Page ${normalizePage(page)}` }

export function canEditComment(comment: CommentRecord, userId: string | null) { return isCommentAuthor(comment, userId) }

export function canDeleteComment(comment: CommentRecord, userId: string | null) { return isCommentAuthor(comment, userId) }

export function canModerate(profile: { role?: string } | null) { return profile?.role === 'MODERATOR' || profile?.role === 'ADMIN' }

export function canPinComment(comment: CommentRecord, postAuthorId: string, userId: string | null, profile: { role?: string } | null) { return canPin(comment) && (postAuthorId === userId || canModerate(profile)) }

export function commentFormLabel(parentId?: string | null) { return parentId ? 'Write a reply' : 'Join the discussion' }

export function commentEmptyMessage() { return 'Be the first to start the discussion.' }

export function savedEmptyMessage() { return 'Your saved posts will appear here.' }

export function guestInteractionMessage() { return 'Sign in to interact with articles.' }

export function verifiedInteractionMessage() { return 'Verify your email to interact with articles.' }

export function suspendedInteractionMessage() { return 'Your account cannot interact right now.' }

export function isGuest(userId: string | null) { return !userId }

export function apiUnauthorized() { return interactionError('Authentication required.', 401) }

export function apiForbidden() { return interactionError('Active verification required.', 403) }

export function apiInvalid() { return interactionError('Invalid request.', 422) }

export function apiServerError() { return interactionError('Unexpected server error.', 500) }

export function apiNotFound() { return interactionError('Article not found.', 404) }

export function apiConflict() { return interactionError('Already exists.', 409) }

export function apiOk(data: unknown) { return Response.json(data) }

export function makeComment(content: string, parentId: string | null) { return { content: commentText(content), parentId } }

export function shouldShowComment(comment: CommentRecord) { return !comment.is_removed }

export function removedCommentLabel() { return 'This comment has been removed.' }

export function interactionRequest(postId: string, active: boolean) { return { postId, active } }

export function serializeComment(comment: CommentRecord) { return { ...comment, content: comment.is_removed ? removedCommentLabel() : comment.content } }

export function commentsQuery(postId: string) { return { post_id: postId, limit: 50 } }

export function engagementQuery(postId: string) { return { post_id: postId } }

export function currentPath(url: string) { return new URL(url).pathname }

export function userCanInteract(profile: { status?: string } | null) { return profile?.status === 'ACTIVE' }

export function userCanRead(profile: { status?: string } | null) { return profile?.status !== 'SUSPENDED' }

export function interactionFailure(error: unknown) { return error instanceof Error ? error.message : 'Unable to complete interaction.' }

export function commentFailure(error: unknown) { return error instanceof Error ? error.message : 'Unable to post comment.' }

export function isSuccessful(response: Response) { return response.ok }

export function parseInteractionResponse(value: unknown) { return z.object({ active: z.boolean() }).safeParse(value) }

export function nowIso() { return new Date().toISOString() }

export function isPublished(status: string) { return status === 'PUBLISHED' }

export function isDraft(status: string) { return status === 'DRAFT' }

export function isRemoved(status: string) { return status === 'REMOVED' }

export function isArchived(status: string) { return status === 'ARCHIVED' }

export function isValidCommentParent(parent: CommentRecord | null) { return !parent || parent.parent_id === null }

export function commentSort(a: CommentRecord, b: CommentRecord) { return Number(b.pinned) - Number(a.pinned) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime() }

export function sortComments(comments: CommentRecord[]) { return [...comments].sort(commentSort) }

export function interactionCacheKey(postId: string) { return `post:${postId}:interactions` }

export function commentCacheKey(postId: string) { return `post:${postId}:comments` }

export function profileDisplayName(profile: { display_name?: string } | null) { return profile?.display_name ?? 'Commun member' }

export function profileUsername(profile: { username?: string | null } | null) { return profile?.username ?? 'member' }

export function avatarFallback(profile: { display_name?: string } | null) { return profileDisplayName(profile).slice(0, 1).toUpperCase() }

export function interactionButtonLabel(kind: InteractionKind, active: boolean) { return `${active ? 'Remove' : 'Add'} ${kind}` }

export function commentButtonLabel() { return 'Post comment' }

export function replyButtonLabel() { return 'Reply' }

export function editButtonLabel() { return 'Edit comment' }

export function deleteButtonLabel() { return 'Delete comment' }

export function pinButtonLabel() { return 'Pin comment' }
