import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function MeetingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/meetings')

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/80 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs text-accent uppercase tracking-wider font-semibold">
              Workspace
            </span>
            <span className="text-muted text-xs">/</span>
            <span className="text-xs text-muted">Meetings</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Meetings & Work Syncs
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Coordinate team agendas, record decisions, and bind action items directly to tasks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline">Phase 2 Preview</Badge>
          <Button variant="primary" size="sm">
            + Schedule Meeting
          </Button>
        </div>
      </div>

      <Card className="p-12 text-center border-dashed border-border/90 bg-card/60">
        <div className="mx-auto size-14 rounded-2xl border border-border bg-surface flex items-center justify-center text-2xl text-muted">
          🗓️
        </div>
        <h3 className="mt-5 text-base font-semibold text-foreground">
          No meetings scheduled in this workspace
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
          The meetings and action items tables (<code className="font-mono text-accent text-xs">public.meetings</code> and <code className="font-mono text-accent text-xs">public.meeting_action_items</code>)
          are specified in the proposed schema.
        </p>

        <div className="mt-8 rounded-xl border border-border/80 bg-surface/70 p-4 max-w-lg mx-auto text-left text-xs space-y-2">
          <p className="font-semibold text-foreground">Key Meeting Features Scheduled for Phase 3:</p>
          <ul className="list-disc pl-4 text-muted space-y-1">
            <li>Direct inline conversion of meeting discussion points into assigned workspace tasks.</li>
            <li>Collaborative agenda drafting with attendee RSVP status.</li>
            <li>Searchable archive of past decisions to prevent duplicate debates.</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

