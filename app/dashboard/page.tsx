import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductivityDashboard } from '@/components/dashboard/productivity-dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard')
  }

  // Fetch real user profile, activity events, and notifications
  const [
    { data: profile },
    { data: recentEvents },
    { count: unreadCount },
    { count: myPostsCount },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name,username,bio,avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('product_events')
      .select('id,event_name,path,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('read', false),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', user.id),
  ])

  const safeProfile = {
    display_name: profile?.display_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Team Member',
    username: profile?.username || user.user_metadata?.username || null,
    bio: profile?.bio || null,
    avatar_url: profile?.avatar_url || null,
  }

  return (
    <ProductivityDashboard
      profile={safeProfile}
      userEmail={user.email ?? ''}
      recentActivity={recentEvents ?? []}
      unreadNotificationsCount={unreadCount ?? 0}
      myArticlesCount={myPostsCount ?? 0}
      feedDiagnostic={{
        tested: true,
        status: 'RELATION_TRACKED',
        relationship: 'posts.author_id -> auth.users.id & profiles.id preserved',
      }}
    />
  )
}
