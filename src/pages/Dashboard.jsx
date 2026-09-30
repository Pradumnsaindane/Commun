import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import PostFeed from '../components/PostFeed'
import Profile from '../components/Profile'

export default function Dashboard({ session }) {
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState('feed')
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (session?.user) {
      setUser(session.user)
      loadProfile(session.user.id)
    }
  }, [session])

  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setProfile(data)
    } catch (err) {
      console.error('[v0] Error loading profile:', err)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="dashboard">
      <Header user={user} profile={profile} onViewChange={setCurrentView} onLogout={handleLogout} />

      <main className="dashboard-main">
        {currentView === 'feed' && <PostFeed userId={user?.id} profile={profile} />}
        {currentView === 'profile' && <Profile userId={user?.id} profile={profile} onProfileUpdate={setProfile} />}
      </main>
    </div>
  )
}
