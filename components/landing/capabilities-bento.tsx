'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'

const capabilities = [
  {
    id: 'workspaces',
    title: 'Isolated Workspaces',
    description:
      'Organize business units, projects, and cohorts in dedicated spaces with customizable access controls and clean boundaries.',
    badge: 'Structure',
    colSpan: 'col-span-1 md:col-span-2',
    icon: '🏢',
    preview: (
      <div className="mt-4 rounded-xl border border-border bg-surface p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Global Operations Workspace</span>
          <span className="font-mono text-[10px] text-accent">Active</span>
        </div>
        <div className="flex gap-2 text-[11px] text-muted">
          <span className="rounded bg-border/60 px-2 py-0.5">8 Departments</span>
          <span className="rounded bg-border/60 px-2 py-0.5">Enterprise Role-Based Access</span>
        </div>
      </div>
    ),
  },
  {
    id: 'projects-tasks',
    title: 'Projects & Tasks',
    description:
      'Break high-level organizational goals into structured tasks, milestones, owners, and clear deliverables.',
    badge: 'Execution',
    colSpan: 'col-span-1',
    icon: '📋',
    preview: (
      <div className="mt-4 rounded-xl border border-border bg-surface p-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Sprint Deliverable</span>
          <span className="font-mono text-[10px] text-emerald-400">On Track</span>
        </div>
        <div className="w-full bg-border rounded-full h-1.5">
          <div className="bg-emerald-400 h-1.5 rounded-full w-4/5" />
        </div>
      </div>
    ),
  },
  {
    id: 'collaboration',
    title: 'Focused Team Collaboration',
    description:
      'Async discussions, contextual comments, and shared workspace visibility without communication chaos.',
    badge: 'Teamwork',
    colSpan: 'col-span-1',
    icon: '👥',
    preview: (
      <div className="mt-4 rounded-xl border border-border bg-surface p-3">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-brand-indigo/30 flex items-center justify-center font-mono text-[10px] text-brand-indigo">
            SC
          </div>
          <div className="text-xs">
            <span className="font-medium text-foreground">Sarah C.</span>
            <p className="text-[10px] text-muted">Reviewed sprint requirements</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'notes',
    title: 'Actionable Meeting Notes',
    description:
      'Capture agendas, meeting minutes, and decisions with directly linked action items and task ownership.',
    badge: 'Alignment',
    colSpan: 'col-span-1 md:col-span-2',
    icon: '📝',
    preview: (
      <div className="mt-4 rounded-xl border border-border bg-surface p-3 space-y-1.5">
        <p className="text-xs font-semibold text-foreground">Operational Alignment Summary</p>
        <p className="text-[11px] text-muted">
          Decisions recorded · 4 tasks delegated · Next review on Friday
        </p>
      </div>
    ),
  },
  {
    id: 'knowledge',
    title: 'Knowledge Management',
    description:
      'Build a durable, searchable institutional memory. Document standards, SOPs, architectural records, and guides.',
    badge: 'Memory',
    colSpan: 'col-span-1 md:col-span-2',
    icon: '📚',
    preview: (
      <div className="mt-4 rounded-xl border border-border bg-surface p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[11px] text-accent">docs / architecture / rbac.md</span>
          <span className="text-[10px] text-muted">v2.4</span>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          Validated governance rules and row-level access specifications.
        </p>
      </div>
    ),
  },
  {
    id: 'learning',
    title: 'Structured Learning Workflows',
    description:
      'Design structured onboarding tracks, skill progression paths, and curated learning roadmaps for your team.',
    badge: 'Growth',
    colSpan: 'col-span-1',
    icon: '🎯',
    preview: (
      <div className="mt-4 rounded-xl border border-border bg-surface p-3 space-y-2">
        <span className="font-mono text-[10px] text-brand-emerald">Level 2 Progression</span>
        <div className="text-xs font-medium text-foreground">Modern System Security & Threat Modeling</div>
      </div>
    ),
  },
  {
    id: 'productivity',
    title: 'Productivity & Progress Tracking',
    description:
      'High-signal clarity on what has been accomplished, what is in flight, and where bottlenecks occur—free of vanity metrics.',
    badge: 'Visibility',
    colSpan: 'col-span-1 md:col-span-3',
    icon: '📊',
    preview: (
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        <div className="rounded-lg border border-border bg-background p-2.5">
          <span className="font-mono text-[10px] text-muted uppercase">Milestones Reached</span>
          <p className="text-lg font-bold text-foreground">Milestones</p>
          <span className="text-[10px] text-muted">Example progress view</span>
        </div>
        <div className="rounded-lg border border-border bg-background p-2.5">
          <span className="font-mono text-[10px] text-muted uppercase">Context Continuity</span>
          <p className="text-lg font-bold text-foreground">Meeting context</p>
          <span className="text-[10px] text-muted">Decisions stay with the work</span>
        </div>
        <div className="rounded-lg border border-border bg-background p-2.5">
          <span className="font-mono text-[10px] text-muted uppercase">Knowledge Reuse</span>
          <p className="text-lg font-bold text-foreground">Knowledge library</p>
          <span className="text-[10px] text-muted">Keep useful references together</span>
        </div>
      </div>
    ),
  },
]

export function CapabilitiesBento() {
  return (
    <section className="py-20 md:py-28 border-y border-border/80 bg-surface/30" id="capabilities">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="accent" className="mb-4">
            Unified SaaS Architecture
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Everything your team needs to move work forward.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            Rather than jumping between disconnected tools for tasks, documentation, and notes,
            Commun coordinates your entire workflow in one structured workspace.
          </p>
        </div>

        {/* Symmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {capabilities.map((item) => (
            <div
              key={item.id}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card hover:border-border-strong hover:bg-surface transition-all duration-300 flex flex-col justify-between ${item.colSpan}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl" aria-hidden="true">
                    {item.icon}
                  </span>
                  <Badge variant="outline">{item.badge}</Badge>
                </div>
                <h3 className="text-lg font-semibold text-foreground tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {item.description}
                </p>
              </div>

              {item.preview}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

