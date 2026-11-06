import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const collections = [
  { title: 'Architecture records', description: 'Decisions, trade-offs, and system context', icon: '⌘' },
  { title: 'Runbooks', description: 'Operational guidance and response steps', icon: '▤' },
  { title: 'Team playbooks', description: 'Standards, onboarding, and shared practice', icon: '◇' },
]

export default async function KnowledgePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/knowledge')

  return (
    <div className="workspace-enter mx-auto w-full max-w-7xl space-y-7">
      <header className="flex flex-col gap-5 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent">Workspace / Knowledge</p>
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Knowledge</h1><Badge variant="outline">Preview</Badge></div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">A searchable home for the documents and decisions your team relies on.</p>
        </div>
        <Button variant="primary" size="sm" disabled title="Knowledge document persistence is not connected yet">New document unavailable</Button>
      </header>

      <Card className="glass-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 className="text-base font-semibold">The document library isn’t connected</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted">No knowledge documents are loaded here. Document creation and search are unavailable until storage is connected.</p></div><Badge variant="muted">Data unavailable</Badge></Card>

      <section aria-labelledby="knowledge-collections-title">
        <div className="mb-4"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted">Library structure</p><h2 id="knowledge-collections-title" className="mt-1 text-lg font-semibold">Collections</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          {collections.map((item) => <Card key={item.title} className="interactive-surface bg-surface p-5"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl border border-border bg-background text-base text-accent" aria-hidden="true">{item.icon}</span><Badge variant="muted">Unavailable</Badge></div><h3 className="mt-5 text-sm font-semibold">{item.title}</h3><p className="mt-1 text-xs leading-5 text-muted">{item.description}</p><p className="mt-5 border-t border-border/80 pt-4 text-xs text-muted">No documents loaded</p></Card>)}
        </div>
      </section>
    </div>
  )
}
