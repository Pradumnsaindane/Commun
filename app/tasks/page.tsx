import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const columns = [
  { title: 'To do', description: 'Ready to begin', tone: 'text-muted', marker: 'bg-border' },
  { title: 'In progress', description: 'Work in motion', tone: 'text-accent', marker: 'bg-accent' },
  { title: 'In review', description: 'Awaiting review', tone: 'text-indigo-600 dark:text-indigo-300', marker: 'bg-indigo-500' },
  { title: 'Completed', description: 'Finished work', tone: 'text-emerald-700 dark:text-emerald-300', marker: 'bg-emerald-600' },
]

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/tasks')

  return (
    <div className="workspace-enter mx-auto w-full max-w-7xl space-y-7">
      <header className="flex flex-col gap-5 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent">Workspace / Tasks</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">My Tasks</h1>
            <Badge variant="outline">Preview</Badge>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">A clear view of work moving from to do through review and completion.</p>
        </div>
        <Button variant="primary" size="sm" disabled title="Task persistence is not connected yet">Create task unavailable</Button>
      </header>

      <div className="glass-surface flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Task board</p>
          <p className="mt-1 text-xs text-muted">Task records and status updates are not connected to storage.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs text-muted"><span className="size-1.5 rounded-full bg-subtle" aria-hidden="true" />Data unavailable</span>
      </div>

      <section aria-label="Task stages" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <Card key={column.title} className="flex min-h-64 flex-col bg-surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-4">
              <div className="flex items-center gap-2.5">
                <span className={`size-2 rounded-full ${column.marker}`} aria-hidden="true" />
                <div>
                  <h2 className={`text-sm font-semibold ${column.tone}`}>{column.title}</h2>
                  <p className="mt-1 text-[11px] text-muted">{column.description}</p>
                </div>
              </div>
              <span className="rounded-lg border border-border bg-background px-2 py-1 font-mono text-[10px] text-muted" aria-label="Task count unavailable">—</span>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <span className="grid size-10 place-items-center rounded-xl border border-border bg-background text-muted" aria-hidden="true">○</span>
              <p className="mt-3 text-xs font-medium text-foreground">No task records to show</p>
              <p className="mt-1 max-w-48 text-[11px] leading-5 text-muted">Connect task storage to display this stage.</p>
            </div>
          </Card>
        ))}
      </section>
    </div>
  )
}
