'use client'

import { useState } from 'react'

type DashboardSection = 'Overview' | 'Activity' | 'Schedule'

const sections: DashboardSection[] = ['Overview', 'Activity', 'Schedule']

const activityItems = [
  { title: 'Published a new article', detail: 'Building better developer workflows', time: 'Just now', mark: 'A' },
  { title: 'Saved a discussion', detail: 'Patterns for resilient API clients', time: '2h ago', mark: 'D' },
  { title: 'Updated your profile', detail: 'Added a new area of focus', time: 'Yesterday', mark: 'P' },
]

function WorkspaceIcon({ section }: { section: DashboardSection }) {
  const paths: Record<DashboardSection, string> = {
    Overview: 'M3.75 3.75h6.5v6.5h-6.5zM13.75 3.75h6.5v6.5h-6.5zM3.75 13.75h6.5v6.5h-6.5zM13.75 13.75h6.5v6.5h-6.5z',
    Activity: 'M3 12h4l2.5-7 5 14 2.5-7h4',
    Schedule: 'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1z',
  }

  return (
    <svg aria-hidden="true" className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[section]} />
    </svg>
  )
}

function SectionNavigation({
  activeSection,
  onSelect,
  className = '',
  compact = false,
}: {
  activeSection: DashboardSection
  onSelect: (section: DashboardSection) => void
  className?: string
  compact?: boolean
}) {
  return (
    <nav aria-label="Preview workspace sections" className={className}>
      {sections.map((section) => (
        <button
          key={section}
          type="button"
          aria-pressed={activeSection === section}
          onClick={() => onSelect(section)}
          className={`flex items-center rounded-lg py-2 text-xs font-medium transition-colors ${
            compact ? 'w-full justify-center gap-1.5 px-1.5 text-[10px]' : 'w-full gap-2.5 px-3 text-left'
          } ${
            activeSection === section
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <WorkspaceIcon section={section} />
          {section}
          {section === 'Activity' && (
            <span className={`${compact ? '' : 'ml-auto'} rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] text-blue-700`}>3</span>
          )}
        </button>
      ))}
    </nav>
  )
}

function ActivityList() {
  return (
    <ol className="divide-y divide-slate-100">
      {activityItems.map((item) => (
        <li key={item.title} className="flex items-start gap-3 px-4 py-3.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-50 text-[10px] font-semibold text-blue-700">
            {item.mark}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-800">{item.title}</p>
            <p className="mt-1 truncate text-[11px] text-slate-500">{item.detail}</p>
          </div>
          <time className="shrink-0 pt-0.5 text-[10px] text-slate-400">{item.time}</time>
        </li>
      ))}
    </ol>
  )
}

function OverviewContent({ onSchedule }: { onSchedule: () => void }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500">Articles you’ve authored</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-semibold tracking-tight text-slate-900">12</p>
            <span className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-blue-600" aria-hidden="true">↗</span>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">Your ideas, all in one place</div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500">Workspace status</p>
          <p className="mt-3 text-base font-semibold text-slate-800">You’re all caught up</p>
          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">Pick up where you left off across writing, learning, and community.</p>
          <button type="button" onClick={onSchedule} className="mt-3 text-[11px] font-medium text-blue-600 hover:text-blue-700">
            See what’s next <span aria-hidden="true">→</span>
          </button>
        </article>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(220px,.8fr)]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-xs font-semibold text-slate-800">Recent activity</h3>
            <span className="text-[10px] text-slate-400">Latest updates</span>
          </div>
          <ActivityList />
        </section>
        <section className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-800">Your schedule</h3>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-500">Make space for your next big idea.</p>
          </div>
          <button type="button" onClick={onSchedule} className="mt-5 w-fit text-[11px] font-medium text-blue-600 hover:text-blue-700">
            Open calendar <span aria-hidden="true">→</span>
          </button>
        </section>
      </div>
    </>
  )
}

function ActivityContent() {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-xs font-semibold text-slate-800">Your latest updates</h3>
        <p className="mt-1 text-[11px] text-slate-500">A demo of the activity timeline in your workspace.</p>
      </div>
      <ActivityList />
    </section>
  )
}

function ScheduleContent() {
  const events = [
    { time: '10:00', title: 'Focus time', detail: 'Make progress on your next article' },
    { time: '13:30', title: 'Community check-in', detail: 'Catch up on saved discussions' },
    { time: '16:00', title: 'Weekly review', detail: 'Reflect on what you’ve learned' },
  ]

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-xs font-semibold text-slate-800">A day with room to think</h3>
        <p className="mt-1 text-[11px] text-slate-500">Example commitments shown in this live preview.</p>
      </div>
      <ol className="divide-y divide-slate-100">
        {events.map((event) => (
          <li key={event.time} className="flex items-start gap-4 px-4 py-4">
            <time className="w-10 shrink-0 pt-0.5 font-mono text-[10px] text-blue-600">{event.time}</time>
            <div className="border-l-2 border-blue-100 pl-3">
              <p className="text-xs font-medium text-slate-800">{event.title}</p>
              <p className="mt-1 text-[11px] text-slate-500">{event.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function DashboardPreview() {
  const [activeSection, setActiveSection] = useState<DashboardSection>('Overview')

  return (
    <section
      id="workspace-preview"
      aria-label="Interactive preview of the Commun workspace"
      className="mx-auto max-w-[1100px] overflow-hidden rounded-t-[22px] border border-white/90 bg-white shadow-[0_35px_90px_-50px_rgba(30,64,175,0.5)]"
    >
      <div className="flex h-11 items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-5">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-slate-200" />
          <span className="size-2 rounded-full bg-slate-200" />
          <span className="size-2 rounded-full bg-slate-200" />
        </div>
        <span className="hidden font-mono text-[10px] text-slate-400 sm:block">commun.dev / workspace</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[9px] font-medium text-emerald-700">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          Live preview
        </span>
      </div>

      <div className="grid min-h-[420px] grid-cols-1 md:grid-cols-[172px_minmax(0,1fr)] lg:min-h-[480px]">
        <aside className="hidden border-r border-slate-100 bg-white p-3.5 md:flex md:flex-col">
          <p className="mb-1 px-2.5 font-mono text-[8px] font-medium uppercase tracking-[0.18em] text-slate-400">Your workspace</p>
          <SectionNavigation activeSection={activeSection} onSelect={setActiveSection} className="space-y-1" />
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="px-2.5 font-mono text-[8px] font-medium uppercase tracking-[0.18em] text-slate-400">Your library</p>
            <div className="mt-2 space-y-1 px-2.5 text-[11px] text-slate-500">
              <p className="py-1">Saved items</p>
              <p className="py-1">Your profile</p>
            </div>
          </div>
          <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-4">
            <span className="grid size-7 place-items-center rounded-full bg-blue-50 text-[9px] font-semibold text-blue-700">C</span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium text-slate-700">Commun member</p>
              <p className="text-[9px] text-slate-400">Demo workspace</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 bg-slate-50/60 p-3.5 sm:p-5 lg:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <p className="font-mono text-[8px] font-medium uppercase tracking-[0.18em] text-slate-400">Personal workspace <span className="mx-1.5">/</span> Today</p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">Welcome to your workspace</h2>
              <p className="mt-1 text-[11px] text-slate-500">A clear place to pick up where you left off.</p>
            </div>
            <span className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-medium text-slate-500 sm:inline-flex">
              Notifications <span className="ml-2 font-semibold text-slate-800">2</span>
            </span>
          </div>

          <div className="mb-3 mt-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-800">{activeSection === 'Overview' ? 'Your workspace' : activeSection}</h3>
              <p className="mt-1 text-[10px] text-slate-500">
                {activeSection === 'Overview' ? 'A quick look at your creative work.' : `A closer look at your ${activeSection.toLowerCase()}.`}
              </p>
            </div>
            <div className="mt-3 md:hidden">
              <SectionNavigation activeSection={activeSection} onSelect={setActiveSection} className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-white p-1" compact />
            </div>
          </div>

          <div className="transition-opacity duration-200" key={activeSection}>
            {activeSection === 'Overview' && <OverviewContent onSchedule={() => setActiveSection('Schedule')} />}
            {activeSection === 'Activity' && <ActivityContent />}
            {activeSection === 'Schedule' && <ScheduleContent />}
          </div>
          <p className="mt-3 text-right font-mono text-[8px] text-slate-400">Illustrative demo data · interact with the sidebar</p>
        </main>
      </div>
    </section>
  )
}
