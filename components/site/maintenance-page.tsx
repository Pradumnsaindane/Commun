/**
 * Temporary public Commun.dev website.
 *
 * This is a presentation-only, server-rendered page. It has no client state,
 * no data fetching and no dependency on the authenticated application shell.
 */

const updateAreas = [
  {
    title: 'Work management',
    description: 'Projects, tasks, and priorities with clear ownership.',
  },
  {
    title: 'Collaboration',
    description: 'Meetings, decisions, and follow-ups kept in context.',
  },
  {
    title: 'Shared knowledge',
    description: 'One dependable place for the reference material teams return to.',
  },
] as const

const workspaceColumns = [
  { label: 'Projects', rows: [68, 54, 62] },
  { label: 'Meetings', rows: [56, 70, 48] },
  { label: 'Knowledge', rows: [62, 50, 66] },
] as const

function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-mono text-[17px] font-semibold tracking-[-0.01em] text-foreground ${className}`}
    >
      commun<span className="text-accent">.</span>dev
    </span>
  )
}

function StatusDot() {
  return (
    <span
      aria-hidden="true"
      className="site-status-dot inline-block size-1.5 shrink-0 rounded-full bg-accent"
    />
  )
}

function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex min-h-[72px] w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Wordmark />

        <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:text-[11px]">
          <StatusDot />
          Platform update
        </p>
      </div>
    </header>
  )
}

function WorkspacePreview() {
  return (
    <figure>
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-xl border border-border bg-background shadow-[0_24px_56px_-46px_rgba(23,32,51,0.45)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-border" />
              <span className="size-2 rounded-full bg-border" />
              <span className="size-2 rounded-full bg-border" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              Commun workspace
            </span>
          </div>
          <span className="rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted sm:text-[10px]">
            Illustrative
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[164px_minmax(0,1fr)]">
          <div className="hidden border-r border-border p-4 sm:block">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
              Workspace
            </p>
            <div className="mt-4 space-y-3">
              {['Overview', 'Projects', 'Meetings', 'Knowledge'].map((item, index) => (
                <div key={item} className="flex items-center gap-2">
                  <span
                    className={`size-1.5 rounded-full ${
                      index === 0 ? 'bg-accent' : 'bg-border'
                    }`}
                  />
                  <span
                    className={`text-[11px] ${
                      index === 0 ? 'font-medium text-foreground' : 'text-muted'
                    }`}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-end justify-between gap-4 border-b border-border pb-3.5">
              <div className="space-y-2">
                <span className="block h-2 w-28 rounded-full bg-foreground/20" />
                <span className="block h-1.5 w-40 rounded-full bg-border" />
              </div>
              <span className="h-6 w-16 rounded-md border border-border bg-surface" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {workspaceColumns.map((column) => (
                <div
                  key={column.label}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                    {column.label}
                  </p>
                  <div className="mt-3 space-y-2.5">
                    {column.rows.map((width, rowIndex) => (
                      <div
                        key={`${column.label}-${rowIndex}`}
                        className={`rounded-md border border-border bg-surface px-2 py-2 ${
                          rowIndex > 0 ? 'hidden sm:block' : ''
                        }`}
                      >
                        <span
                          className="block h-1.5 rounded-full bg-foreground/15"
                          style={{ width: `${width}%` }}
                        />
                        <span className="mt-2 block h-1 w-10 rounded-full bg-border" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <figcaption className="mt-3 font-mono text-[10px] leading-relaxed tracking-[0.02em] text-muted sm:text-[11px]">
        Illustrative representation of the Commun workspace. No live data is shown.
      </figcaption>
    </figure>
  )
}

function SiteFooter() {
  return (
    <footer className="bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-12">
        <div>
          <Wordmark />
          <p className="mt-2 text-sm leading-relaxed text-muted">
            One workspace. Better work. More time.
          </p>
        </div>
        <p className="font-mono text-[10px] tracking-[0.06em] text-muted sm:text-[11px]">
          © 2026 Commun.dev. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main-content" className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-5 pt-14 sm:px-8 sm:pt-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16 xl:gap-24">
            <div className="site-enter">
              <p className="inline-flex items-center gap-2 rounded-full border border-site-accent/25 bg-accent/10 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-foreground sm:text-[11px]">
                <StatusDot />
                Platform update in progress
              </p>

              <h1 className="mt-7 max-w-[18ch] text-[clamp(2.25rem,4.4vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-foreground">
                We&rsquo;re building a better way to work.
              </h1>

              <div className="mt-6 max-w-[56ch] space-y-4 text-[clamp(1.0625rem,0.98rem+0.45vw,1.1875rem)] leading-[1.7] text-muted">
                <p>
                  Commun brings work management, collaboration, meetings, and shared
                  knowledge together in one connected workspace.
                </p>
                <p>
                  We&rsquo;re currently improving the platform to deliver a more focused,
                  reliable, and seamless experience for individuals and teams.
                </p>
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <p className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className="size-4 text-muted"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="8" cy="8" r="6.25" />
                    <path d="M8 4.75V8l2.25 1.5" />
                  </svg>
                  Check back soon
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:text-[11px]">
                  No action required
                </p>
              </div>
            </div>

            <aside className="site-enter site-enter--2 border-t border-border pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted sm:text-[11px]">
                What&rsquo;s changing
              </p>
              <h2 className="mt-3 text-[clamp(1.375rem,2vw,1.5rem)] font-semibold leading-[1.25] tracking-[-0.02em] text-foreground">
                A better Commun experience is on its way.
              </h2>
              <p className="mt-3 text-sm leading-[1.65] text-muted">
                We&rsquo;re working on the details that make everyday work simpler.
              </p>

              <ul className="mt-6 divide-y divide-border border-y border-border">
                {updateAreas.map((area, index) => (
                  <li key={area.title} className="flex gap-3 py-4">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 font-mono text-[10px] tabular-nums text-muted"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold tracking-[-0.01em] text-foreground">
                        {area.title}
                      </h3>
                      <p className="mt-1 text-[13px] leading-[1.6] text-muted">
                        {area.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="mt-14 border-y border-border bg-surface sm:mt-16">
          <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
            <WorkspacePreview />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
