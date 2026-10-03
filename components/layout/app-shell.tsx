'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const links = [['Feed', '/feed'], ['Explore', '/explore'], ['Community', '/community'], ['Saved', '/saved'], ['Notifications', '/notifications'], ['Settings', '/settings']] as const

function Brand() {
  return <Link href="/" className="font-mono text-lg font-bold tracking-tight" aria-label="Commun home">commun<span className="text-accent">.</span></Link>
}

function PublicShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Brand />
        <nav aria-label="Public navigation" className="hidden items-center gap-8 text-sm text-muted md:flex">
          <Link href="/explore" className="transition-colors hover:text-foreground">Discover</Link>
          <Link href="/community" className="transition-colors hover:text-foreground">Discussions</Link>
          <Link href="/explore" className="transition-colors hover:text-foreground">Developers</Link>
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/login" className="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-foreground">Log in</Link>
          <Link href="/register" className="rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5">Join Commun</Link>
        </div>
        <button type="button" aria-expanded={menuOpen} aria-controls="mobile-public-nav" className="rounded-md border border-border px-3 py-2 text-xs text-muted sm:hidden" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close' : 'Menu'}</button>
      </div>
      {menuOpen && <nav id="mobile-public-nav" aria-label="Mobile public navigation" className="flex flex-col gap-1 border-t border-border/80 px-5 py-4 text-sm sm:hidden">
        <Link href="/explore" className="rounded-md px-3 py-2.5 text-muted hover:bg-surface hover:text-foreground">Discover</Link>
        <Link href="/community" className="rounded-md px-3 py-2.5 text-muted hover:bg-surface hover:text-foreground">Discussions</Link>
        <Link href="/login" className="rounded-md px-3 py-2.5 text-muted hover:bg-surface hover:text-foreground">Log in</Link>
        <Link href="/register" className="mt-2 rounded-md bg-accent px-3 py-2.5 text-center font-semibold text-background">Join Commun</Link>
      </nav>}
    </header>
    {children}
  </div>
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/' || pathname === '/dashboard' || pathname === '/onboarding') return pathname === '/' ? <PublicShell>{children}</PublicShell> : <>{children}</>
  return <div className="min-h-screen bg-background"><header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4"><Brand /><nav className="hidden items-center gap-6 text-sm text-muted md:flex">{links.slice(0, 3).map(([label, href]) => <Link className="transition-colors hover:text-foreground" href={href} key={href}>{label}</Link>)}</nav><div className="flex items-center gap-2"><Link href="/login" className="rounded-md px-3 py-2 text-sm text-muted hover:text-foreground">Log in</Link><Link href="/register" className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-background hover:opacity-90">Join Commun</Link></div></div></header><div className="mx-auto flex max-w-7xl"><aside className="hidden min-h-[calc(100vh-4rem)] w-56 shrink-0 border-r px-4 py-8 lg:block"><nav aria-label="Primary navigation" className="flex flex-col gap-1">{links.map(([label, href]) => <Link key={href} href={href} className="rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground">{label}</Link>)}<Link href="/write" className="mt-6 rounded-md bg-accent px-3 py-2.5 text-center text-sm font-semibold text-background">Create</Link></nav></aside><main className="min-w-0 flex-1 pb-24">{children}</main></div><nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t bg-surface/95 p-3 backdrop-blur lg:hidden">{links.slice(0, 5).map(([label, href]) => <Link key={href} href={href} className="text-xs text-muted hover:text-foreground">{label}</Link>)}</nav></div>
}
