import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const areas = [
  { title: 'Milestones', description: 'Project checkpoints and target dates', icon: '◇' },
  { title: 'Team', description: 'People and ownership', icon: '◎' },
  { title: 'Deadlines', description: 'Upcoming delivery dates', icon: '◷' },
]

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/projects')

  return (
    <div className="workspace-enter mx-auto w-full max-w-7xl space-y-7">
      <header className="flex flex-col gap-5 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent">Workspace / Projects</p>
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Projects</h1><Badge variant="outline">Preview</Badge></div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Bring initiatives, milestones, owners, and deadlines into one clear view.</p>
        </div>
        <Button variant="primary" size="sm" disabled title="Project persistence is not connected yet">New project unavailable</Button>
      </header>

      <Card className="glass-surface flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-accent/20 bg-accent/10 text-lg text-accent" aria-hidden="true">◫</span>
          <div><h2 className="text-base font-semibold">Project records aren’t connected</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Projects, progress, and team assignments cannot be loaded or saved yet. This page won’t show placeholder initiatives as real work.</p></div>
        </div>
        <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">Data unavailable</span>
      </Card>

      <section aria-labelledby="project-overview-title">
        <div className="mb-4"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted">Project workspace</p><h2 id="project-overview-title" className="mt-1 text-lg font-semibold">Overview</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          {areas.map((area) => <Card key={area.title} className="interactive-surface bg-surface p-5"><div className="flex items-start justify-between"><span className="grid size-9 place-items-center rounded-xl bg-background text-base text-accent" aria-hidden="true">{area.icon}</span><Badge variant="muted">Unavailable</Badge></div><h3 className="mt-5 text-sm font-semibold">{area.title}</h3><p className="mt-1 text-xs leading-5 text-muted">{area.description}</p><div className="mt-5 border-t border-border/80 pt-4 text-xs text-muted">No project data source connected</div></Card>)}
        </div>
      </section>

      <section aria-labelledby="project-list-title">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted">Portfolio</p><h2 id="project-list-title" className="mt-1 text-lg font-semibold">All projects</h2></div><span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">Awaiting data</span></div>
        <Card className="flex min-h-56 flex-col items-center justify-center border-dashed bg-surface/70 p-8 text-center">
          <span className="grid size-11 place-items-center rounded-xl border border-border bg-background text-xl text-muted" aria-hidden="true">◇</span>
          <h3 className="mt-4 text-sm font-semibold">Project list unavailable</h3>
          <p className="mt-2 max-w-md text-xs leading-5 text-muted">When project storage is connected, this space can show project status, milestones, ownership, and upcoming deadlines.</p>
        </Card>
      </section>
    </div>
  )
}
