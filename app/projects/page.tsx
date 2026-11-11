import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/projects')

  return (
    <div className="workspace-enter mx-auto w-full max-w-7xl space-y-7">
      <header className="flex flex-col gap-5 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent">Workspace / Projects</p>
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Projects</h1><span className="text-xs text-muted">Workspace overview</span></div>
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

      <section aria-labelledby="project-list-title">
        <div className="mb-4"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted">Portfolio</p><h2 id="project-list-title" className="mt-1 text-lg font-semibold">All projects</h2></div>
        <Card className="overflow-hidden border-border bg-card">
          <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1.2fr)_minmax(220px,.8fr)] sm:p-7">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-[.12em] text-muted">Project records unavailable</p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">Your portfolio will appear here</h3>
              <p className="mt-2 text-sm leading-6 text-muted">This workspace doesn’t have a connected project data source. No sample initiatives or progress figures are shown.</p>
            </div>
            <dl className="grid grid-cols-3 gap-3 self-end border-t border-border/80 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
              <div><dt className="text-xs text-muted">Milestones</dt><dd className="mt-1 text-sm font-medium">Unavailable</dd></div>
              <div><dt className="text-xs text-muted">Owners</dt><dd className="mt-1 text-sm font-medium">Unavailable</dd></div>
              <div><dt className="text-xs text-muted">Deadlines</dt><dd className="mt-1 text-sm font-medium">Unavailable</dd></div>
            </dl>
          </div>
        </Card>
      </section>
    </div>
  )
}
