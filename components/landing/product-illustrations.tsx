'use client'

import React, { type CSSProperties, type KeyboardEvent, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const productAreas = [
  {
    id: 'work',
    number: '01',
    category: 'WORK MANAGEMENT',
    title: 'Projects & tasks',
    summary: 'Give initiatives, priorities, and next steps a clear place to live.',
    details: ['Project context', 'Task stages', 'Priority and ownership'],
  },
  {
    id: 'meetings',
    number: '02',
    category: 'MEETING CONTEXT',
    title: 'Meetings & notes',
    summary: 'Keep agendas, decisions, and follow-up notes together.',
    details: ['Agenda', 'Decisions', 'Follow-up notes'],
  },
  {
    id: 'knowledge',
    number: '03',
    category: 'KNOWLEDGE & LEARNING',
    title: 'Knowledge & learning',
    summary: 'Make useful references and learning material easier to return to.',
    details: ['Knowledge library', 'Learning plans', 'Saved references'],
  },
] as const

export function ProductIllustrations() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null)
  const cardButtons = useRef<Array<HTMLButtonElement | null>>([])
  const activeIndex = hoveredIndex ?? pinnedIndex

  const handleCardKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'Escape') {
      setHoveredIndex(null)
      setPinnedIndex(null)
      event.currentTarget.blur()
      return
    }

    const nextKeys = ['ArrowRight', 'ArrowDown']
    const previousKeys = ['ArrowLeft', 'ArrowUp']
    if (nextKeys.includes(event.key) || previousKeys.includes(event.key)) {
      event.preventDefault()
      const step = nextKeys.includes(event.key) ? 1 : -1
      const nextIndex = (index + step + productAreas.length) % productAreas.length
      cardButtons.current[nextIndex]?.focus()
      return
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const nextIndex = event.key === 'Home' ? 0 : productAreas.length - 1
      cardButtons.current[nextIndex]?.focus()
    }
  }

  return (
    <section className="relative overflow-hidden py-20 md:py-32" id="illustrations">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <Badge variant="emerald" className="mb-4">Interactive workspace</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Crafted for how modern teams actually work.
          </h2>
          <p className="mt-4 text-base text-muted sm:text-lg">
            Explore the connected areas that bring daily work, decisions, and shared knowledge together.
          </p>
        </div>

        <div className="fey-card-stack mx-auto max-w-5xl" data-scroll-spring>
          <p className="mb-5 text-center text-xs text-muted sm:text-sm">Choose an area to see how it fits into the workspace.</p>
          <div className="fey-card-stack__stage" role="group" aria-label="Commun product areas" data-scroll-item>
            {productAreas.map((area, index) => {
              const active = activeIndex === index
              const relativeIndex = activeIndex === null ? index - 1 : index - activeIndex
              const xOffset = active ? 0 : relativeIndex < 0 ? -64 : 64
              const idleOffset = index === 0 ? 46 : index === 1 ? 0 : 68
              const yOffset = active ? 4 : activeIndex === null ? idleOffset : 48 + Math.max(0, Math.abs(relativeIndex) - 1) * 18
              const cardStyle = {
                '--stack-x': `${xOffset}px`,
                '--stack-y': `${yOffset}px`,
                zIndex: active ? 10 : 5 - Math.abs(relativeIndex),
              } as CSSProperties

              return (
                <button
                  key={area.id}
                  ref={(element) => { cardButtons.current[index] = element }}
                  type="button"
                  className={cn('fey-card-stack__card', active && 'fey-card-stack__card--active')}
                  style={cardStyle}
                  aria-expanded={active}
                  aria-pressed={pinnedIndex === index}
                  aria-label={`${area.title}${pinnedIndex === index ? ', pinned' : ''}`}
                  onClick={() => setPinnedIndex((current) => current === index ? null : index)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={(event) => {
                    const nextTarget = event.relatedTarget
                    if (!(nextTarget instanceof Node && event.currentTarget.parentElement?.contains(nextTarget))) {
                      setHoveredIndex(null)
                    }
                  }}
                  onKeyDown={(event) => handleCardKeyDown(event, index)}
                >
                  <span className="fey-card-stack__topline">
                    <span className="fey-card-stack__index">{area.number}</span>
                    <span className="fey-card-stack__category">{area.category}</span>
                    <span className="fey-card-stack__indicator" aria-hidden="true" />
                  </span>
                  <span className="fey-card-stack__title">{area.title}</span>
                  <span className="fey-card-stack__summary">{area.summary}</span>
                  <span className="fey-card-stack__details" aria-hidden={!active}>
                    <span className="fey-card-stack__details-inner">
                      <span className="fey-card-stack__detail-label">A connected workspace can bring together</span>
                      <span className="fey-card-stack__detail-list">
                        {area.details.map((detail) => <span key={detail}>{detail}</span>)}
                      </span>
                    </span>
                  </span>
                  <span className="fey-card-stack__hint">
                    {pinnedIndex === index ? 'Pinned · click to unpin' : active ? 'Click to pin this view' : 'Select to explore'}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-4 text-center text-[11px] text-muted">Illustrative interface · no live workspace records shown</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="p-6">
            <span className="font-mono text-xs uppercase tracking-wider text-accent">Workflow path</span>
            <h3 className="mt-2 text-lg font-bold text-foreground">From meeting to measurable output</h3>
            <p className="mt-1 text-xs text-muted">Commun connects stages of team delivery in one workspace.</p>
            <div className="mt-6 flex flex-col items-center justify-between gap-3 text-center sm:flex-row">
              <div className="w-full flex-1 rounded-xl border border-border bg-surface p-3 sm:w-auto">
                <span className="text-base" aria-hidden="true">📝</span>
                <p className="mt-1 text-xs font-semibold text-foreground">1. Meeting notes</p>
                <p className="text-[10px] text-muted">Capture key decisions</p>
              </div>
              <span className="rotate-90 font-mono text-base text-accent sm:rotate-0" aria-hidden="true">→</span>
              <div className="w-full flex-1 rounded-xl border border-border bg-surface p-3 sm:w-auto">
                <span className="text-base" aria-hidden="true">📋</span>
                <p className="mt-1 text-xs font-semibold text-foreground">2. Assign tasks</p>
                <p className="text-[10px] text-muted">Delegate ownership</p>
              </div>
              <span className="rotate-90 font-mono text-base text-accent sm:rotate-0" aria-hidden="true">→</span>
              <div className="w-full flex-1 rounded-xl border border-border bg-surface p-3 sm:w-auto">
                <span className="text-base" aria-hidden="true">📚</span>
                <p className="mt-1 text-xs font-semibold text-foreground">3. Knowledge base</p>
                <p className="text-[10px] text-muted">Archive best practices</p>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-emerald-400">Platform reliability</span>
                <Badge variant="emerald" dot>Resilient architecture</Badge>
              </div>
              <h3 className="mt-2 text-lg font-bold text-foreground">Secure & available enterprise backbone</h3>
              <p className="mt-1 text-xs text-muted">Enterprise data isolation, resilient uptime, and replication across team workspaces.</p>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">📁</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Enterprise organization tree</p>
                  <p className="text-[10px] text-muted">Row-level access boundaries</p>
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
