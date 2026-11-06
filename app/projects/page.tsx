import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/projects')

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/80 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs text-accent uppercase tracking-wider font-semibold">
              Workspace
            </span>
            <span className="text-muted text-xs">/</span>
            <span className="text-xs text-muted">Projects</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Projects & Roadmaps
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Manage high-level company initiatives, milestones, and deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline">Phase 2 Preview</Badge>
          <Button variant="primary" size="sm">
            + New Project
          </Button>
        </div>
      </div>

      {/* Filter & View Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent border border-accent/25"
          >
            All Projects (0)
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-foreground hover:bg-surface"
          >
            Active
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-foreground hover:bg-surface"
          >
            Completed
          </button>
        </div>

        <div className="text-[11px] font-mono text-muted">
          Database: <code className="text-accent">public.projects</code>
        </div>
      </div>

      {/* Honest Empty State */}
      <Card className="p-12 text-center border-dashed border-border/90 bg-card/60">
        <div className="mx-auto size-14 rounded-2xl border border-border bg-surface flex items-center justify-center text-2xl text-muted">
          📁
        </div>
        <h3 className="mt-5 text-base font-semibold text-foreground">
          No projects configured in this workspace
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
          The project orchestration table (<code className="font-mono text-accent text-xs">public.projects</code>)
          is defined in the proposed schema. Project creation and milestone persistence will be connected in Phase 3.
        </p>

        <div className="mt-8 rounded-xl border border-border/80 bg-surface/70 p-4 max-w-lg mx-auto text-left text-xs space-y-2">
          <p className="font-semibold text-foreground">Phase 3 Capabilities Staged:</p>
          <ul className="list-disc pl-4 text-muted space-y-1">
            <li>Multi-tenant project isolation tied to workspace membership.</li>
            <li>Milestone timelines with target delivery dates and ownership.</li>
            <li>Automatic rollup of linked task statuses and sprint deliverables.</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

