'use client'

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Braces,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  Eye,
  EyeOff,
  GitBranch,
  Layers3,
  Loader2,
  LockKeyhole,
  Mail,
  Network,
  Sparkles,
  Terminal,
  type LucideIcon,
} from 'lucide-react'
import { Wordmark } from '@/components/social/wordmark'

export type CommunLoginCredentials = {
  email: string
  password: string
}

export type CommunLoginResult =
  | { ok: true; redirectTo: string }
  | { ok: false; message: string; field?: 'email' | 'password' | 'form' }

export type CommunRecoveryResult =
  | { ok: true; message: string }
  | { ok: false; message: string }

export interface Commun3DLoginProps {
  /** Blue palette accent. The Commun experience passes #2563EB. */
  accentColor?: string
  /** Must call the real Supabase sign-in method. Never resolves true on a mock request. */
  onSubmit: (credentials: CommunLoginCredentials) => Promise<CommunLoginResult>
  /** Must call real password recovery and report the provider result. */
  onForgotPassword: (email: string) => Promise<CommunRecoveryResult>
  /** Navigates to the existing registration route. */
  onSignup: () => void
  /** Called only after a successful real authentication, after the success state paints. */
  onRedirect: (path: string) => void
  className?: string
}

type LoginStatus = 'idle' | 'loading' | 'success' | 'error'
type FieldErrors = Partial<Record<'email' | 'password', string>>

const DEFAULT_ACCENT = '#2563EB'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const techLogos: Array<{
  icon: LucideIcon
  label: string
  position: string
  delay: number
  duration: number
  drift: number
}> = [
  { icon: GitBranch, label: 'Git', position: 'left-[8%] top-[18%]', delay: 0, duration: 6.4, drift: 12 },
  { icon: Braces, label: 'Braces', position: 'left-[22%] top-[62%]', delay: 0.8, duration: 7.2, drift: 10 },
  { icon: Database, label: 'Database', position: 'left-[42%] top-[10%]', delay: 1.4, duration: 6.8, drift: 14 },
  { icon: Terminal, label: 'Terminal', position: 'right-[18%] top-[28%]', delay: 0.4, duration: 7.6, drift: 11 },
  { icon: Cpu, label: 'CPU', position: 'right-[9%] top-[63%]', delay: 1.1, duration: 6.2, drift: 13 },
  { icon: Network, label: 'Network', position: 'left-[34%] bottom-[12%]', delay: 1.8, duration: 7.8, drift: 9 },
]

const particles = Array.from({ length: 22 }, (_, index) => {
  const angle = (index / 22) * Math.PI * 2
  const radius = 26 + ((index * 17) % 34)
  return {
    left: `${50 + Math.cos(angle) * radius}%`,
    top: `${50 + Math.sin(angle) * radius * 0.68}%`,
    size: index % 4 === 0 ? 3 : 2,
    delay: (index % 7) * 0.42,
    duration: 4.6 + (index % 5) * 0.55,
    opacity: 0.2 + (index % 4) * 0.12,
  }
})

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '')
  const expanded = normalized.length === 3
    ? normalized.split('').map((character) => `${character}${character}`).join('')
    : normalized
  const value = Number.parseInt(expanded, 16)
  if (Number.isNaN(value) || expanded.length !== 6) return `rgba(37, 99, 235, ${alpha})`
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function FieldMessage({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="overflow-hidden text-xs font-medium text-red-600"
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  )
}

export function Commun3DLogin({
  accentColor = DEFAULT_ACCENT,
  onSubmit,
  onForgotPassword,
  onSignup,
  onRedirect,
  className = '',
}: Commun3DLoginProps) {
  const reduceMotion = Boolean(useReducedMotion())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<LoginStatus>('idle')
  const [message, setMessage] = useState('')
  const [recoveryMessage, setRecoveryMessage] = useState('')
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const springConfig = { stiffness: 90, damping: 18, mass: 0.5 }
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [7, -7]), springConfig)
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-9, 9]), springConfig)
  const shiftX = useSpring(useTransform(pointerX, [-0.5, 0.5], [-10, 10]), springConfig)
  const shiftY = useSpring(useTransform(pointerY, [-0.5, 0.5], [-6, 6]), springConfig)

  const rootStyle = useMemo(
    () =>
      ({
        '--commun-login-accent': accentColor,
        '--commun-login-accent-soft': hexToRgba(accentColor, 0.12),
        '--commun-login-accent-glow': hexToRgba(accentColor, 0.38),
        background: `radial-gradient(circle at 22% 16%, ${hexToRgba(accentColor, 0.14)} 0%, transparent 42%), radial-gradient(circle at 78% 82%, ${hexToRgba(accentColor, 0.08)} 0%, transparent 46%), #F8FAFC`,
      }) as CSSProperties,
    [accentColor]
  )

  useEffect(() => {
    if (status !== 'success' || !redirectTo) return
    onRedirect(redirectTo)
  }, [status, redirectTo, onRedirect])

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (reduceMotion) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5)
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5)
  }

  function resetPointer() {
    pointerX.set(0)
    pointerY.set(0)
  }

  function validate() {
    const nextErrors: FieldErrors = {}
    if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Enter your password.'
    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setRecoveryMessage('')
    setStatus('idle')
    if (!validate()) return

    setStatus('loading')
    try {
      const result = await onSubmit({ email: email.trim(), password })
      if (!result.ok) {
        setStatus('error')
        setMessage(result.message)
        if (result.field && result.field !== 'form') {
          setFieldErrors((current) => ({ ...current, [result.field as 'email' | 'password']: result.message }))
        }
        return
      }
      setRedirectTo(result.redirectTo)
      setMessage('Signed in. Opening your workspace…')
      setStatus('success')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Unable to sign in. Please try again.')
    }
  }

  async function handleForgotPassword() {
    setMessage('')
    setRecoveryMessage('')
    if (!EMAIL_PATTERN.test(email.trim())) {
      setFieldErrors((current) => ({ ...current, email: 'Enter your email first.' }))
      setMessage('Enter your email above, then request a reset link.')
      setStatus('error')
      return
    }

    setStatus('loading')
    try {
      const result = await onForgotPassword(email.trim())
      if (result.ok) {
        setStatus('idle')
        setRecoveryMessage(result.message)
      } else {
        setStatus('error')
        setMessage(result.message)
      }
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Unable to send a reset link. Please try again.')
    }
  }

  const fieldMotion = (field: 'email' | 'password') => ({
    animate: {
      borderColor: fieldErrors[field]
        ? '#DC2626'
        : focusedField === field
          ? accentColor
          : '#E2E8F0',
      boxShadow:
        focusedField === field && !fieldErrors[field]
          ? `0 0 0 4px ${hexToRgba(accentColor, 0.12)}`
          : '0 0 0 0 rgba(0,0,0,0)',
    },
    transition: { duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' as const },
  })

  return (
    <main
      className={`relative min-h-screen w-full overflow-x-hidden text-[#0F172A] ${className}`}
      style={rootStyle}
    >
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
        {/* Animated 3D scene */}
        <section
          aria-label="Commun developer network"
          onPointerMove={handlePointerMove}
          onPointerLeave={resetPointer}
          className="relative flex min-h-[260px] items-center justify-center overflow-hidden px-5 py-8 sm:min-h-[330px] lg:min-h-screen lg:px-10 lg:py-12"
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ opacity: reduceMotion ? 0.6 : 1 }}
          >
            <div className="absolute left-[12%] top-[8%] h-56 w-56 rounded-full bg-[radial-gradient(circle,var(--commun-login-accent-soft),transparent_70%)] blur-2xl" />
            <div className="absolute bottom-[8%] right-[12%] h-64 w-64 rounded-full bg-[radial-gradient(circle,var(--commun-login-accent-soft),transparent_72%)] blur-3xl" />
          </motion.div>

          <motion.div
            className="relative h-[232px] w-full max-w-[560px] scale-[0.78] sm:h-[280px] sm:scale-90 lg:h-[520px] lg:max-w-none lg:scale-100"
            style={{
              perspective: 1100,
              rotateX: reduceMotion ? 0 : rotateX,
              rotateY: reduceMotion ? 0 : rotateY,
              x: reduceMotion ? 0 : shiftX,
              y: reduceMotion ? 0 : shiftY,
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="absolute inset-0 rounded-full border border-white/70 bg-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm" />

            {/* Orbital rings */}
            <div className="absolute left-1/2 top-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2" style={{ transformStyle: 'preserve-3d' }}>
              <div className="absolute inset-0 rounded-full border border-[#BFDBFE]/70" style={{ transform: 'rotateX(68deg)' }}>
                <motion.div
                  className="h-full w-full rounded-full border-t-2"
                  style={{ borderTopColor: hexToRgba(accentColor, 0.6) }}
                  animate={reduceMotion ? undefined : { rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <div className="absolute inset-[12%] rounded-full border border-[#DBEAFE]/80" style={{ transform: 'rotateY(64deg)' }}>
                <motion.div
                  className="h-full w-full rounded-full border-b-2 border-[#60A5FA]/70"
                  animate={reduceMotion ? undefined : { rotate: -360 }}
                  transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <div className="absolute inset-[24%] rounded-full border border-[#E2E8F0]" style={{ transform: 'rotateX(58deg) rotateZ(28deg)' }}>
                <motion.div
                  className="h-full w-full rounded-full border-r-2"
                  style={{ borderRightColor: hexToRgba(accentColor, 0.5) }}
                  animate={reduceMotion ? undefined : { rotate: 360 }}
                  transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            </div>

            {/* Particles */}
            <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
              {particles.map((particle, index) => (
                <motion.span
                  key={`particle-${index}`}
                  className="absolute rounded-full bg-[var(--commun-login-accent)]"
                  style={{
                    left: particle.left,
                    top: particle.top,
                    width: particle.size,
                    height: particle.size,
                    opacity: particle.opacity,
                    boxShadow: `0 0 10px ${hexToRgba(accentColor, 0.5)}`,
                  }}
                  animate={
                    reduceMotion
                      ? undefined
                      : { y: [0, -10 - (index % 4) * 3, 0], opacity: [particle.opacity, 0.8, particle.opacity] }
                  }
                  transition={{
                    duration: particle.duration,
                    delay: particle.delay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>

            {/* Floating technology logos */}
            {techLogos.map(({ icon: Icon, label, position, delay, duration, drift }) => (
              <motion.div
                key={label}
                aria-hidden="true"
                className={`absolute ${position} flex h-10 w-10 items-center justify-center rounded-xl border border-[#DBEAFE] bg-white/90 text-[var(--commun-login-accent)] shadow-[0_12px_28px_-18px_var(--commun-login-accent-glow)] backdrop-blur md:h-12 md:w-12`}
                animate={reduceMotion ? undefined : { y: [0, -drift, 0], rotate: [-3, 3, -3] }}
                transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.8} />
              </motion.div>
            ))}

            {/* Central Commun brand mark */}
            <motion.div
              className="absolute left-1/2 top-1/2 flex h-[118px] w-[118px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[28px] border border-white bg-white/95 md:h-[148px] md:w-[148px] md:rounded-[34px]"
              style={{
                boxShadow: `0 28px 70px -34px ${hexToRgba(accentColor, 0.72)}, inset 0 1px 0 rgba(255,255,255,0.9)`,
                transformStyle: 'preserve-3d',
              }}
              animate={reduceMotion ? undefined : { y: [0, -9, 0] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.div
                className="flex h-[82px] w-[82px] items-center justify-center rounded-[22px] text-white md:h-[104px] md:w-[104px] md:rounded-[26px]"
                style={{ background: `linear-gradient(145deg, #60A5FA 0%, ${accentColor} 52%, #1D4ED8 100%)` }}
                animate={reduceMotion ? undefined : { scale: [1, 1.035, 1] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="font-mono text-3xl font-semibold tracking-[-0.06em] md:text-4xl">c</span>
              </motion.div>
              <span className="absolute -bottom-7 whitespace-nowrap font-mono text-[11px] font-medium tracking-[0.22em] text-[#64748B]">
                COMMUN / DEV
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative z-10 mt-2 max-w-xl text-center lg:absolute lg:bottom-10 lg:mt-0 lg:text-left"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          >
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--commun-login-accent)]">
              COMMUN / DEVELOPER NETWORK
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0F172A] sm:text-4xl lg:text-5xl">
              Build. Connect. Grow.
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#64748B] sm:text-base lg:mx-0">
              Your work, your people, and your next idea in one focused network.
            </p>
          </motion.div>
        </section>

        {/* Authentication card */}
        <section className="relative flex items-center justify-center px-5 pb-12 pt-2 sm:px-8 lg:px-12 lg:py-12">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 24, scale: 0.985 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.2, 0.75, 0.25, 1] }}
            className="w-full max-w-[440px] rounded-[24px] border border-white/80 bg-white/90 p-6 shadow-[0_32px_80px_-48px_rgba(15,23,42,0.42),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl sm:p-8"
          >
            <div className="flex items-center justify-between gap-4">
              <Wordmark size="sm" />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1E40AF]">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Developer network
              </span>
            </div>

            <div className="mt-8">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--commun-login-accent)]">
                Commun / Identity
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[#0F172A]">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">Log in to continue where you left off.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
              <div>
                <label htmlFor="commun-login-email" className="mb-2 block text-sm font-medium text-[#0F172A]">
                  Email
                </label>
                <motion.div
                  {...fieldMotion('email')}
                  className="flex h-12 items-center gap-3 rounded-xl border bg-white px-3.5"
                >
                  <Mail className="h-4 w-4 shrink-0 text-[#64748B]" aria-hidden="true" />
                  <input
                    id="commun-login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: undefined }))
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'commun-login-email-error' : undefined}
                    className="h-full w-full bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                  />
                </motion.div>
                <div className="mt-1.5">
                  <FieldMessage id="commun-login-email-error" message={fieldErrors.email} />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="commun-login-password" className="text-sm font-medium text-[#0F172A]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={status === 'loading'}
                    className="text-xs font-medium text-[var(--commun-login-accent)] transition hover:text-[#1D4ED8] disabled:opacity-60"
                  >
                    Forgot password?
                  </button>
                </div>
                <motion.div
                  {...fieldMotion('password')}
                  className="flex h-12 items-center gap-3 rounded-xl border bg-white px-3.5"
                >
                  <LockKeyhole className="h-4 w-4 shrink-0 text-[#64748B]" aria-hidden="true" />
                  <input
                    id="commun-login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: undefined }))
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'commun-login-password-error' : undefined}
                    className="h-full w-full bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="rounded-md p-1 text-[#64748B] transition hover:text-[#1E40AF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </motion.div>
                <div className="mt-1.5">
                  <FieldMessage id="commun-login-password-error" message={fieldErrors.password} />
                </div>
              </div>

              <AnimatePresence initial={false} mode="wait">
                {message ? (
                  <motion.div
                    key={status === 'success' ? 'success' : 'error'}
                    role={status === 'success' ? 'status' : 'alert'}
                    aria-live="polite"
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
                    className={`flex items-start gap-2 overflow-hidden rounded-xl px-3 py-2.5 text-sm ${
                      status === 'success'
                        ? 'bg-[#EFF6FF] text-[#1E40AF]'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {status === 'success' ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>{message}</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {recoveryMessage ? (
                  <motion.div
                    role="status"
                    aria-live="polite"
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
                    className="flex items-start gap-2 overflow-hidden rounded-xl bg-[#EFF6FF] px-3 py-2.5 text-sm text-[#1E40AF]"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{recoveryMessage}</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                whileHover={reduceMotion || status === 'loading' ? undefined : { scale: 1.01 }}
                whileTap={reduceMotion || status === 'loading' ? undefined : { scale: 0.99 }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(37,99,235,0.9)] transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === 'loading' ? (
                  <>
                    <motion.span
                      animate={reduceMotion ? undefined : { rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                      className="inline-flex"
                    >
                      <Loader2 className="h-4 w-4" aria-hidden="true" />
                    </motion.span>
                    Please wait…
                  </>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Signed in
                  </>
                ) : (
                  <>
                    Log in
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-7 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-[#E2E8F0]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#94A3B8]">Built for builders</span>
              <span className="h-px flex-1 bg-[#E2E8F0]" />
            </div>

            <p className="mt-5 text-center text-sm text-[#64748B]">
              New to Commun?{' '}
              <button
                type="button"
                onClick={onSignup}
                className="font-semibold text-[var(--commun-login-accent)] transition hover:text-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
              >
                Create an account
              </button>
            </p>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#94A3B8]">
              <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
              <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
              Secure sessions powered by Commun
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  )
}

export default Commun3DLogin
