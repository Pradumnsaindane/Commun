import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://commun.dev'
  const supabase = await createClient()
  const [{ data: posts }, { data: profiles }, { data: discussions }] = await Promise.all([
    supabase.from('posts').select('slug,updated_at,published_at').eq('status', 'PUBLISHED').order('published_at', { ascending: false }).limit(5000),
    supabase.from('profiles').select('username,updated_at').eq('status', 'ACTIVE').not('username', 'is', null).limit(5000),
    supabase.from('discussions').select('id,updated_at,created_at').eq('is_removed', false).limit(5000),
  ])
  return [
    { url: baseUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/discover`, changeFrequency: 'daily', priority: 0.8 },
    ...(posts ?? []).map((post) => ({ url: `${baseUrl}/post/${post.slug}`, lastModified: post.updated_at ?? post.published_at ?? undefined, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...(profiles ?? []).map((profile) => ({ url: `${baseUrl}/profile/${profile.username}`, lastModified: profile.updated_at ?? undefined, changeFrequency: 'weekly' as const, priority: 0.5 })),
    ...(discussions ?? []).map((discussion) => ({ url: `${baseUrl}/discussions/${discussion.id}`, lastModified: discussion.updated_at ?? discussion.created_at ?? undefined, changeFrequency: 'daily' as const, priority: 0.5 })),
  ]
}
