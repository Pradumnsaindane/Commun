import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { deriveExcerpt, deriveTitle, isMissingColumnError, readingMinutesFor, socialPostSchema } from '@/lib/social-posts'
import { readingTime } from '@/lib/posts'

/**
 * Edit or remove a post you own.
 *
 * Ownership is checked against the session; a caller can never act on another
 * author's post. Deletion is a soft removal (`status = REMOVED`) so moderation
 * and reporting history stay intact.
 */

const idSchema = z.string().uuid()

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) return NextResponse.json({ error: 'Post not found.' }, { status: 404 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const { data: existing } = await supabase.from('posts').select('id,author_id,status').eq('id', id).maybeSingle()
  if (!existing) return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  if (existing.author_id !== user.id) return NextResponse.json({ error: 'You cannot edit this post.' }, { status: 403 })

  const parsed = socialPostSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Please check your post.' }, { status: 422 })
  }
  const input = parsed.data
  const body =
    input.type === 'LINK' ? [input.body?.trim(), input.linkUrl].filter(Boolean).join('\n\n') : input.body

  const payload: Record<string, unknown> = {
    title: deriveTitle(input),
    excerpt: deriveExcerpt(input),
    body,
    reading_time_minutes: input.type === 'SNIPPET' ? readingMinutesFor(body) : readingTime(body || 'post'),
    edited_at: new Date().toISOString(),
  }
  const typed = {
    ...payload,
    post_type: input.type,
    language: input.type === 'SNIPPET' ? input.language : null,
    link_url: input.type === 'LINK' ? input.linkUrl : null,
  }

  let result = await supabase.from('posts').update(typed).eq('id', id).select('id,slug').single()
  if (result.error && isMissingColumnError(result.error)) {
    const { edited_at, ...legacy } = payload
    result = await supabase.from('posts').update(legacy).eq('id', id).select('id,slug').single()
  }
  if (result.error) return NextResponse.json({ error: 'Unable to update your post.' }, { status: 500 })

  return NextResponse.json({ post: { id: result.data.id, slug: result.data.slug } })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) return NextResponse.json({ error: 'Post not found.' }, { status: 404 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const { data: existing } = await supabase.from('posts').select('id,author_id').eq('id', id).maybeSingle()
  if (!existing) return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  if (existing.author_id !== user.id) return NextResponse.json({ error: 'You cannot delete this post.' }, { status: 403 })

  const { error } = await supabase.from('posts').update({ status: 'REMOVED' }).eq('id', id)
  if (error) return NextResponse.json({ error: 'Unable to remove your post.' }, { status: 500 })

  return new Response(null, { status: 204 })
}
