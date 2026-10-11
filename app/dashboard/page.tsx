import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Dashboard, DashboardError } from '@/components/dashboard/dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard')

  const [{ data: profile, error: profileError }, { data: myPosts }, { data: feedPosts }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('display_name,username,bio,avatar_url')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('posts')
        .select('id,title,slug,excerpt,status,reading_time_minutes,published_at,created_at,author_id')
        .eq('author_id', user.id)
        .neq('status', 'REMOVED')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('posts')
        .select(
          'id,title,slug,excerpt,reading_time_minutes,published_at,author_id,profiles!inner(display_name,username)'
        )
        .eq('status', 'PUBLISHED')
        .order('published_at', { ascending: false })
        .limit(10),
    ])

  if (profileError || !profile) return <DashboardError />

  return (
    <Dashboard
      profile={profile}
      myPosts={myPosts ?? []}
      feedPosts={feedPosts ?? []}
    />
  )
}
