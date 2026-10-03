export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-6xl items-center justify-center px-5 py-16 sm:px-8" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm text-muted shadow-sm">
        <span className="size-4 animate-spin rounded-full border-2 border-border border-t-accent" aria-hidden="true" />
        Loading Commun...
      </div>
    </div>
  )
}
