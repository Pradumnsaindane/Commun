import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getRedirectUrl } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [displayName, setDisplayName] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getRedirectUrl(),
            data: { display_name: displayName },
          },
        })
        if (signUpError) throw signUpError
        alert('Check your email for the confirmation link!')
      } else if (!otpSent) {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: getRedirectUrl(),
          },
        })
        if (otpError) throw otpError
        setOtpSent(true)
      } else {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'email',
        })
        if (verifyError) throw verifyError
      }
    } catch (err) {
      const message = err?.message || ''
      setError(message.toLowerCase().includes('invalid login credentials')
        ? 'Invalid email or verification code.'
        : message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetOtpFlow = () => {
    setOtpSent(false)
    setOtp('')
    setError('')
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">◆</span>
            <span>Commun</span>
          </div>
          <h1>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isSignUp ? 'Join Commun to build, connect, and grow together' : 'Sign in to your Commun account'}</p>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                id="displayName"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {isSignUp ? (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
          ) : otpSent ? (
            <div className="form-group">
              <label htmlFor="otp">6-digit verification code</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                pattern="[0-9]{6}"
                maxLength={6}
                required
              />
              <small className="auth-helper">Enter the code sent to {email}.</small>
            </div>
          ) : (
            <p className="auth-helper auth-otp-intro">We&apos;ll email you a secure 6-digit code to sign in.</p>
          )}

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading || (!isSignUp && otpSent && otp.length !== 6)}>
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : otpSent ? 'Verify Code' : 'Send Verification Code'}
          </button>

          {!isSignUp && otpSent && (
            <button type="button" className="toggle-link auth-resend" onClick={resetOtpFlow} disabled={loading}>
              Use a different email or request a new code
            </button>
          )}
        </form>

        <div className="auth-toggle">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              className="toggle-link"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>

      <div className="auth-background">
        <div className="auth-gradient"></div>
      </div>
    </div>
  )
}
