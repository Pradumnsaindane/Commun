import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function TasksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/tasks')

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
            <span className="text-xs text-muted">My Tasks</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Task Management & Kanban
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Track deliverables, assign task owners, set priorities, and monitor sprint flow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline">Phase 2 Preview</Badge>
          <Button variant="primary" size="sm">
            + Create Task
          </Button>
        </div>
      </div>

      {/* View Switcher Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent border border-accent/25"
          >
            📋 Board View
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-foreground hover:bg-surface"
          >
            📑 List View
          </button>
        </div>

        <div className="text-[11px] font-mono text-muted">
          Database: <code className="text-accent">public.tasks</code>
        </div>
      </div>

      {/* Kanban Board Columns (Honest Zero-State Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* To Do */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <span className="font-mono text-xs uppercase font-semibold text-muted">To Do</span>
            <span className="rounded bg-surface px-2 py-0.5 text-[10px] text-muted">0</span>
          </div>
          <div className="rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted">
            No pending tasks
          </div>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <span className="font-mono text-xs uppercase font-semibold text-accent">In Progress</span>
            <span className="rounded bg-accent/20 px-2 py-0.5 text-[10px] text-accent">0</span>
          </div>
          <div className="rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted">
            No active tasks
          </div>
        </div>

        {/* In Review */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <span className="font-mono text-xs uppercase font-semibold text-brand-indigo">In Review</span>
            <span className="rounded bg-surface px-2 py-0.5 text-[10px] text-muted">0</span>
          </div>
          <div className="rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted">
            No tasks in review
          </div>
        </div>

        {/* Done */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <span className="font-mono text-xs uppercase font-semibold text-emerald-400">Done</span>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">0</span>
          </div>
          <div className="rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted">
            0 completed
          </div>
        </div>
      </div>

      <Card className="p-4 bg-surface/50 border-border/80 text-xs text-muted flex items-center justify-between">
        <span>Task assignment and live state mutation are scheduled for Phase 3 integration.</span>
        <span className="font-mono text-[11px] text-accent">Phase 3 Ready</span>
      </Card>
    </div>
  )
}

