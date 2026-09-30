import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAuth = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        })
        if (signUpError) throw signUpError
        setSuccess('Account created. Check your email to confirm your account.')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      }
    } catch (err) {
      const message = err?.message?.toLowerCase() || ''
      setError(message.includes('invalid login credentials') ? 'Invalid email or password.' : message.includes('email not confirmed') ? 'Please confirm your email before signing in.' : message.includes('already registered') ? 'An account already exists for this email.' : 'Unable to continue right now. Please check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}` },
    })
    if (oauthError) setError('Google sign-in is not enabled for this project yet.')
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <section className="auth-showcase" aria-label="Commun introduction">
          <div className="auth-showcase-grid" aria-hidden="true" />
          <div className="auth-network" aria-hidden="true">
            <span className="network-line line-one" /><span className="network-line line-two" />
            <i /><i /><i /><i />
          </div>
          <div className="auth-showcase-copy">
            <span className="auth-arrow" aria-hidden="true">→</span>
            <h2>Commun</h2>
            <p>Build your developer identity, connect with your people, and create what&apos;s next.</p>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-header auth-header-left">
            <div className="auth-logo"><span className="logo-icon">◆</span><span>Commun</span></div>
            <h1>{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
            <p>{isSignUp ? 'Join the developer network.' : 'Sign in to your account'}</p>
          </div>

          <button type="button" className="google-button" onClick={handleGoogle} disabled={loading}>
            <span className="google-mark" aria-hidden="true">G</span> Continue with Google
          </button>
          <div className="auth-divider"><span>or</span></div>

          <form onSubmit={handleAuth} className="auth-form">
            {isSignUp && <div className="form-group"><label htmlFor="displayName">Display name</label><input id="displayName" type="text" placeholder="Your name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></div>}
            <div className="form-group"><label htmlFor="email">Email <span>*</span></label><input id="email" type="email" autoComplete="email" placeholder="Enter your email address" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <div className="form-group"><label htmlFor="password">Password <span>*</span></label><div className="password-field"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></div>
            {error && <div className="auth-error" role="alert">{error}</div>}
            {success && <div className="auth-success" role="status">{success}</div>}
            <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={loading}>{loading ? 'Please wait…' : isSignUp ? 'Create account  →' : 'Sign in  →'}</button>
          </form>

          {!isSignUp && <button type="button" className="forgot-link" onClick={() => setError('Password reset is available after email authentication is configured.')}>Forgot password?</button>}
          <div className="auth-toggle"><p>{isSignUp ? 'Already have an account?' : "Don't have an account?"} <button type="button" className="toggle-link" onClick={() => { setIsSignUp((value) => !value); setError(''); setSuccess('') }}>{isSignUp ? 'Sign in' : 'Sign up'}</button></p></div>
        </section>
      </div>
    </main>
  )
}
