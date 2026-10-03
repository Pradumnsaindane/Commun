'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const primaryLinks = [
  { label: 'Feed', href: '/feed', icon: '↗' },
  { label: 'Explore', href: '/explore', icon: '⌕' },
  { label: 'Community', href: '/community', icon: '◌' },
  { label: 'Saved', href: '/saved', icon: '▱' },
  { label: 'Notifications', href: '/notifications', icon: '◍' },
]

function Brand() {
  return <Link href="/" className="inline-flex items-baseline font-mono text-[1.15rem] font-bold tracking-[-0.05em]" aria-label="Commun home">commun<span className="text-accent">.</span></Link>
}

function PublicShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Brand />
        <nav aria-label="Public navigation" className="hidden items-center gap-8 text-[13px] text-muted md:flex">
          <Link href="/explore" className="transition-colors hover:text-foreground">Discover</Link><Link href="/community" className="transition-colors hover:text-foreground">Discussions</Link><Link href="/discover" className="transition-colors hover:text-foreground">Developers</Link>
        </nav>
        <div className="hidden items-center gap-2 sm:flex"><Link href="/login" className="rounded-lg px-3 py-2 text-[13px] text-muted hover:text-foreground">Log in</Link><Link href="/register" className="rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-background transition hover:brightness-110">Join Commun</Link></div>
        <button type="button" aria-expanded={menuOpen} aria-controls="mobile-public-nav" className="rounded-lg border border-border px-3 py-2 text-xs text-muted sm:hidden" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close' : 'Menu'}</button>
      </div>
      {menuOpen && <nav id="mobile-public-nav" aria-label="Mobile public navigation" className="flex flex-col gap-1 border-t border-border/80 px-5 py-4 text-sm sm:hidden"><Link href="/explore" className="rounded-lg px-3 py-2.5 text-muted hover:bg-surface hover:text-foreground">Discover</Link><Link href="/community" className="rounded-lg px-3 py-2.5 text-muted hover:bg-surface hover:text-foreground">Discussions</Link><Link href="/login" className="rounded-lg px-3 py-2.5 text-muted hover:bg-surface hover:text-foreground">Log in</Link><Link href="/register" className="mt-2 rounded-lg bg-accent px-3 py-2.5 text-center font-semibold text-background">Join Commun</Link></nav>}
    </header>{children}
  </div>
}

function DesktopSidebar({ pathname }: { pathname: string }) {
  return <aside className="hidden w-[232px] shrink-0 border-r border-border/80 px-4 py-7 lg:block"><div className="sticky top-24"><Brand /><p className="mb-3 mt-12 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Workspace</p><nav aria-label="Primary navigation" className="flex flex-col gap-1">{primaryLinks.map((link) => { const active = pathname === link.href || pathname.startsWith(`${link.href}/`); return <Link key={link.href} href={link.href} className={cn('group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors', active ? 'bg-accent/10 font-medium text-foreground' : 'text-muted hover:bg-surface hover:text-foreground')}><span className={cn('w-5 text-center text-sm', active ? 'text-accent' : 'text-muted group-hover:text-accent')} aria-hidden="true">{link.icon}</span>{link.label}{active && <span className="ml-auto size-1.5 rounded-full bg-accent" />}</Link>})}</nav><div className="my-6 border-t border-border/80" /><Link href="/write" className="flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-[13px] font-semibold text-background transition hover:brightness-110"><span className="text-lg leading-none">+</span> Create</Link><Link href="/settings" className={cn('mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-muted hover:bg-surface hover:text-foreground', pathname.startsWith('/settings') && 'bg-surface text-foreground')}><span className="w-5 text-center">◎</span> Settings</Link></div></aside>
}

function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  return <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl"><div className="flex h-[72px] items-center gap-4 px-5 sm:px-7"><div className="lg:hidden"><Brand /></div><label className="hidden h-10 max-w-[420px] flex-1 items-center gap-3 rounded-lg border border-border bg-surface/70 px-3 text-[13px] text-muted sm:flex"><span className="text-base">⌕</span><span className="sr-only">Search Commun</span><input aria-label="Search Commun" placeholder="Search Commun..." className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted" /><kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted">⌘ K</kbd></label><div className="ml-auto flex items-center gap-2"><button type="button" aria-label="Open search" className="grid size-10 place-items-center rounded-lg text-muted hover:bg-surface hover:text-foreground sm:hidden">⌕</button><Link href="/write" className="hidden rounded-lg bg-accent px-3.5 py-2.5 text-[13px] font-semibold text-background sm:inline-flex">Create</Link><Link href="/notifications" aria-label="Notifications" className="grid size-10 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground">◍</Link><button type="button" aria-expanded={menuOpen} aria-haspopup="menu" onClick={() => setMenuOpen(!menuOpen)} className="grid size-10 place-items-center rounded-full border border-accent/30 bg-accent/10 text-sm font-semibold text-accent">C</button>{menuOpen && <div role="menu" className="absolute right-5 top-[64px] w-48 rounded-xl border border-border bg-elevated p-1.5 shadow-2xl"><Link role="menuitem" href="/profile/me" className="block rounded-lg px-3 py-2.5 text-[13px] hover:bg-surface">Profile</Link><Link role="menuitem" href="/settings" className="block rounded-lg px-3 py-2.5 text-[13px] hover:bg-surface">Settings</Link><Link role="menuitem" href="/login" className="block rounded-lg px-3 py-2.5 text-[13px] text-muted hover:bg-surface hover:text-foreground">Log out</Link></div>}</div></div></header>
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/') return <PublicShell>{children}</PublicShell>
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(pathname)
  if (pathname === '/dashboard' || pathname === '/onboarding' || pathname.startsWith('/auth/') || isAuthRoute) return <>{children}</>
  return <div className="min-h-screen bg-background"><AppHeader /><div className="mx-auto flex max-w-[1500px]"><DesktopSidebar pathname={pathname} /><main className="min-w-0 flex-1 pb-24">{children}</main></div><nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-elevated/95 p-2 backdrop-blur-xl lg:hidden">{[...primaryLinks.slice(0, 3), primaryLinks[4], { label: 'Profile', href: '/profile/me', icon: '◎' }].map((link) => <Link key={link.href} href={link.href} className={cn('flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] text-muted', pathname.startsWith(link.href) && 'bg-accent/10 text-accent')}><span className="text-base">{link.icon}</span>{link.label}</Link>)}</nav></div>
}
