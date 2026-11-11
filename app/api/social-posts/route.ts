import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isActiveProfile, readingTime, uniqueSlug } from '@/lib/posts'
import { deriveExcerpt, deriveTitle, isMissingColumnError, readingMinutesFor, socialPostSchema } from '@/lib/social-posts'
import { enforceRateLimit, requestKey } from '@/lib/rate-limit'

/**
 * Create a social post (text, code snippet, or link).
 *
 * If the Phase 1B columns are not present yet, the post is still persisted in
 * the existing article shape — a link post keeps its URL in the body and a
 * snippet keeps its fenced code block, which the article renderer highlights —
 * and the response reports `degraded: true` so the UI never claims more than
 * the database actually stored.
 */

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to publish.' }, { status: 401 })

  const rate = await enforceRateLimit(requestKey(request, user.id), 'social-posts', 12, '10 m')
  if (!rate.success) return NextResponse.json({ error: 'You are publishing too quickly. Try again shortly.' }, { status: 429 })

  const parsed = socialPostSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Please check your post.' }, { status: 422 })
  }

  const { data: profile } = await supabase.from('profiles').select('status').eq('id', user.id).maybeSingle()
  if (!isActiveProfile(profile)) {
    return NextResponse.json({ error: 'Complete your profile before publishing.' }, { status: 403 })
  }

  const input = parsed.data
  const title = deriveTitle(input)
  const body =
    input.type === 'LINK'
      ? [input.body?.trim(), input.linkUrl].filter(Boolean).join('\n\n')
      : input.body
  const excerpt = deriveExcerpt(input)
  const slug = await uniqueSlug(supabase, title)
  const now = new Date().toISOString()

  const base: Record<string, unknown> = {
    author_id: user.id,
    title,
    slug,
    excerpt,
    body,
    status: 'PUBLISHED',
    access_level: 'FREE',
    reading_time_minutes: input.type === 'SNIPPET' ? readingMinutesFor(body) : readingTime(body || title),
    published_at: now,
  }

  const typed: Record<string, unknown> = {
    ...base,
    post_type: input.type,
    language: input.type === 'SNIPPET' ? input.language : null,
    link_url: input.type === 'LINK' ? input.linkUrl : null,
  }

  let result = await supabase.from('posts').insert(typed).select('id,slug').single()
  let degraded = false

  if (result.error && isMissingColumnError(result.error)) {
    degraded = true
    result = await supabase.from('posts').insert(base).select('id,slug').single()
  }

  if (result.error) return NextResponse.json({ error: 'Unable to publish your post.' }, { status: 500 })

  return NextResponse.json(
    { post: { id: result.data.id, slug: result.data.slug }, degraded },
    { status: 201 }
  )
}
