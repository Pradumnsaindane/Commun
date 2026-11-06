'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Hero() {
  const [activeTab, setActiveTab] = useState<'projects' | 'notes' | 'knowledge' | 'learning'>('projects')

  return (
    <section className="relative overflow-hidden pt-8 pb-20 md:pt-16 md:pb-32" id="product">
      {/* Background Lighting & Beams */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />

        {/* Ambient radial glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-accent/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[450px] h-[350px] bg-brand-indigo/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[300px] bg-brand-emerald/10 blur-[130px] rounded-full pointer-events-none" />

        {/* Subtle glowing collision beam lines */}
        <svg
          className="absolute inset-0 h-full w-full opacity-30"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="hsl(24, 94%, 53%)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <line
            x1="10%"
            y1="0"
            x2="90%"
            y2="100%"
            stroke="url(#beamGradient)"
            strokeWidth="1.5"
            strokeDasharray="120 400"
            className="animate-beam-dash"
          />
          <line
            x1="90%"
            y1="0"
            x2="20%"
            y2="100%"
            stroke="url(#beamGradient)"
            strokeWidth="1"
            strokeDasharray="90 350"
            className="animate-beam-dash"
          />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Release / Positioning Pill */}
        <div className="inline-flex items-center gap-2 mb-8">
          <Badge variant="accent" dot>
            Next-Gen SaaS Work Management
          </Badge>
          <span className="hidden sm:inline font-mono text-xs text-muted">
            One workspace. Better work. More time.
          </span>
        </div>

        {/* Hero Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.08]">
          Work smarter. Learn faster.{' '}
          <span className="bg-gradient-to-r from-accent via-orange-400 to-amber-300 bg-clip-text text-transparent">
            Make time for what matters.
          </span>
        </h1>

        {/* Supporting Message */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg lg:text-xl text-muted leading-relaxed">
          Commun helps professionals and teams organize their work, collaborate effectively,
          manage knowledge, and make more time for meaningful progress.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto px-8 font-bold">
              Get started free <span className="ml-1 text-base">→</span>
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto px-6">
              Explore how it works
            </Button>
          </a>
        </div>

        {/* Live Workspace UI Preview Frame (MacBook & Desktop Inspiration) */}
        <div className="mt-16 sm:mt-20 mx-auto max-w-5xl">
          <div className="relative rounded-2xl sm:rounded-3xl border border-border bg-card/90 p-2 sm:p-4 shadow-2xl backdrop-blur-xl">
            {/* Window title bar */}
            <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-500/80" />
                <span className="size-3 rounded-full bg-yellow-500/80" />
                <span className="size-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 hidden sm:inline font-mono text-[11px] text-muted">
                  Commun Workspace / Enterprise Engineering & Operations
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="emerald" dot>
                  Live Workspace
                </Badge>
              </div>
            </div>

            {/* Interactive Workspace View Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-4 py-3 bg-surface/50">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('projects')}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                    activeTab === 'projects'
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'text-muted hover:text-foreground'
                  )}
                >
                  📁 Projects & Tasks
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                    activeTab === 'notes'
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'text-muted hover:text-foreground'
                  )}
                >
                  📝 Meeting & Work Notes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('knowledge')}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                    activeTab === 'knowledge'
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'text-muted hover:text-foreground'
                  )}
                >
                  📚 Knowledge Base
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('learning')}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                    activeTab === 'learning'
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'text-muted hover:text-foreground'
                  )}
                >
                  🎯 Learning Tracks
                </button>
              </div>
              <span className="font-mono text-[10px] text-muted hidden md:inline">
                Synced in real-time
              </span>
            </div>

            {/* Interactive Tab Content Display */}
            <div className="p-4 sm:p-6 text-left">
              {activeTab === 'projects' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Q4 Infrastructure & Reliability Initiative
                      </h3>
                      <p className="text-xs text-muted">
                        3 teams collaborating · 14 tasks in progress · 8 completed
                      </p>
                    </div>
                    <Badge variant="indigo">Sprint 42</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border bg-surface p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted uppercase">To Do</span>
                        <span className="text-[10px] rounded bg-border px-1.5 py-0.5 text-muted">3</span>
                      </div>
                      <div className="rounded-lg border border-border/80 bg-background p-2.5 shadow-sm">
                        <p className="text-xs font-medium text-foreground">Multi-region database replica failover plan</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-muted">
                          <span>High Priority</span>
                          <span>Nov 12</span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/80 bg-background p-2.5 shadow-sm">
                        <p className="text-xs font-medium text-foreground">Service Level Objectives definition</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-muted">
                          <span>Team Docs</span>
                          <span>Nov 14</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-surface p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-accent uppercase">In Progress</span>
                        <span className="text-[10px] rounded bg-accent/20 text-accent px-1.5 py-0.5">2</span>
                      </div>
                      <div className="rounded-lg border border-accent/30 bg-background p-2.5 shadow-sm">
                        <p className="text-xs font-medium text-foreground">Automated rate-limiting policy audit</p>
                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="text-accent font-medium">In Review</span>
                          <span className="text-muted">Assigned: Elena R.</span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/80 bg-background p-2.5 shadow-sm">
                        <p className="text-xs font-medium text-foreground">Real-time alert dispatch integration</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-muted">
                          <span>In Development</span>
                          <span>Assigned: Marcus K.</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-surface p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-emerald-400 uppercase">Completed</span>
                        <span className="text-[10px] rounded bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5">8</span>
                      </div>
                      <div className="rounded-lg border border-border/80 bg-background p-2.5 opacity-80">
                        <p className="text-xs font-medium text-muted line-through">Security key rotation runbook</p>
                        <span className="mt-2 block text-[10px] text-emerald-400">✓ Verified in staging</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Executive Alignment & Weekly Operations
                      </h3>
                      <p className="text-xs text-muted">Recorded with linked task follow-ups and action ownership</p>
                    </div>
                    <Badge variant="accent">Action Items Linked</Badge>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted pb-2 border-b border-border/60">
                      <span>Attendees: Product Leadership, Staff Engineers, Operations Lead</span>
                      <span>Nov 5, 2026</span>
                    </div>
                    <p className="text-xs text-foreground font-medium">Key Decisions & Architectural Agreement:</p>
                    <ul className="text-xs text-muted space-y-1.5 pl-4 list-disc">
                      <li>Consolidate task coordination and sprint retrospectives into Commun workspaces.</li>
                      <li>Standardize all engineering runbooks and onboarding tracks under the shared knowledge engine.</li>
                      <li>Assign task ownership directly inside meeting notes to avoid lost context.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'knowledge' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Engineering Architecture & Operational Runbooks
                      </h3>
                      <p className="text-xs text-muted">Searchable institutional memory with verified ownership</p>
                    </div>
                    <Badge variant="indigo">Verified Doc</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-surface p-4">
                      <span className="font-mono text-[10px] text-brand-indigo uppercase">Handbook</span>
                      <h4 className="mt-1 text-sm font-semibold text-foreground">Production Incident Response Protocol</h4>
                      <p className="mt-1 text-xs text-muted">Clear escalation matrices, war-room setup, and post-mortem guidelines.</p>
                      <div className="mt-3 flex items-center justify-between text-[10px] text-muted">
                        <span>Updated 2 days ago</span>
                        <span>Owner: Reliability Team</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-4">
                      <span className="font-mono text-[10px] text-emerald-400 uppercase">Architecture</span>
                      <h4 className="mt-1 text-sm font-semibold text-foreground">Multi-Tenant Tenant Isolation Model</h4>
                      <p className="mt-1 text-xs text-muted">Row-level security enforcement and data sovereignty specifications.</p>
                      <div className="mt-3 flex items-center justify-between text-[10px] text-muted">
                        <span>Updated 5 days ago</span>
                        <span>Owner: Security Architecture</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'learning' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Team Learning & Skill Progression Path
                      </h3>
                      <p className="text-xs text-muted">Structured internal learning tracks with measurable milestones</p>
                    </div>
                    <Badge variant="emerald">75% Completed</Badge>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">Distributed Systems & Consensus Algorithms</h4>
                      <span className="font-mono text-xs text-accent">Module 3 of 4</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full w-3/4" />
                    </div>
                    <p className="text-xs text-muted">Current chapter: Raft consensus log replication in high-throughput clusters.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom status bar */}
            <div className="flex items-center justify-between border-t border-border/80 px-4 py-2.5 bg-surface/30 font-mono text-[10px] text-muted">
              <span>● Commun Enterprise Cloud</span>
              <span>Encrypted at rest & in transit</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

