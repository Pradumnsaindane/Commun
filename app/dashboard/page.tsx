import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Dashboard, DashboardError } from '@/components/dashboard/dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard')
  const [{ data: profile }, { data: posts }] = await Promise.all([
    supabase.from('profiles').select('display_name,username,bio,avatar_url').eq('id', user.id).maybeSingle(),
    supabase.from('posts').select('id,body,created_at,author_id').eq('author_id', user.id).order('created_at', { ascending: false }).limit(10),
  ])
  if (!profile) return <DashboardError />
  return <Dashboard profile={profile} posts={posts ?? []} />
}
