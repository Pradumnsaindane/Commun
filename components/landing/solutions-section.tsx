'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const solutions = [
  {
    id: 'corporate-teams',
    label: 'Corporate Teams',
    icon: '🏢',
    headline: 'Unified execution and alignment across departments',
    summary:
      'Eliminate the friction of siloed projects. Commun gives cross-functional teams a shared source of truth for quarterly initiatives, cross-team handoffs, and documentation.',
    benefits: [
      'Centralized project boards linked to company-wide strategic objectives.',
      'Durable knowledge base preserving operational standards across team turnover.',
      'Zero communication sprawl: meeting agendas, decisions, and tasks live in context.',
    ],
  },
  {
    id: 'managers',
    label: 'Managers & Leaders',
    icon: '👔',
    headline: 'Clear workflow visibility without micromanagement',
    summary:
      'Keep your team focused on highest-leverage deliverables. Know where projects stand, unblock dependencies quickly, and run high-efficiency 1-on-1s and sprint reviews.',
    benefits: [
      'High-signal milestone tracking without interrupting deep focus time.',
      'Actionable 1-on-1 and sync agendas that automatically track agreed follow-ups.',
      'Accurate delivery timelines based on real task statuses, not guesswork.',
    ],
  },
  {
    id: 'learning-professionals',
    label: 'L&D Professionals',
    icon: '🎓',
    headline: 'Structured onboarding and continuous team upskilling',
    summary:
      'Integrate professional development into the actual flow of work. Design structured training curriculums, employee onboarding sequences, and internal playbooks.',
    benefits: [
      'Step-by-step onboarding sequences with embedded checkpoints and checklists.',
      'Centralized repository for corporate playbooks, policies, and process guides.',
      'Track cohort progression and certification milestones in one place.',
    ],
  },
  {
    id: 'individual-pros',
    label: 'Individual Professionals',
    icon: '💻',
    headline: 'Personal clarity, disciplined focus, and professional output',
    summary:
      'Organize your personal deliverables, research notes, and professional milestones with a distraction-free, privacy-conscious workspace.',
    benefits: [
      'Capture fleeting thoughts, research summaries, and task lists instantly.',
      'Structure personal goals, deadlines, and multi-week projects calmly.',
      'Durable personal knowledge vault accessible whenever you switch contexts.',
    ],
  },
  {
    id: 'students-learners',
    label: 'Students & Working Learners',
    icon: '📚',
    headline: 'Master complex subjects and organize academic coursework',
    summary:
      'Bring coursework, study schedules, lecture notes, and group project collaboration together in an orderly, distraction-free environment.',
    benefits: [
      'Organize coursework, syllabi, reading lists, and assignment due dates.',
      'Collaborate on group research projects without losing version history.',
      'Build an evolving library of summaries and study guides for exams and interviews.',
    ],
  },
]

export function SolutionsSection() {
  const [selectedId, setSelectedId] = useState('corporate-teams')
  const current = solutions.find((s) => s.id === selectedId) || solutions[0]

  return (
    <section className="py-20 md:py-32 border-y border-border/80 bg-surface/30" id="solutions">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="indigo" className="mb-4">
            Tailored Applications
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Solutions designed for how you work.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            Whether leading an enterprise organization, coordinating a business team, or mastering
            a new discipline, Commun adapts to your operational needs.
          </p>
        </div>

        {/* Audience Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {solutions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={cn(
                'rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border',
                selectedId === item.id
                  ? 'border-accent bg-accent/15 text-accent shadow-sm'
                  : 'border-border bg-card text-muted hover:text-foreground hover:bg-surface'
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Selected Solution Showcase */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 lg:p-12 shadow-card max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{current.icon}</span>
            <span className="font-mono text-xs text-accent uppercase tracking-wider font-semibold">
              {current.label} Use Case
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
            {current.headline}
          </h3>
          <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
            {current.summary}
          </p>

          <div className="mt-8 pt-6 border-t border-border/80">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono mb-4">
              Key Capabilities For This Role
            </h4>
            <ul className="space-y-3">
              {current.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="size-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

