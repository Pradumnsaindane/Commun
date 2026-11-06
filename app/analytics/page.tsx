import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/analytics')

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/80 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs text-accent uppercase tracking-wider font-semibold">
              Workspace
            </span>
            <span className="text-muted text-xs">/</span>
            <span className="text-xs text-muted">Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Productivity & Delivery Analytics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            High-signal focus, completion velocity, and bottleneck detection free of vanity metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline">Verified Zero-Data</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <span className="font-mono text-xs uppercase text-muted">Cycle Time</span>
          <div className="mt-2 text-2xl font-bold text-foreground">—</div>
          <p className="mt-1 text-xs text-muted">Awaiting Phase 3 task completions</p>
        </Card>
        <Card className="p-5">
          <span className="font-mono text-xs uppercase text-muted">Sprint Velocity</span>
          <div className="mt-2 text-2xl font-bold text-foreground">0%</div>
          <p className="mt-1 text-xs text-muted">No active sprint deliverables</p>
        </Card>
        <Card className="p-5">
          <span className="font-mono text-xs uppercase text-muted">Context Continuity</span>
          <div className="mt-2 text-2xl font-bold text-foreground">—</div>
          <p className="mt-1 text-xs text-muted">Awaiting meeting notes tracking</p>
        </Card>
      </div>

      <Card className="p-8 text-center border-dashed border-border/90 bg-card/60">
        <h3 className="text-sm font-semibold text-foreground">
          Real Productivity Analytics (Phase 4)
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
          In alignment with Commun’s integrity requirements, statistics are calculated exclusively
          from durable event logs and completed tasks. Fake metrics and simulated percentages are never generated.
        </p>
      </Card>
    </div>
  )
}

