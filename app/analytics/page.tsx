import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/analytics')

  const [{ data: events, error: eventsError }, { count: eventCount, error: countError }] = await Promise.all([
    supabase.from('product_events').select('id,event_name,path,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(12),
    supabase.from('product_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])
  const activityUnavailable = Boolean(eventsError || countError)

  return (
    <div className="workspace-enter mx-auto w-full max-w-7xl space-y-7">
      <header className="flex flex-col gap-5 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent">Workspace / Analytics</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Activity analytics</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">A record of your workspace events. Delivery and task metrics aren’t available without task data.</p>
        </div>
        <Badge variant={activityUnavailable ? 'muted' : 'outline'}>{activityUnavailable ? 'Activity unavailable' : 'From your event log'}</Badge>
      </header>

      <Card className="glass-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted">Recorded activity</p><p className="mt-2 text-2xl font-semibold">{activityUnavailable ? 'Unavailable' : eventCount ?? 'Unavailable'}</p><p className="mt-1 text-xs text-muted">Events recorded for your account</p></div>
        <div className="max-w-sm text-sm leading-6 text-muted">No cycle-time, sprint, or completion figures are shown because those task records are not connected.</div>
      </Card>

      <section aria-labelledby="activity-title">
        <div className="mb-4"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted">Event log</p><h2 id="activity-title" className="mt-1 text-lg font-semibold">Recent activity</h2></div>
        <Card className="overflow-hidden bg-surface p-0">
          {activityUnavailable ? <p role="alert" className="p-6 text-sm text-muted">Activity could not be loaded. Try again later.</p> : events?.length ? <ol className="divide-y divide-border/80">{events.map((event) => <li key={event.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"><div><p className="text-sm font-medium capitalize">{event.event_name.replaceAll('_', ' ')}</p>{event.path && <p className="mt-1 truncate font-mono text-[10px] text-muted">{event.path}</p>}</div><time className="text-xs text-muted" dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time></li>)}</ol> : <div className="p-8 text-center"><p className="text-sm font-semibold">No activity recorded yet</p><p className="mt-2 text-xs text-muted">Events you generate while using Commun will appear here.</p></div>}
        </Card>
      </section>
    </div>
  )
}
