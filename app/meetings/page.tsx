import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const sections = [
  { title: 'Agenda', description: 'Topics and discussion order', icon: '≡' },
  { title: 'Participants', description: 'Attendees and ownership', icon: '◎' },
  { title: 'Notes & decisions', description: 'Meeting context and outcomes', icon: '▤' },
  { title: 'Action items & follow-up', description: 'Next steps and review dates', icon: '↗' },
]

export default async function MeetingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/meetings')

  return (
    <div className="workspace-enter mx-auto w-full max-w-7xl space-y-7">
      <header className="flex flex-col gap-5 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent">Workspace / Meetings</p>
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Meetings</h1><Badge variant="outline">Preview</Badge></div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Keep agendas, participants, decisions, and follow-up work together.</p>
        </div>
        <Button variant="primary" size="sm" disabled title="Meeting persistence is not connected yet">Schedule meeting unavailable</Button>
      </header>

      <Card className="glass-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><h2 className="text-base font-semibold">Meeting records aren’t connected</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted">No calendar or meeting data is available here. Scheduling and editing remain unavailable until persistence is implemented.</p></div>
        <Badge variant="muted">No synchronized events</Badge>
      </Card>

      <section aria-label="Meeting record sections" className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => <Card key={section.title} className="bg-surface p-5 sm:p-6"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl border border-border bg-background text-base text-accent" aria-hidden="true">{section.icon}</span><Badge variant="muted">Unavailable</Badge></div><h2 className="mt-5 text-sm font-semibold">{section.title}</h2><p className="mt-1 text-xs leading-5 text-muted">{section.description}</p><p className="mt-5 border-t border-border/80 pt-4 text-xs text-muted">Nothing to display until meeting data is connected.</p></Card>)}
      </section>
    </div>
  )
}
