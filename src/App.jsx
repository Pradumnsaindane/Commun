import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import './App.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    const openAuth = () => setShowAuth(true)
    window.addEventListener('commun:open-auth', openAuth)

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription?.unsubscribe()
      window.removeEventListener('commun:open-auth', openAuth)
    }
  }, [])

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading Commun...</p>
      </div>
    )
  }

  return (
    <>
      <Dashboard session={session} onRequireAuth={() => setShowAuth(true)} />
      {showAuth && !session && (
        <div className="auth-modal" role="dialog" aria-modal="true" aria-label="Sign in to Commun">
          <button className="auth-modal-close" onClick={() => setShowAuth(false)} aria-label="Close sign in">×</button>
          <Auth />
        </div>
      )}
    </>
  )
}
