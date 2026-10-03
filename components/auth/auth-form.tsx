'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setMessage(null)
    const supabase = createClient()
    const redirectTo = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo, data: { username: username.trim() || null } } })
    setPending(false)
    if (result.error) {
      const isCredentialError = result.error.message.toLowerCase().includes('invalid login credentials')
      setError(isCredentialError ? 'Invalid email or password.' : result.error.message)
      return
    }
    if (mode === 'register') {
      setMessage('Check your email to confirm your account, then return to log in.')
      return
    }
    router.push('/feed')
    router.refresh()
  }

  const isLogin = mode === 'login'
  return <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
    {!isLogin && <label className="flex flex-col gap-2 text-sm"><span className="font-medium">Username <span className="text-muted">(optional)</span></span><input value={username} onChange={(event) => setUsername(event.target.value)} className="rounded-md border bg-background px-3 py-2.5 outline-none focus:border-accent" maxLength={40} autoComplete="username" /></label>}
    <label className="flex flex-col gap-2 text-sm"><span className="font-medium">Email</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-md border bg-background px-3 py-2.5 outline-none focus:border-accent" autoComplete="email" /></label>
    <label className="flex flex-col gap-2 text-sm"><span className="font-medium">Password</span><input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-md border bg-background px-3 py-2.5 outline-none focus:border-accent" autoComplete={isLogin ? 'current-password' : 'new-password'} /></label>
    {error && <p role="alert" className="rounded-md border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p>}
    {message && <p role="status" className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">{message}</p>}
    <button disabled={pending} className="rounded-md bg-accent px-4 py-3 text-sm font-semibold text-background disabled:cursor-wait disabled:opacity-60">{pending ? 'Working…' : isLogin ? 'Log in' : 'Create account'}</button>
    <p className="text-center text-sm text-muted">{isLogin ? <>Need an account? <Link className="font-semibold text-accent hover:underline" href="/register">Join Commun</Link></> : <>Already a member? <Link className="font-semibold text-accent hover:underline" href="/login">Log in</Link></>}</p>
  </form>
}

export function AuthCard({ mode }: { mode: 'login' | 'register' }) {
  return <section className="w-full max-w-md rounded-xl border bg-surface p-6 shadow-sm sm:p-8"><p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">{mode === 'login' ? 'Welcome back' : 'Join the network'}</p><h1 className="text-3xl font-bold tracking-tight">{mode === 'login' ? 'Log in' : 'Create your account'}</h1><p className="mt-3 mb-8 text-sm leading-6 text-muted">{mode === 'login' ? 'Return to the ideas and people you follow.' : 'A focused home for developers to read, write, and build together.'}</p><AuthForm mode={mode} /></section>
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) { return <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12"><AuthCard mode={mode} /></main> }

export function AuthError({ message }: { message: string }) { return <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center"><p className="font-mono text-xs uppercase tracking-widest text-accent">Authentication</p><h1 className="mt-3 text-3xl font-bold">Something needs your attention</h1><p className="mt-4 text-muted">{message}</p><Link href="/login" className="mt-8 rounded-md bg-accent px-4 py-3 text-sm font-semibold text-background">Return to log in</Link></main> }

export function AuthSuccess() { return <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center"><p className="font-mono text-xs uppercase tracking-widest text-accent">You&apos;re almost in</p><h1 className="mt-3 text-3xl font-bold">Confirm your email</h1><p className="mt-4 text-muted">Use the confirmation link we sent you, then log in to finish setting up your profile.</p><Link href="/login" className="mt-8 rounded-md bg-accent px-4 py-3 text-sm font-semibold text-background">Go to log in</Link></main> }

export function SignOutButton() { const router = useRouter(); return <button type="button" onClick={async () => { await createClient().auth.signOut(); router.push('/'); router.refresh() }} className="text-sm text-muted hover:text-foreground">Log out</button> }
