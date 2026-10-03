import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingError, OnboardingForm } from '@/components/onboarding/onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/onboarding')
  const { data: profile } = await supabase.from('profiles').select('display_name,username,bio,github,website,interests,onboarding_completed').eq('id', user.id).maybeSingle()
  if (!profile) return <OnboardingError />
  if (profile.onboarding_completed) redirect('/dashboard')
  return <OnboardingForm initialName={profile.display_name === 'Commun member' ? '' : profile.display_name} initialUsername={profile.username ?? ''} initialBio={profile.bio ?? ''} initialGithub={profile.github ?? ''} initialWebsite={profile.website ?? ''} initialInterests={profile.interests ?? []} />
}
