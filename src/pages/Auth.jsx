import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleAuth = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        })
        if (signUpError) throw signUpError
        setError('Account created. Check your email to confirm your account.')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      }
    } catch (err) {
      const message = err?.message?.toLowerCase() || ''
      setError(message.includes('invalid login credentials')
        ? 'Invalid email or password.'
        : message.includes('email not confirmed')
          ? 'Please confirm your email before signing in.'
          : 'Unable to sign in right now. Please check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
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
            <span className="auth-eyebrow">The developer network</span>
            <h1>{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
            <p>{isSignUp ? 'Start building your presence in the network.' : 'Sign in to your Commun account.'}</p>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {isSignUp && <div className="form-group"><label htmlFor="displayName">Display name</label><input id="displayName" type="text" placeholder="Your name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></div>}
            <div className="form-group"><label htmlFor="email">Email <span>*</span></label><input id="email" type="email" autoComplete="email" placeholder="Enter your email address" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <div className="form-group"><label htmlFor="password">Password <span>*</span></label><div className="password-field"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></div>
            {error && <div className={error.startsWith('Account created') ? 'auth-success' : 'auth-error'} role="alert">{error}</div>}
            <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={loading}>{loading ? 'Signing in...' : isSignUp ? 'Create account →' : 'Sign in  →'}</button>
          </form>

          <div className="auth-toggle"><p>{isSignUp ? 'Already have an account?' : "Don&apos;t have an account?"}<button type="button" className="toggle-link" onClick={() => { setIsSignUp((value) => !value); setError('') }}>{isSignUp ? 'Sign in' : 'Sign up'}</button></p></div>
        </section>
      </div>
    </div>
  )
}
