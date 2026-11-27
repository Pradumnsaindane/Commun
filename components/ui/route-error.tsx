'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/** Shared client-side error surface for route-scoped error boundaries. */
export function RouteError({
  title,
  description,
  error,
  retry,
}: {
  title: string
  description: string
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error('[commun] route_error', { digest: error.digest })
  }, [error.digest])

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-bold">{title}</h1>
      <p className="mt-4 text-muted">{description}</p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={retry}
          className="rounded-md bg-accent px-4 py-3 text-sm font-semibold text-background focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-border px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          Go home
        </Link>
      </div>
    </main>
  )
}
