import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const tracks = [
  { title: 'Role onboarding', description: 'Structured learning paths for new teammates', icon: '↗' },
  { title: 'Skill development', description: 'Guided practice and subject milestones', icon: '◎' },
  { title: 'Learning resources', description: 'Curated materials and saved references', icon: '▤' },
]

export default async function LearningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/learning')

  return (
    <div className="workspace-enter mx-auto w-full max-w-7xl space-y-7">
      <header className="flex flex-col gap-5 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent">Workspace / Learning</p>
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Learning</h1><Badge variant="outline">Preview</Badge></div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Make space for steady growth with plans, sessions, and useful learning resources.</p>
        </div>
        <Button variant="primary" size="sm" disabled title="Learning plan persistence is not connected yet">Create plan unavailable</Button>
      </header>

      <Card className="glass-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 className="text-base font-semibold">Learning plans aren’t connected</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted">There are no persisted plans or sessions available. Progress and milestones won’t be shown without saved learning data.</p></div><Badge variant="muted">Data unavailable</Badge></Card>

      <section aria-label="Learning workspace areas" className="grid gap-4 md:grid-cols-3">
        {tracks.map((track) => <Card key={track.title} className="interactive-surface bg-surface p-5"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl border border-border bg-background text-base text-accent" aria-hidden="true">{track.icon}</span><Badge variant="muted">Unavailable</Badge></div><h2 className="mt-5 text-sm font-semibold">{track.title}</h2><p className="mt-1 text-xs leading-5 text-muted">{track.description}</p><p className="mt-5 border-t border-border/80 pt-4 text-xs text-muted">No saved learning data</p></Card>)}
      </section>
    </div>
  )
}
