'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type View = 'day' | 'week' | 'month'
const dayMs = 24 * 60 * 60 * 1000

function startOfWeek(date: Date) {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  day.setDate(day.getDate() - day.getDay())
  return day
}

function sameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function CalendarWorkspace() {
  const [view, setView] = useState<View>('week')
  const [today] = useState(() => {
    const current = new Date()
    current.setHours(0, 0, 0, 0)
    return current
  })
  const [selected, setSelected] = useState<Date>(today)

  const visibleDays = useMemo(() => {
    if (view === 'day') return [selected]
    if (view === 'week') return Array.from({ length: 7 }, (_, index) => new Date(startOfWeek(selected).getTime() + index * dayMs))
    const first = new Date(selected.getFullYear(), selected.getMonth(), 1)
    const start = startOfWeek(first)
    const count = Math.ceil((new Date(selected.getFullYear(), selected.getMonth() + 1, 0).getDate() + first.getDay()) / 7) * 7
    return Array.from({ length: count }, (_, index) => new Date(start.getTime() + index * dayMs))
  }, [selected, view])

  const heading = view === 'day'
      ? selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : view === 'week'
        ? `${startOfWeek(selected).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date(startOfWeek(selected).getTime() + 6 * dayMs).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
        : selected.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  function move(amount: number) {
    const next = new Date(selected)
    if (view === 'day') next.setDate(next.getDate() + amount)
    else if (view === 'week') next.setDate(next.getDate() + amount * 7)
    else next.setMonth(next.getMonth() + amount)
    setSelected(next)
  }

  return (
    <div className="workspace-enter mx-auto w-full max-w-7xl space-y-7">
      <header className="flex flex-col gap-5 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent">Workspace / Schedule</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Calendar</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Review your schedule by day, week, or month. Events aren’t connected to this workspace yet.</p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">Events unavailable</span>
      </header>

      <section aria-label="Calendar" className="space-y-4">
        <div className="glass-surface flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => move(-1)} aria-label="Previous period" className="grid size-10 place-items-center rounded-xl border border-border bg-surface text-muted transition hover:border-accent/40 hover:text-foreground">‹</button>
            <button type="button" onClick={() => setSelected(new Date(today))} className="h-10 rounded-xl border border-border bg-surface px-3 text-xs font-medium text-foreground transition hover:border-accent/40">Today</button>
            <button type="button" onClick={() => move(1)} aria-label="Next period" className="grid size-10 place-items-center rounded-xl border border-border bg-surface text-muted transition hover:border-accent/40 hover:text-foreground">›</button>
            <h2 aria-live="polite" className="ml-2 text-sm font-semibold sm:ml-4 sm:text-base">{heading}</h2>
          </div>
          <div role="group" aria-label="Calendar view" className="inline-flex w-fit rounded-xl border border-border bg-surface p-1">
            {(['day', 'week', 'month'] as const).map((item) => (
              <button key={item} type="button" aria-pressed={view === item} onClick={() => setView(item)} className={cn('min-h-9 rounded-lg px-3 text-xs font-medium capitalize transition-colors', view === item ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface-hover hover:text-foreground')}>{item}</button>
            ))}
          </div>
        </div>

        <div key={`${view}-${selected.toDateString()}`} className="calendar-view-enter">
        {view === 'month' ? (
          <Card className="overflow-hidden bg-surface p-3 sm:p-5">
            <div className="grid grid-cols-7 border-b border-border/80 pb-2 text-center font-mono text-[9px] uppercase text-muted sm:text-[10px]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
              {visibleDays.map((date) => {
                const inMonth = selected.getMonth() === date.getMonth()
                const active = sameDate(selected, date)
                return <button key={date.toISOString()} type="button" onClick={() => setSelected(date)} aria-pressed={Boolean(active)} aria-label={date.toLocaleDateString(undefined, { dateStyle: 'full' })} className={cn('flex min-h-12 flex-col items-center justify-center rounded-lg border text-xs transition-colors sm:min-h-16 sm:items-start sm:justify-start sm:p-2', active ? 'border-accent/35 bg-accent/10 font-semibold text-accent' : 'border-transparent text-foreground hover:border-border hover:bg-surface-hover', !inMonth && 'text-subtle opacity-55')}>
                  <span>{date.getDate()}</span>
                  {today && sameDate(today, date) && <span className="mt-1 hidden text-[9px] font-normal text-accent sm:inline">Today</span>}
                </button>
              })}
            </div>
            <p className="mt-4 rounded-xl border border-dashed border-border bg-background/70 p-4 text-center text-xs text-muted">No event records are available for this month.</p>
          </Card>
        ) : (
          <div className={cn('grid gap-3', view === 'week' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1')}>
            {visibleDays.map((date) => (
              <button key={date.toISOString()} type="button" onClick={() => setSelected(date)} aria-pressed={sameDate(selected, date)} className="text-left">
                  <Card className={cn('h-full min-h-40 bg-surface p-4 transition-colors hover:border-accent/35', sameDate(selected, date) && 'border-accent/40 bg-accent/[.035]')}>
                  <div className="flex items-center justify-between gap-3 border-b border-border/80 pb-3">
                    <div><p className="text-xs font-semibold">{date.toLocaleDateString(undefined, { weekday: 'long' })}</p><p className="mt-1 font-mono text-[10px] text-muted">{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p></div>
                    {today && sameDate(today, date) && <span className="rounded-full bg-accent/10 px-2 py-1 text-[9px] font-medium text-accent">Today</span>}
                  </div>
                  <p className="py-8 text-center text-xs text-muted">No event records</p>
                </Card>
              </button>
            ))}
          </div>
        )}
        </div>
      </section>
    </div>
  )
}
