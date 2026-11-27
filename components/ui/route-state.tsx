import Link from 'next/link'

/** Shared server-rendered skeleton for data-heavy dynamic routes. */
export function RouteLoading({
  label,
  title,
  cards = 3,
}: {
  label: string
  title: string
  cards?: number
}) {
  return (
    <div role="status" aria-live="polite" aria-label={label} className="mx-auto w-full max-w-5xl space-y-7 py-2">
      <span className="sr-only">{title}</span>
      <div className="space-y-3 border-b border-border/80 pb-7" aria-hidden="true">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-9 w-64 max-w-full" />
        <div className="skeleton h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="skeleton h-36" />
        ))}
      </div>
      <div className="skeleton h-56" aria-hidden="true" />
    </div>
  )
}

/** Shared not-found surface for dynamic routes with contextual back links. */
export function RouteNotFound({
  title,
  description,
  backHref,
  backLabel,
}: {
  title: string
  description: string
  backHref: string
  backLabel: string
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">404</p>
      <h1 className="mt-3 text-3xl font-bold">{title}</h1>
      <p className="mt-4 text-muted">{description}</p>
      <Link
        href={backHref}
        className="mt-8 rounded-md bg-accent px-4 py-3 text-sm font-semibold text-background focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        {backLabel}
      </Link>
    </main>
  )
}
