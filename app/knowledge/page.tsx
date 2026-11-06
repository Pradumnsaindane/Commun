import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function KnowledgePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/knowledge')

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/80 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs text-accent uppercase tracking-wider font-semibold">
              Workspace
            </span>
            <span className="text-muted text-xs">/</span>
            <span className="text-xs text-muted">Knowledge</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Knowledge Base & SOPs
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Searchable institutional memory: architecture decision records, runbooks, and guidelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline">Phase 2 Preview</Badge>
          <Button variant="primary" size="sm">
            + New Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xl">🏛️</span>
          <h3 className="mt-2 text-sm font-semibold text-foreground">Architecture Records</h3>
          <p className="mt-1 text-xs text-muted">Formal ADRs documenting design choices</p>
          <span className="mt-3 inline-block font-mono text-[10px] text-muted">0 documents</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xl">📖</span>
          <h3 className="mt-2 text-sm font-semibold text-foreground">Operational Runbooks</h3>
          <p className="mt-1 text-xs text-muted">Standard incident response protocols</p>
          <span className="mt-3 inline-block font-mono text-[10px] text-muted">0 documents</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xl">📜</span>
          <h3 className="mt-2 text-sm font-semibold text-foreground">Team Playbooks</h3>
          <p className="mt-1 text-xs text-muted">Onboarding, standards, and workflow guides</p>
          <span className="mt-3 inline-block font-mono text-[10px] text-muted">0 documents</span>
        </div>
      </div>

      <Card className="p-8 text-center border-dashed border-border/90 bg-card/60">
        <h4 className="text-sm font-semibold text-foreground">
          Knowledge Base Engine Staged for Phase 3
        </h4>
        <p className="mt-1 text-xs text-muted max-w-md mx-auto">
          Schema: <code className="font-mono text-accent text-xs">public.knowledge_documents</code> with versioning, markdown formatting, and full-text workspace search.
        </p>
      </Card>
    </div>
  )
}

