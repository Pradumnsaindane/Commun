'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[commun] route_error', { digest: error.digest }) }, [error.digest])
  return <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center"><p className="font-mono text-xs uppercase tracking-widest text-accent">Something went wrong</p><h1 className="mt-3 text-3xl font-bold">We could not load this page.</h1><p className="mt-4 text-muted">Try again, or return to the home page.</p><div className="mt-8 flex gap-3"><button onClick={() => reset()} className="rounded-md bg-accent px-4 py-3 text-sm font-semibold text-background">Try again</button><Link href="/" className="rounded-md border border-border px-4 py-3 text-sm font-semibold">Go home</Link></div></main>
}
