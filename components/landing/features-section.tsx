'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'

const featureBlocks = [
  {
    category: 'Work Management',
    title: 'Precision Task & Project Orchestration',
    description:
      'Break high-level roadmaps into actionable sprints, subtasks, milestones, and deliverables with status tracking and owner assignments.',
    skeleton: (
      <div className="space-y-2.5">
        <div className="h-4 w-3/4 bg-border/80 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-accent/20 rounded" />
          <div className="h-6 w-24 bg-border rounded" />
          <div className="h-6 w-16 bg-emerald-500/20 rounded" />
        </div>
        <div className="h-10 w-full bg-surface rounded-lg border border-border p-2 flex items-center justify-between">
          <span className="text-xs text-foreground">Launch production cluster v2</span>
          <span className="text-[10px] text-accent font-mono">Assigned</span>
        </div>
      </div>
    ),
  },
  {
    category: 'Meeting & Decisions',
    title: 'Contextual Meeting Records with Bound Tasks',
    description:
      'Never lose another decision in a chat scroll. Turn meeting outcomes directly into tracked action items with clear ownership.',
    skeleton: (
      <div className="space-y-2.5">
        <div className="h-4 w-1/2 bg-border/80 rounded animate-pulse" />
        <div className="rounded-lg border border-border bg-surface p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-accent" />
            <span className="text-xs font-semibold text-foreground">Weekly Executive Sync</span>
          </div>
          <div className="h-3 w-5/6 bg-border/60 rounded" />
          <div className="h-3 w-2/3 bg-border/60 rounded" />
        </div>
      </div>
    ),
  },
  {
    category: 'Knowledge Hub',
    title: 'Institutional Knowledge & Standard Operating Procedures',
    description:
      'Markdown-native documents, searchable architecture decision records (ADRs), runbooks, and team wikis stored safely with full revision logs.',
    skeleton: (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-border/80 pb-2">
          <span className="font-mono text-[10px] text-brand-indigo">docs/deployments.md</span>
          <span className="font-mono text-[10px] text-muted">v1.8</span>
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-border/60 rounded" />
          <div className="h-3 w-4/5 bg-border/60 rounded" />
          <div className="h-3 w-3/5 bg-border/60 rounded" />
        </div>
      </div>
    ),
  },
  {
    category: 'Skill Growth',
    title: 'Cohort & Individual Learning Tracks',
    description:
      'Structure curriculum, learning goals, and certification milestones directly alongside daily work so teams continuously upskill.',
    skeleton: (
      <div className="space-y-2.5">
        <div className="flex justify-between text-xs">
          <span className="text-foreground font-medium">Cloud Architecture Certification</span>
          <span className="text-accent font-mono">80%</span>
        </div>
        <div className="h-2 w-full bg-border rounded-full overflow-hidden">
          <div className="h-full bg-accent w-4/5" />
        </div>
        <div className="flex justify-between text-[10px] text-muted font-mono">
          <span>Module 4 of 5</span>
          <span>Next: Security Audit</span>
        </div>
      </div>
    ),
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-32" id="features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4">
            Engineered For Depth
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Built for serious operational clarity.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            Commun cuts through the noise of superficial productivity tools with robust,
            purpose-built capabilities.
          </p>
        </div>

        {/* Feature Cards with Horizontal Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featureBlocks.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card flex flex-col justify-between hover:border-border-strong transition-all"
            >
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold">
                  {feature.category}
                </span>
                <h3 className="mt-3 text-xl font-bold text-foreground tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Horizontal Skeleton Illustration */}
              <div className="mt-8 rounded-xl border border-border bg-background p-4">
                {feature.skeleton}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

