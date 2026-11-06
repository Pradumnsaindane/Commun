import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function LearningPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/learning')

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/80 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs text-accent uppercase tracking-wider font-semibold">
              Workspace
            </span>
            <span className="text-muted text-xs">/</span>
            <span className="text-xs text-muted">Learning</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Structured Learning & Tracks
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Design onboarding curriculums, technical skill tracks, and team certifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline">Phase 2 Preview</Badge>
          <Button variant="primary" size="sm">
            + Create Track
          </Button>
        </div>
      </div>

      <Card className="p-12 text-center border-dashed border-border/90 bg-card/60">
        <div className="mx-auto size-14 rounded-2xl border border-border bg-surface flex items-center justify-center text-2xl text-muted">
          🎯
        </div>
        <h3 className="mt-5 text-base font-semibold text-foreground">
          No learning tracks enrolled in this workspace
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
          The learning tracks and progression tables (<code className="font-mono text-accent text-xs">public.learning_tracks</code> and <code className="font-mono text-accent text-xs">public.learning_enrollments</code>)
          are scheduled for Phase 4 implementation.
        </p>

        <div className="mt-6">
          <Button variant="secondary" size="sm">
            Preview Learning Modules (Phase 4)
          </Button>
        </div>
      </Card>
    </div>
  )
}

