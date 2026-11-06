'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function ProductIllustrations() {
  const [activeTaskIndex, setActiveTaskIndex] = useState(0)
  const [deviceView, setDeviceView] = useState<'macbook' | 'iphone'>('macbook')

  const tasks = [
    { title: 'Define workspace authorization roles', state: 'Done', assignee: 'Alex K.' },
    { title: 'Draft engineering onboarding playbook', state: 'In Progress', assignee: 'Elena R.' },
    { title: 'Publish quarterly roadmap review', state: 'Review', assignee: 'Marcus T.' },
  ]

  return (
    <section className="py-20 md:py-32 relative overflow-hidden" id="illustrations">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="emerald" className="mb-4">
            Interactive SaaS Mechanics
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Crafted for how modern teams actually work.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            Explore the responsive workflows, collaboration features, and structured documents
            built into Commun.
          </p>
        </div>

        {/* Device Showcase Switcher */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-xl border border-border bg-surface p-1.5 gap-2">
            <button
              type="button"
              onClick={() => setDeviceView('macbook')}
              className={cn(
                'rounded-lg px-4 py-2 text-xs font-semibold transition-all',
                deviceView === 'macbook'
                  ? 'bg-accent/15 text-accent border border-accent/30 shadow-sm'
                  : 'text-muted hover:text-foreground'
              )}
            >
              💻 Desktop & MacBook Experience
            </button>
            <button
              type="button"
              onClick={() => setDeviceView('iphone')}
              className={cn(
                'rounded-lg px-4 py-2 text-xs font-semibold transition-all',
                deviceView === 'iphone'
                  ? 'bg-accent/15 text-accent border border-accent/30 shadow-sm'
                  : 'text-muted hover:text-foreground'
              )}
            >
              📱 Mobile & On-the-Go App
            </button>
          </div>
        </div>

        {/* Device Illustration Container */}
        {deviceView === 'macbook' ? (
          <div className="mx-auto max-w-4xl relative">
            {/* MacBook Mockup Frame */}
            <div className="rounded-2xl border-4 border-border/80 bg-surface shadow-2xl p-3 sm:p-5">
              {/* Laptop Screen Top Camera Notch */}
              <div className="flex items-center justify-center pb-3">
                <span className="size-2 rounded-full bg-border" />
              </div>

              {/* Main Canvas with Collaborative Cursors */}
              <div className="relative rounded-xl border border-border bg-background p-6 min-h-[380px] overflow-hidden">
                {/* Collaborative Cursor 1 */}
                <div
                  className="absolute top-12 left-16 z-20 flex items-center gap-1.5 pointer-events-none transition-transform duration-700 animate-float-slow"
                >
                  <svg
                    className="size-4 text-accent fill-accent"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M3 3l7 18 3-7 7-3L3 3z" />
                  </svg>
                  <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-semibold text-background shadow">
                    Elena R. (Editing runbook)
                  </span>
                </div>

                {/* Collaborative Cursor 2 */}
                <div
                  className="absolute bottom-16 right-20 z-20 flex items-center gap-1.5 pointer-events-none transition-transform duration-1000 animate-float-slow"
                  style={{ animationDelay: '1.5s' }}
                >
                  <svg
                    className="size-4 text-brand-indigo fill-brand-indigo"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M3 3l7 18 3-7 7-3L3 3z" />
                  </svg>
                  <span className="rounded bg-brand-indigo px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                    Marcus T. (Assigning tasks)
                  </span>
                </div>

                {/* Header inside screen */}
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-accent">commun.</span>
                    <span className="text-xs text-muted">/ Engineering Operations / Sprint Overview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    <span className="font-mono text-[11px] text-emerald-400">Collaborating live</span>
                  </div>
                </div>

                {/* Interactive Task Cards Progression */}
                <div className="mt-6">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                    Interactive Task Cards (Click to inspect workflow)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {tasks.map((t, idx) => (
                      <button
                        key={t.title}
                        type="button"
                        onClick={() => setActiveTaskIndex(idx)}
                        className={cn(
                          'rounded-xl border p-3.5 text-left transition-all',
                          activeTaskIndex === idx
                            ? 'border-accent bg-accent/10 shadow-md ring-1 ring-accent'
                            : 'border-border bg-surface hover:border-border-strong'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-muted">{t.state}</span>
                          <span className="size-1.5 rounded-full bg-accent" />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-foreground">{t.title}</p>
                        <p className="mt-3 text-[10px] text-muted">Assigned to: {t.assignee}</p>
                      </button>
                    ))}
                  </div>

                  {/* Inspected card detail banner */}
                  <div className="mt-5 rounded-xl border border-border bg-surface/70 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Selected: {tasks[activeTaskIndex].title}
                      </span>
                      <Badge variant="accent">{tasks[activeTaskIndex].state}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Linked to knowledge document & sprint goals. All updates propagate to team members in real-time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* MacBook Bottom Base */}
            <div className="mx-auto w-[65%] h-3 rounded-b-xl bg-border/60 border-t border-border" />
          </div>
        ) : (
          <div className="mx-auto max-w-sm relative">
            {/* iPhone Mockup Frame */}
            <div className="rounded-[40px] border-[6px] border-border bg-surface p-4 shadow-2xl">
              {/* Dynamic Island */}
              <div className="mx-auto h-6 w-28 rounded-full bg-background flex items-center justify-center gap-2 mb-4 border border-border/80">
                <span className="size-2 rounded-full bg-accent animate-pulse-subtle" />
                <span className="text-[10px] font-mono text-muted">Task Active</span>
              </div>

              {/* Mobile Screen Content */}
              <div className="rounded-3xl border border-border bg-background p-4 min-h-[460px] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-accent">commun.</span>
                  <Badge variant="outline">Mobile Workspace</Badge>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-3.5 space-y-2">
                  <span className="font-mono text-[10px] text-muted uppercase">Today&apos;s Focus</span>
                  <p className="text-sm font-semibold text-foreground">Sprint Retrospective</p>
                  <p className="text-xs text-muted">2:00 PM · Linked meeting notes ready</p>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted uppercase">Assigned Tasks</span>
                    <span className="text-xs text-accent font-semibold">3 items</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="rounded-lg bg-background p-2 text-xs font-medium text-foreground">
                      ✓ System architecture review
                    </div>
                    <div className="rounded-lg bg-background p-2 text-xs font-medium text-foreground">
                      ⏳ Onboarding guide draft
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-3.5">
                  <span className="font-mono text-[10px] text-brand-indigo uppercase">Quick Note</span>
                  <p className="mt-1 text-xs text-muted">Sync with engineering leads at 4 PM.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Animated Workflow Path & System Uptime Indicator */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Animated Workflow Path */}
          <Card className="p-6">
            <span className="font-mono text-xs text-accent uppercase tracking-wider">Workflow Path</span>
            <h3 className="mt-2 text-lg font-bold text-foreground">From Meeting to Measurable Output</h3>
            <p className="mt-1 text-xs text-muted">
              Commun connects every stage of team delivery into a seamless, trackable stream.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
              <div className="rounded-xl border border-border bg-surface p-3 w-full sm:w-auto flex-1">
                <span className="text-base">📝</span>
                <p className="text-xs font-semibold text-foreground mt-1">1. Meeting Notes</p>
                <p className="text-[10px] text-muted">Capture key decisions</p>
              </div>
              <span className="text-accent font-mono text-base rotate-90 sm:rotate-0">→</span>
              <div className="rounded-xl border border-border bg-surface p-3 w-full sm:w-auto flex-1">
                <span className="text-base">📋</span>
                <p className="text-xs font-semibold text-foreground mt-1">2. Assign Tasks</p>
                <p className="text-[10px] text-muted">Delegate ownership</p>
              </div>
              <span className="text-accent font-mono text-base rotate-90 sm:rotate-0">→</span>
              <div className="rounded-xl border border-border bg-surface p-3 w-full sm:w-auto flex-1">
                <span className="text-base">📚</span>
                <p className="text-xs font-semibold text-foreground mt-1">3. Knowledge Base</p>
                <p className="text-[10px] text-muted">Archive best practices</p>
              </div>
            </div>
          </Card>

          {/* Folder & Dynamic Status Indicator */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-emerald-400 uppercase tracking-wider">
                  Platform Reliability
                </span>
                <Badge variant="emerald" dot>
                  99.98% Operational
                </Badge>
              </div>
              <h3 className="mt-2 text-lg font-bold text-foreground">Secure & Available Enterprise Backbone</h3>
              <p className="mt-1 text-xs text-muted">
                Enterprise data isolation, resilient uptime, and instant replication across team workspaces.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-surface p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📁</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Enterprise Organization Tree</p>
                  <p className="text-[10px] text-muted">Zero-leak row-level access boundaries</p>
                </div>
              </div>
              <span className="font-mono text-xs text-emerald-400">Encrypted</span>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

