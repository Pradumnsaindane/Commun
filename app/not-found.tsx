import Link from 'next/link'

export default function NotFound() { return <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center"><p className="font-mono text-xs uppercase tracking-widest text-accent">404</p><h1 className="mt-3 text-3xl font-bold">That page does not exist.</h1><p className="mt-4 text-muted">The content may have moved or been removed.</p><Link href="/" className="mt-8 rounded-md bg-accent px-4 py-3 text-sm font-semibold text-background">Return home</Link></main> }
