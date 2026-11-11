import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SocialComposer } from '@/components/publishing/social-composer'

export default async function ComposePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/compose')
  const { data: profile } = await supabase.from('profiles').select('display_name,username').eq('id', user.id).maybeSingle()
  const authorName = profile?.display_name || profile?.username || 'you'

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Create</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Share something useful.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">A short post, a code snippet, or a link worth another developer’s time.</p>
        </div>
        <Link href="/write" className="hidden shrink-0 text-xs font-semibold text-accent hover:underline sm:block">Write a long article →</Link>
      </div>
      <SocialComposer authorName={authorName} />
    </main>
  )
}
