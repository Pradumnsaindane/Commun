'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const steps = [
  {
    step: '01',
    title: 'Create or join a workspace',
    description:
      'Set up a dedicated workspace for your company, department, or learning cohort with single sign-on and role-based permissions.',
    icon: '🏢',
    preview: {
      headline: 'Multi-Tenant Workspace Initialized',
      detail: 'Define your team domains, assign member roles (Owner, Admin, Member, Guest), and invite collaborators.',
      tag: 'Security & Access Control',
    },
  },
  {
    step: '02',
    title: 'Organize work and learning activities',
    description:
      'Structure ongoing projects, recurring deliverables, milestones, meeting notes, and structured curriculum paths in one place.',
    icon: '🗂️',
    preview: {
      headline: 'Unified Project & Track Hierarchies',
      detail: 'Categorize initiatives into actionable epics, associate sprint goals, and establish learning milestones.',
      tag: 'Structured Workflows',
    },
  },
  {
    step: '03',
    title: 'Collaborate and share knowledge',
    description:
      'Capture meeting outcomes directly into actionable tasks, build searchable documentation, and engage in asynchronous team discussions.',
    icon: '🤝',
    preview: {
      headline: 'Context-Rich Knowledge & Alignment',
      detail: 'Keep discussion threads attached to the relevant document or task, eliminating scattered conversations across chat apps.',
      tag: 'Async Collaboration',
    },
  },
  {
    step: '04',
    title: 'Track progress without micromanagement',
    description:
      'Monitor milestone achievements, task velocity, and learning progress with clear visibility into status and blocking dependencies.',
    icon: '📈',
    preview: {
      headline: 'High-Signal Progress Dashboard',
      detail: 'Accurate milestone timelines and deliverable completions without tedious status meetings or vanity metrics.',
      tag: 'Operational Clarity',
    },
  },
  {
    step: '05',
    title: 'Improve productivity and reclaim time',
    description:
      'Reduce context switching, eliminate lost action items, and focus energy on meaningful progress that moves projects forward.',
    icon: '⚡',
    preview: {
      headline: 'More Time for Meaningful Focus',
      detail: 'Fewer scattered notifications, unified documentation, and clear priorities give teams hours back every week.',
      tag: 'Time-Saving Impact',
    },
  },
]

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section className="py-20 md:py-32 border-b border-border/80 bg-surface/20" id="how-it-works">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="accent" className="mb-4">
            User Journey
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            How Commun transforms daily work.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            From setup to daily execution, follow the five-step path designed to organize
            information and elevate team productivity.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Step Selector List */}
          <div className="lg:col-span-5 space-y-3">
            {steps.map((item, index) => {
              const isSelected = activeStep === index
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={cn(
                    'w-full text-left rounded-2xl p-4 sm:p-5 border transition-all duration-200 flex items-start gap-4',
                    isSelected
                      ? 'border-accent bg-surface shadow-md ring-1 ring-accent'
                      : 'border-border/70 bg-card hover:border-border hover:bg-surface/50'
                  )}
                >
                  <span
                    className={cn(
                      'font-mono text-xs font-bold px-2 py-1 rounded-md shrink-0',
                      isSelected
                        ? 'bg-accent text-background'
                        : 'bg-surface text-muted border border-border'
                    )}
                  >
                    {item.step}
                  </span>
                  <div>
                    <h3
                      className={cn(
                        'text-base font-semibold transition-colors',
                        isSelected ? 'text-accent' : 'text-foreground'
                      )}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-muted leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Interactive Step Preview Stage */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-2xl overflow-hidden min-h-[380px] flex flex-col justify-between">
              {/* Subtle ambient accent background glow */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-3xl" aria-hidden="true">
                    {steps[activeStep].icon}
                  </span>
                  <Badge variant="accent">{steps[activeStep].preview.tag}</Badge>
                </div>

                <span className="font-mono text-xs text-muted">
                  STAGE {steps[activeStep].step} OF 05
                </span>
                <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-foreground">
                  {steps[activeStep].preview.headline}
                </h3>
                <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
                  {steps[activeStep].preview.detail}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-border/80 flex items-center justify-between">
                <span className="font-mono text-xs text-muted">
                  Commun Workflow Pipeline
                </span>
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'size-2 rounded-full transition-all',
                        i === activeStep ? 'bg-accent w-6' : 'bg-border'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

