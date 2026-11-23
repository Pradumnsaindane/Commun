'use client'

import { useState } from 'react'
import { profileCompleteness } from '@/lib/profile'
import { updateOwnProfile } from '@/features/profiles/api'

type InitialProfile = {
  display_name: string | null
  username: string | null
  headline: string | null
  bio: string | null
  location: string | null
  website: string | null
  github: string | null
  portfolio_url: string | null
  avatar_url: string | null
  cover_image_path: string | null
  skills: string[] | null
  technologies: string[] | null
  interests: string[] | null
}

function csv(values: string[] | null | undefined) {
  return (values ?? []).join(', ')
}

export function ProfileEditor({ profile }: { profile: InitialProfile }) {
  const [form, setForm] = useState({
    displayName: profile.display_name ?? '',
    username: profile.username ?? '',
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    website: profile.website ?? '',
    github: profile.github ?? '',
    portfolioUrl: profile.portfolio_url ?? '',
    avatarUrl: profile.avatar_url ?? '',
    coverImagePath: profile.cover_image_path ?? '',
    skills: csv(profile.skills),
    technologies: csv(profile.technologies),
    interests: csv(profile.interests),
  })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [skipped, setSkipped] = useState<string[]>([])

  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }))

  const completeness = profileCompleteness({
    ...profile,
    display_name: form.displayName,
    username: form.username,
    headline: form.headline,
    bio: form.bio,
    skills: form.skills ? form.skills.split(',') : [],
    technologies: form.technologies ? form.technologies.split(',') : [],
    website: form.website,
    avatar_url: form.avatarUrl,
  })

  async function save() {
    setPending(true)
    setError('')
    setNotice('')
    setSkipped([])
    try {
      const data = await updateOwnProfile({
        displayName: form.displayName,
        username: form.username,
        headline: form.headline,
        bio: form.bio,
        location: form.location,
        website: form.website,
        github: form.github,
        portfolioUrl: form.portfolioUrl,
        avatarUrl: form.avatarUrl,
        coverImagePath: form.coverImagePath,
        skills: form.skills ? form.skills.split(',').map((item) => item.trim()).filter(Boolean) : [],
        technologies: form.technologies ? form.technologies.split(',').map((item) => item.trim()).filter(Boolean) : [],
        interests: form.interests ? form.interests.split(',').map((item) => item.trim()).filter(Boolean) : [],
      })
      setNotice('Profile saved.')
      setSkipped(data.skipped)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save your profile.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void save() }} className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Profile completeness</p>
          <p className="font-mono text-xs text-muted">{completeness.completed}/{completeness.total}</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.round((completeness.completed / completeness.total) * 100)}%` }} />
        </div>
        {completeness.missing.length > 0 && <p className="mt-2 text-xs text-muted">Still missing: {completeness.missing.join(', ')}.</p>}
      </div>

      <fieldset className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <legend className="px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Identity</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm"><span className="font-medium">Name</span><input value={form.displayName} onChange={(event) => set('displayName')(event.target.value)} required maxLength={80} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" /></label>
          <label className="block text-sm"><span className="font-medium">Username</span><input value={form.username} onChange={(event) => set('username')(event.target.value)} required pattern="[A-Za-z0-9_]{3,24}" maxLength={24} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-accent" /><span className="mt-1 block text-[11px] text-muted">3–24 characters: letters, numbers, underscores.</span></label>
        </div>
        <label className="block text-sm"><span className="font-medium">Headline</span><input value={form.headline} onChange={(event) => set('headline')(event.target.value)} maxLength={120} placeholder="Backend engineer working on reliable APIs" className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" /></label>
        <label className="block text-sm"><span className="font-medium">Biography</span><textarea value={form.bio} onChange={(event) => set('bio')(event.target.value)} rows={4} maxLength={600} placeholder="What you build, what you care about, and what you are learning." className="mt-1.5 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" /></label>
        <label className="block text-sm"><span className="font-medium">Location <span className="text-muted">(optional)</span></span><input value={form.location} onChange={(event) => set('location')(event.target.value)} maxLength={120} placeholder="Berlin, Germany" className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" /></label>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <legend className="px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Links & images</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm"><span className="font-medium">Website</span><input value={form.website} onChange={(event) => set('website')(event.target.value)} inputMode="url" placeholder="https://your-site.dev" className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" /></label>
          <label className="block text-sm"><span className="font-medium">GitHub</span><input value={form.github} onChange={(event) => set('github')(event.target.value)} placeholder="github.com/username" className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" /></label>
          <label className="block text-sm"><span className="font-medium">Portfolio</span><input value={form.portfolioUrl} onChange={(event) => set('portfolioUrl')(event.target.value)} inputMode="url" placeholder="https://portfolio.dev" className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" /></label>
          <label className="block text-sm"><span className="font-medium">Profile picture URL</span><input value={form.avatarUrl} onChange={(event) => set('avatarUrl')(event.target.value)} inputMode="url" placeholder="https://…/avatar.jpg" className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" /></label>
          <label className="block text-sm sm:col-span-2"><span className="font-medium">Cover image URL</span><input value={form.coverImagePath} onChange={(event) => set('coverImagePath')(event.target.value)} inputMode="url" placeholder="https://…/cover.jpg" className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" /><span className="mt-1 block text-[11px] text-muted">Direct image URLs only. Uploads require configured storage and are not enabled yet.</span></label>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <legend className="px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Skills & interests</legend>
        <label className="block text-sm"><span className="font-medium">Skills</span><input value={form.skills} onChange={(event) => set('skills')(event.target.value)} placeholder="API design, PostgreSQL, testing" className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" /><span className="mt-1 block text-[11px] text-muted">Comma separated, up to 20.</span></label>
        <label className="block text-sm"><span className="font-medium">Technologies</span><input value={form.technologies} onChange={(event) => set('technologies')(event.target.value)} placeholder="TypeScript, Go, Docker" className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" /></label>
        <label className="block text-sm"><span className="font-medium">Professional interests</span><input value={form.interests} onChange={(event) => set('interests')(event.target.value)} placeholder="Distributed systems, developer tools" className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" /></label>
      </fieldset>

      {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent">{notice}{skipped.length > 0 && ` The following fields need the Phase 1B database update and were not saved: ${skipped.join(', ')}.`}</p>}

      <div className="flex items-center justify-end gap-3">
        <a href={`/profile/${form.username || 'me'}`} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:border-accent/50">View public profile</a>
        <button type="submit" disabled={pending} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-60">{pending ? 'Saving…' : 'Save profile'}</button>
      </div>
    </form>
  )
}
