'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { QuickActionsModal } from '@/components/workspace/quick-actions-modal'

export interface ProductivityDashboardProps {
  profile: {
    display_name: string
    username: string | null
    bio: string | null
    avatar_url: string | null
  }
  userEmail: string
  recentActivity: Array<{
    id: string
    event_name: string
    path: string | null
    created_at: string
  }>
  unreadNotificationsCount: number
  myArticlesCount: number
}

export function ProductivityDashboard({
  profile,
  userEmail,
  recentActivity,
  unreadNotificationsCount,
  myArticlesCount,
}: ProductivityDashboardProps) {
  const [quickActionOpen, setQuickActionOpen] = useState(false)
  const displayName = profile.display_name || userEmail.split('@')[0]
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div className="workspace-enter mx-auto w-full max-w-7xl space-y-8">
      <header className="flex flex-col gap-5 border-b border-border/80 pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-muted">PERSONAL WORKSPACE <span className="mx-1.5 text-border-strong">/</span> {formattedDate}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{greeting}, {displayName}</h1>
          <p className="mt-2 text-sm text-muted">A clear place to pick up where you left off.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/notifications" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-foreground transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent" aria-label={`${unreadNotificationsCount} unread notifications`}>
            <span aria-hidden="true">◌</span><span>Notifications</span>
            {unreadNotificationsCount > 0 && <span className="min-w-5 rounded-full bg-accent/10 px-1.5 py-0.5 text-center text-xs font-medium text-accent">{unreadNotificationsCount}</span>}
          </Link>
          <Button variant="primary" size="sm" onClick={() => setQuickActionOpen(true)}>Work management status</Button>
        </div>
      </header>

      <section aria-labelledby="workspace-status-heading">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <div><h2 id="workspace-status-heading" className="text-base font-semibold">Your workspace</h2><p className="mt-1 text-sm text-muted">Live content available to your account.</p></div>
          <Link href="/write" className="text-sm font-medium text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent">Go to writing <span aria-hidden="true">→</span></Link>
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="border-border bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-medium text-muted">Articles you’ve authored</p><p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">{myArticlesCount}</p></div>
              <span className="grid size-10 place-items-center rounded-lg border border-border bg-surface text-accent" aria-hidden="true">↗</span>
            </div>
            <div className="mt-5 border-t border-border/80 pt-3"><Link href="/profile/me" className="text-sm text-muted hover:text-foreground">View your profile <span aria-hidden="true">→</span></Link></div>
          </Card>
          <Card className="flex flex-col justify-between border-border bg-card p-5 sm:p-6">
            <div><p className="text-sm font-medium text-muted">Tasks and projects</p><h3 className="mt-3 text-lg font-semibold">Work management isn’t connected yet</h3><p className="mt-2 max-w-lg text-sm leading-6 text-muted">Task and project records aren’t available to this workspace, so there’s nothing to count or display here.</p></div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-border/80 pt-4">
              <Link href="/tasks" className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:border-border-strong hover:bg-surface-hover">Task board</Link>
              <Link href="/projects" className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:border-border-strong hover:bg-surface-hover">Projects</Link>
            </div>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,.8fr)]">
        <section aria-labelledby="activity-heading">
          <div className="mb-3 flex items-baseline justify-between gap-3"><div><h2 id="activity-heading" className="text-base font-semibold">Recent activity</h2><p className="mt-1 text-sm text-muted">Your latest workspace events.</p></div><span className="text-xs text-muted">Last 5 events</span></div>
          <Card className="border-border bg-card">
            {recentActivity.length > 0 ? <ol className="divide-y divide-border/80">
              {recentActivity.map((event) => <li key={event.id} className="flex gap-3 px-4 py-4 sm:px-5">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <div className="min-w-0 flex-1"><p className="text-sm font-medium capitalize text-foreground">{event.event_name.replace(/_/g, ' ')}</p>{event.path && <p className="mt-1 truncate text-xs text-muted">{event.path}</p>}</div>
                <time className="shrink-0 pt-0.5 text-xs tabular-nums text-muted" dateTime={event.created_at}>{new Date(event.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</time>
              </li>)}
            </ol> : <div className="px-5 py-10"><p className="text-sm font-medium">No recent activity</p><p className="mt-1 text-sm text-muted">Events will appear here as you use Commun.</p></div>}
          </Card>
        </section>

        <section aria-labelledby="schedule-heading">
          <div className="mb-3"><h2 id="schedule-heading" className="text-base font-semibold">Schedule</h2><p className="mt-1 text-sm text-muted">Upcoming time commitments.</p></div>
          <Card className="flex min-h-48 flex-col justify-between border-border bg-card p-5">
            <div><div className="flex items-center gap-2 text-sm font-medium"><span className="text-accent" aria-hidden="true">◷</span> Calendar data unavailable</div><p className="mt-2 text-sm leading-6 text-muted">Events aren’t connected to persistent workspace records yet.</p></div>
            <Link href="/calendar" className="mt-6 inline-flex w-fit items-center text-sm font-medium text-accent hover:underline">Open calendar <span className="ml-1" aria-hidden="true">→</span></Link>
          </Card>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border/80 bg-surface/70 px-4 py-3 text-sm"><span className="text-muted">Unread notifications</span><strong className="font-semibold tabular-nums">{unreadNotificationsCount}</strong></div>
        </section>
      </div>

      <QuickActionsModal isOpen={quickActionOpen} onClose={() => setQuickActionOpen(false)} />
    </div>
  )
}
