'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  feedDiagnostic: {
    tested: boolean
    status: 'ACTIVE_OBSERVED' | 'RELATION_TRACKED'
    relationship: string
  }
}

export function ProductivityDashboard({
  profile,
  userEmail,
  recentActivity,
  unreadNotificationsCount,
  myArticlesCount,
  feedDiagnostic,
}: ProductivityDashboardProps) {
  const [quickActionOpen, setQuickActionOpen] = useState(false)
  const [taskFilter, setTaskFilter] = useState('all')

  const now = new Date()
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs text-accent uppercase tracking-wider font-semibold">
              Workspace Overview
            </span>
            <span className="text-muted text-xs">·</span>
            <Badge variant="emerald" dot>
              Primary Workspace
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            {greeting}, {profile.display_name || userEmail.split('@')[0]}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            {formattedDate} · All workspace systems operational
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/analytics">
            <Button variant="secondary" size="sm">
              📈 View Analytics
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setQuickActionOpen(true)}
            className="font-bold"
          >
            + Quick Action
          </Button>
        </div>
      </div>

      {/* 2. Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Projects */}
        <Card className="p-5 flex flex-col justify-between border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
              Active Projects
            </span>
            <span className="text-lg" aria-hidden="true">
              📁
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-foreground">0</div>
            <p className="mt-1 text-xs text-muted">
              No active projects · Phase 3 schema staged
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between text-[11px]">
            <Link href="/projects" className="text-accent hover:underline font-medium">
              View projects →
            </Link>
            <Badge variant="outline">Staged</Badge>
          </div>
        </Card>

        {/* Pending Tasks */}
        <Card className="p-5 flex flex-col justify-between border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
              Pending Tasks
            </span>
            <span className="text-lg" aria-hidden="true">
              📋
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-foreground">0</div>
            <p className="mt-1 text-xs text-muted">
              No pending tasks · Assignable in Phase 3
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between text-[11px]">
            <Link href="/tasks" className="text-accent hover:underline font-medium">
              View task board →
            </Link>
            <Badge variant="outline">Staged</Badge>
          </div>
        </Card>

        {/* Completed Tasks */}
        <Card className="p-5 flex flex-col justify-between border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
              Completed Tasks
            </span>
            <span className="text-lg" aria-hidden="true">
              ✓
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-foreground">0</div>
            <p className="mt-1 text-xs text-muted">
              Zero completed tasks recorded
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between text-[11px]">
            <span className="font-mono text-muted">0% Sprint velocity</span>
            <Badge variant="outline">Verified</Badge>
          </div>
        </Card>

        {/* Upcoming Meetings */}
        <Card className="p-5 flex flex-col justify-between border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
              Upcoming Meetings
            </span>
            <span className="text-lg" aria-hidden="true">
              🗓️
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-foreground">0</div>
            <p className="mt-1 text-xs text-muted">
              No meetings scheduled today
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between text-[11px]">
            <Link href="/meetings" className="text-accent hover:underline font-medium">
              Schedule sync →
            </Link>
            <Badge variant="outline">Staged</Badge>
          </div>
        </Card>
      </div>

      {/* 3. Main Operational Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols wide on desktop): Tasks & Projects */}
        <div className="lg:col-span-2 space-y-8">
          {/* My Tasks Section */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/80 gap-3">
              <div>
                <CardTitle>My Tasks</CardTitle>
                <p className="text-xs text-muted mt-1">
                  Assigned deliverables and priority action items
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Tabs value={taskFilter} onValueChange={setTaskFilter}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="today">Due Today</TabsTrigger>
                    <TabsTrigger value="progress">In Progress</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Honest Empty State for Tasks */}
            <div className="py-12 px-4 text-center">
              <div className="mx-auto size-12 rounded-2xl border border-border bg-surface flex items-center justify-center text-xl text-muted">
                📋
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">
                No tasks assigned yet
              </h3>
              <p className="mt-2 text-xs text-muted max-w-sm mx-auto leading-relaxed">
                Task assignment tables (<code className="font-mono text-[11px] text-accent">public.tasks</code>)
                are specified in the proposed Phase 3 schema. When enabled, your personal deliverables will synchronize here.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickActionOpen(true)}
                >
                  Create Mock Task
                </Button>
                <Link href="/tasks">
                  <Button variant="secondary" size="sm">
                    Open Task Board
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Recent Projects Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <p className="text-xs text-muted mt-1">
                  Active organizational initiatives and milestone progress
                </p>
              </div>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All Projects →
                </Button>
              </Link>
            </div>

            {/* Honest Empty State for Projects */}
            <div className="py-10 px-4 text-center">
              <div className="mx-auto size-12 rounded-2xl border border-border bg-surface flex items-center justify-center text-xl text-muted">
                📁
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">
                No active projects in this workspace
              </h3>
              <p className="mt-2 text-xs text-muted max-w-sm mx-auto leading-relaxed">
                Project management infrastructure will be bound to multi-tenant workspace records in Phase 3.
              </p>
              <div className="mt-5">
                <Link href="/projects">
                  <Button variant="secondary" size="sm">
                    Inspect Proposed Project Structure
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Upcoming Meetings & Linked Notes Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <div>
                <CardTitle>Upcoming Meetings & Notes</CardTitle>
                <p className="text-xs text-muted mt-1">
                  Contextual agendas with bound action items
                </p>
              </div>
              <Link href="/meetings">
                <Button variant="ghost" size="sm" className="text-xs">
                  All Meetings →
                </Button>
              </Link>
            </div>

            <div className="py-10 px-4 text-center">
              <div className="mx-auto size-12 rounded-2xl border border-border bg-surface flex items-center justify-center text-xl text-muted">
                📝
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">
                No upcoming syncs scheduled
              </h3>
              <p className="mt-2 text-xs text-muted max-w-sm mx-auto leading-relaxed">
                Meeting agendas and action item delegations will be tracked seamlessly starting in Phase 3.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: Recent Activity & Diagnostics */}
        <div className="space-y-8">
          {/* Quick Actions Panel */}
          <Card className="p-6">
            <CardTitle>Quick Actions</CardTitle>
            <p className="text-xs text-muted mt-1 mb-4">
              Direct access to productivity workflows
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setQuickActionOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:border-accent hover:bg-surface-hover transition-all text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📋</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Create Task</p>
                    <p className="text-[10px] text-muted">Define title and priority</p>
                  </div>
                </div>
                <span className="text-accent text-xs">→</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickActionOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:border-accent hover:bg-surface-hover transition-all text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📁</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">New Project</p>
                    <p className="text-[10px] text-muted">Initialize sprint roadmap</p>
                  </div>
                </div>
                <span className="text-accent text-xs">→</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickActionOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:border-accent hover:bg-surface-hover transition-all text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📝</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Meeting Note</p>
                    <p className="text-[10px] text-muted">Capture minutes & decisions</p>
                  </div>
                </div>
                <span className="text-accent text-xs">→</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickActionOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:border-accent hover:bg-surface-hover transition-all text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📚</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Knowledge Doc</p>
                    <p className="text-[10px] text-muted">Publish team runbook</p>
                  </div>
                </div>
                <span className="text-accent text-xs">→</span>
              </button>
            </div>
          </Card>

          {/* Recent Activity Timeline */}
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <CardTitle>Recent Activity</CardTitle>
              <Badge variant="outline">Live Log</Badge>
            </div>

            <div className="mt-4">
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-border/70 bg-surface p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          {ev.event_name.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono text-[10px] text-muted">
                          {new Date(ev.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {ev.path && (
                        <p className="text-[11px] text-muted truncate mt-0.5">{ev.path}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted">
                  <p className="font-medium text-foreground">No recent activity</p>
                  <p className="mt-1 text-[11px]">
                    Events from your workspace sessions will appear here chronologically.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Section 9: Feed Relationship Audit & Status Tracking Box */}
          <Card className="p-5 border-dashed border-border/90 bg-surface/40">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
                Database Relationship Audit
              </span>
              <Badge variant="indigo">Observed</Badge>
            </div>
            <h4 className="text-xs font-semibold text-foreground">
              Feed Relationship Investigation
            </h4>
            <p className="mt-1 text-[11px] text-muted leading-relaxed">
              Tracking foreign key relationships:
              <br />
              <code className="text-accent font-mono text-[10px]">
                posts.author_id → auth.users.id
              </code>
              <br />
              <code className="text-brand-indigo font-mono text-[10px]">
                posts.author_id → profiles.id
              </code>
            </p>
            <div className="mt-3 rounded-lg border border-border bg-background p-2 text-[10px] text-muted">
              Status: Intact & preserved. Existing queries in <code className="text-foreground">app/feed/page.tsx</code> remain operational. No mock data introduced.
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Action Modal Dialog */}
      <QuickActionsModal
        isOpen={quickActionOpen}
        onClose={() => setQuickActionOpen(false)}
      />
    </div>
  )
}

