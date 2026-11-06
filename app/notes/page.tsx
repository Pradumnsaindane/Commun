import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/notes')

  return (
    <div className="workspace-enter mx-auto w-full max-w-7xl space-y-7">
      <header className="flex flex-col gap-5 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent">Workspace / Notes</p>
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Notes</h1><Badge variant="outline">Preview</Badge></div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Keep useful context, decisions, and working notes close to your projects.</p>
        </div>
        <Button variant="primary" size="sm" disabled title="Note persistence is not connected yet">New note unavailable</Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,.6fr)]">
        <Card className="glass-surface flex min-h-72 flex-col items-center justify-center border-dashed p-8 text-center">
          <span className="grid size-12 place-items-center rounded-xl border border-border bg-background text-xl text-muted" aria-hidden="true">▤</span>
          <h2 className="mt-4 text-sm font-semibold">Notes aren’t connected yet</h2>
          <p className="mt-2 max-w-md text-xs leading-5 text-muted">There are no saved note records to show. Creation and autosave stay unavailable until durable storage is connected.</p>
        </Card>
        <Card className="bg-surface p-5 sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-accent">Workspace library</p>
          <h2 className="mt-3 text-sm font-semibold">Organize notes by context</h2>
          <p className="mt-2 text-xs leading-5 text-muted">A connected notes workspace can bring meeting notes, decisions, and personal references into searchable collections.</p>
          <div className="mt-5 space-y-2 border-t border-border/80 pt-4">
            {['Meeting notes', 'Decisions', 'Personal references'].map((label) => <div key={label} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-xs"><span>{label}</span><span className="text-[10px] text-muted">Unavailable</span></div>)}
          </div>
        </Card>
      </div>
    </div>
  )
}
