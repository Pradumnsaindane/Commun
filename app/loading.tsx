export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading workspace" className="mx-auto w-full max-w-7xl space-y-7 py-2">
      <span className="sr-only">Loading Commun workspace…</span>
      <div className="space-y-3 border-b border-border/80 pb-7" aria-hidden="true">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-9 w-64 max-w-full" />
        <div className="skeleton h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        <div className="skeleton h-36" />
        <div className="skeleton h-36" />
        <div className="skeleton h-36 sm:col-span-2 lg:col-span-1" />
      </div>
      <div className="skeleton h-56" aria-hidden="true" />
    </div>
  )
}
