'use client'

import { FormEvent, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ONBOARDING_INTERESTS, isValidUsername } from '@/lib/onboarding'

export { ONBOARDING_INTERESTS }

interface OnboardingFormProps {
  initialName: string
  initialUsername: string
  initialBio: string
  initialGithub: string
  initialWebsite: string
  initialInterests: string[]
}

export function OnboardingForm({
  initialName,
  initialUsername,
  initialBio,
  initialGithub,
  initialWebsite,
  initialInterests,
}: OnboardingFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<number>(() => {
    if (initialName && initialUsername && initialInterests.length > 0) return 4
    if (initialName && initialUsername) return 3
    return 1
  })
  const [name, setName] = useState(initialName)
  const [username, setUsername] = useState(initialUsername)
  const [bio, setBio] = useState(initialBio)
  const [github, setGithub] = useState(initialGithub)
  const [website, setWebsite] = useState(initialWebsite)
  const [selected, setSelected] = useState<string[]>(initialInterests)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function next() {
    setError('')
    if (step === 2) {
      if (!name.trim()) {
        setError('Please enter your name.')
        return
      }
      if (!username.trim()) {
        setError('Please choose a username.')
        return
      }
      if (!isValidUsername(username)) {
        setError('Username must be 3-30 characters (letters, numbers, underscores only).')
        return
      }
    }
    setStep((current) => Math.min(4, current + 1))
  }

  function toggle(topic: string) {
    setSelected((current) =>
      current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]
    )
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login?next=/onboarding')
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: name.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim() || null,
          github: github.trim() || null,
          website: website.trim() || null,
          interests: selected,
          onboarding_completed: true,
          status: 'ACTIVE',
        })
        .eq('id', user.id)

      if (updateError) {
        setError(`Unable to save profile: ${updateError.message || 'Please check your connection and retry.'}`)
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-3xl items-center px-5 py-12 sm:px-8">
      <div className="w-full">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Commun / setup</p>
            <p className="mt-2 text-sm text-muted">Step {step} of 4</p>
          </div>
          <div className="flex gap-1.5" aria-label={`Step ${step} of 4`}>
            {[1, 2, 3, 4].map((item) => (
              <span
                key={item}
                className={`h-1 w-12 rounded-full transition-colors ${
                  item <= step ? 'bg-accent' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/20 sm:p-10">
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="font-mono text-sm text-accent">WELCOME TO COMMUN</p>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight">
                A place for developers to learn in public.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-muted">
                Discover developers, learn from technical content, publish knowledge, participate in discussions, and
                build a network around the work you care about.
              </p>
              <button
                type="button"
                onClick={next}
                className="mt-8 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-background transition hover:brightness-110"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                next()
              }}
            >
              <p className="font-mono text-sm text-accent">DEVELOPER IDENTITY</p>
              <h1 className="mt-3 text-3xl font-semibold">How should people know you?</h1>
              <p className="mt-2 text-sm text-muted">Name and username are required. Everything else can be added later.</p>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span>Name <strong className="text-accent">*</strong></span>
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="rounded-lg border border-border bg-background px-3 py-3 outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span>Username <strong className="text-accent">*</strong></span>
                  <input
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="e.g. alexrivera"
                    className="rounded-lg border border-border bg-background px-3 py-3 outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm sm:col-span-2">
                  <span>Bio <span className="text-muted">(optional)</span></span>
                  <textarea
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    rows={3}
                    placeholder="What are you building or interested in?"
                    className="resize-none rounded-lg border border-border bg-background px-3 py-3 outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span>GitHub <span className="text-muted">(optional)</span></span>
                  <input
                    value={github}
                    onChange={(event) => setGithub(event.target.value)}
                    placeholder="github.com/username"
                    className="rounded-lg border border-border bg-background px-3 py-3 outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span>Website <span className="text-muted">(optional)</span></span>
                  <input
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    placeholder="https://yourportfolio.dev"
                    className="rounded-lg border border-border bg-background px-3 py-3 outline-none focus:border-accent"
                  />
                </label>
              </div>

              <StepActions onBack={() => setStep(1)} onNext={next} label="Continue" />
            </form>
          )}

          {step === 3 && (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                next()
              }}
            >
              <p className="font-mono text-sm text-accent">YOUR INTERESTS</p>
              <h1 className="mt-3 text-3xl font-semibold">What are you working with?</h1>
              <p className="mt-2 text-sm text-muted">
                Choose any topics that feel relevant. You can update these at any time in settings.
              </p>

              <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Topic interests">
                {ONBOARDING_INTERESTS.map((topic) => {
                  const isSelected = selected.includes(topic)
                  return (
                    <button
                      type="button"
                      key={topic}
                      onClick={() => toggle(topic)}
                      aria-pressed={isSelected}
                      className={`rounded-full border px-4 py-2.5 text-sm transition ${
                        isSelected
                          ? 'border-accent bg-accent/15 font-medium text-accent'
                          : 'border-border text-muted hover:border-accent/50 hover:text-foreground'
                      }`}
                    >
                      {topic}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 text-xs text-muted">
                {selected.length === 0 ? 'No topics selected (optional)' : `${selected.length} topic${selected.length === 1 ? '' : 's'} selected`}
              </div>

              <StepActions onBack={() => setStep(2)} onNext={next} label="Continue" />
            </form>
          )}

          {step === 4 && (
            <div>
              <p className="font-mono text-sm text-accent">ALL SET</p>
              <h1 className="mt-3 text-3xl font-semibold">You&apos;re ready for Commun.</h1>
              <p className="mt-4 max-w-lg text-sm leading-7 text-muted">
                Your developer identity is configured. Let&apos;s enter your workspace to discover real articles, explore technologies, and connect with other builders.
              </p>

              <div className="mt-6 rounded-xl border border-border bg-background/50 p-4 text-xs text-muted">
                <p><strong className="text-foreground">Name:</strong> {name || 'Not provided'}</p>
                <p className="mt-1"><strong className="text-foreground">Username:</strong> @{username || 'member'}</p>
                <p className="mt-1">
                  <strong className="text-foreground">Interests:</strong>{' '}
                  {selected.length ? selected.join(', ') : 'None selected'}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={loading}
                  className="text-sm text-muted hover:text-foreground disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => submit()}
                  className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? 'Saving…' : 'Enter Commun'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function StepActions({
  onBack,
  onNext,
  label,
}: {
  onBack: () => void
  onNext?: () => void
  label: string
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <button type="button" onClick={onBack} className="text-sm text-muted hover:text-foreground">
        Back
      </button>
      <button
        type={onNext ? 'button' : 'submit'}
        onClick={onNext}
        className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-background transition hover:brightness-110"
      >
        {label}
      </button>
    </div>
  )
}

export function OnboardingError() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Onboarding unavailable</p>
        <h1 className="mt-3 text-2xl font-semibold">We couldn&apos;t load your profile.</h1>
        <p className="mt-3 text-sm text-muted">Please sign in again and retry.</p>
      </div>
    </main>
  )
}
