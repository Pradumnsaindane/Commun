import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditor } from '@/components/profile/profile-editor'

export default async function ProfileSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/settings/profile')

  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (error || !profile) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Profile unavailable</h1>
        <p className="mt-3 text-sm text-muted">We could not load your profile. Please try again.</p>
        <Link href="/settings" className="mt-6 inline-flex text-sm font-semibold text-accent">Back to settings</Link>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Developer identity</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Edit your profile</h1>
          <p className="mt-2 text-sm text-muted">Only you can change these fields; they appear on your public profile.</p>
        </div>
        <Link href="/settings" className="shrink-0 text-xs font-semibold text-accent hover:underline">All settings →</Link>
      </header>
      <ProfileEditor
        profile={{
          display_name: profile.display_name ?? null,
          username: profile.username ?? null,
          headline: profile.headline ?? null,
          bio: profile.bio ?? null,
          location: profile.location ?? null,
          website: profile.website ?? null,
          github: profile.github ?? null,
          portfolio_url: profile.portfolio_url ?? null,
          avatar_url: profile.avatar_url ?? null,
          cover_image_path: profile.cover_image_path ?? null,
          skills: profile.skills ?? null,
          technologies: profile.technologies ?? null,
          interests: profile.interests ?? null,
        }}
      />
    </main>
  )
}
