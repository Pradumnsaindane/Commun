'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { NotificationDropdown } from '@/components/workspace/notification-dropdown'
import { Wordmark } from '@/components/social/wordmark'
import { NavIcon, type NavIconName } from '@/components/social/nav-icon'
import {
  appInDevelopmentNav,
  appLibraryNav,
  appPrimaryNav,
} from '@/lib/social-navigation'

const iconByLabel: Record<string, NavIconName> = {
  Feed: 'feed',
  Explore: 'explore',
  Articles: 'articles',
  Discussions: 'discussions',
  Saved: 'saved',
  'Your profile': 'profile',
}

const mobileNavigation: { label: string; href: string; icon: NavIconName }[] = [
  { label: 'Feed', href: '/feed', icon: 'feed' },
  { label: 'Explore', href: '/explore', icon: 'explore' },
  { label: 'Discussions', href: '/discussions', icon: 'discussions' },
  { label: 'Notifications', href: '/notifications', icon: 'bell' },
  { label: 'Profile', href: '/profile/me', icon: 'profile' },
]

function isActivePath(pathname: string, href?: string) {
  if (!href) return false
  const base = href.split('?')[0]
  if (base === '/') return pathname === '/'
  return pathname === base || pathname.startsWith(`${base}/`)
}

function SoonChip() {
  return (
    <span className="ml-auto rounded border border-border px-1 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-subtle">
      Soon
    </span>
  )
}

function SidebarNavigation({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="px-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Discover
        </p>
        <nav aria-label="Discover" className="mt-2 space-y-0.5">
          {appPrimaryNav.map((item) => {
            const active = isActivePath(pathname, item.href)
            return (
              <Link
                key={item.label}
                href={item.href as string}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors',
                  active
                    ? 'bg-accent/10 font-medium text-accent'
                    : 'text-muted hover:bg-surface hover:text-foreground'
                )}
              >
                <NavIcon name={iconByLabel[item.label] ?? 'feed'} />
                {item.label}
                {active && <span className="ml-auto size-1.5 rounded-full bg-accent" aria-hidden="true" />}
              </Link>
            )
          })}
        </nav>
      </div>

      <div>
        <p className="px-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Your library
        </p>
        <nav aria-label="Your library" className="mt-2 space-y-0.5">
          {appLibraryNav.map((item) => {
            const active = isActivePath(pathname, item.href)
            return (
              <Link
                key={item.label}
                href={item.href as string}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors',
                  active
                    ? 'bg-accent/10 font-medium text-accent'
                    : 'text-muted hover:bg-surface hover:text-foreground'
                )}
              >
                <NavIcon name={iconByLabel[item.label] ?? 'saved'} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div>
        <p className="px-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          In development
        </p>
        <div className="mt-2 space-y-0.5">
          {appInDevelopmentNav.map((item) => (
            <span
              key={item.label}
              title={item.description}
              className="flex min-h-10 items-center rounded-lg px-2.5 text-sm text-muted"
            >
              {item.label}
              <SoonChip />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<{
    email: string | null
    name: string | null
    avatar_url: string | null
  } | null>(null)

  const isPublicLanding = pathname === '/'
  const isStandaloneDemo = pathname === '/cinematic-hero'
  const isAuthRoute = [
    '/login',
    '/register',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ].includes(pathname)
  const isAuthCallback = pathname.startsWith('/auth/')

  useEffect(() => {
    if (isPublicLanding || isAuthRoute || isAuthCallback || isStandaloneDemo) return

    const client = createClient()
    void client.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserProfile({
          email: user.email ?? null,
          name:
            user.user_metadata?.name ||
            user.user_metadata?.display_name ||
            user.email?.split('@')[0] ||
            'Developer',
          avatar_url: user.user_metadata?.avatar_url ?? null,
        })
      }
    })
  }, [pathname, isPublicLanding, isAuthRoute, isAuthCallback, isStandaloneDemo])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
    const client = createClient()
    await client.auth.signOut()
    router.push('/login')
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        document.getElementById('workspace-global-search')?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen && !userMenuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
        setUserMenuOpen(false)
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileMenuOpen, userMenuOpen])

  if (isPublicLanding || isStandaloneDemo) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  if (isAuthRoute || isAuthCallback) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="social-mobile-navigation"
              className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-surface text-muted transition-colors hover:text-foreground lg:hidden"
            >
              <span aria-hidden="true" className="text-base leading-none">
                ☰
              </span>
            </button>
            <Link href="/feed" className="truncate rounded-md" aria-label="Commun.dev feed">
              <Wordmark size="sm" />
            </Link>
          </div>

          <form action="/search" className="hidden w-full max-w-md lg:block">
            <label htmlFor="workspace-global-search" className="sr-only">
              Search Commun
            </label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-muted" aria-hidden="true">
                <NavIcon name="search" />
              </span>
              <input
                id="workspace-global-search"
                name="q"
                type="search"
                placeholder="Search developers, articles, discussions..."
                className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-12 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent"
              />
              <kbd className="pointer-events-none absolute right-3 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted">
                ⌘K
              </kbd>
            </div>
          </form>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              href="/search"
              aria-label="Search"
              className="grid size-10 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground lg:hidden"
            >
              <NavIcon name="search" className="size-5" />
            </Link>

            <Link
              href="/write"
              className="hidden min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover md:inline-flex"
            >
              Write
            </Link>

            <NotificationDropdown />

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
                className="grid size-10 place-items-center rounded-full border border-accent/35 bg-accent/10 font-mono text-xs font-semibold text-accent transition-colors hover:bg-accent/15"
              >
                {(userProfile?.name ?? 'U').slice(0, 1).toUpperCase()}
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-border bg-surface p-2 shadow-card"
                  >
                    <div className="border-b border-border px-3 py-2.5">
                      <p className="truncate text-sm font-medium text-foreground">
                        {userProfile?.name || 'Developer'}
                      </p>
                      <p className="truncate font-mono text-[10px] text-muted">
                        {userProfile?.email || 'Signed in'}
                      </p>
                    </div>

                    <div className="py-1">
                      {[
                        { label: 'Your profile', href: '/profile/me' },
                        { label: 'Saved', href: '/saved' },
                        { label: 'Settings', href: '/settings' },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          role="menuitem"
                          href={item.href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex min-h-9 items-center rounded-lg px-3 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-border pt-1">
                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => void handleLogout()}
                        className="flex min-h-9 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-border lg:flex lg:flex-col">
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col justify-between overflow-y-auto p-4">
            <SidebarNavigation pathname={pathname} />

            <div className="mt-6 border-t border-border pt-4">
              <Link
                href="/settings"
                className="flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                <NavIcon name="settings" />
                Settings
              </Link>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-surface p-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/10 font-mono text-[10px] font-semibold text-accent">
                  {(userProfile?.name ?? 'U').slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">
                    {userProfile?.name || 'Developer'}
                  </p>
                  <p className="truncate font-mono text-[10px] text-muted">Signed in</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className="fixed inset-0 bg-[hsl(var(--foreground)/0.10)] backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            id="social-mobile-navigation"
            className="relative z-10 flex w-72 max-w-[85%] flex-col justify-between overflow-y-auto border-r border-border bg-background p-5"
          >
            <div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} aria-label="Commun.dev home">
                  <Wordmark />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="grid size-9 place-items-center rounded-lg border border-border text-muted hover:text-foreground"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>

              <div className="mt-4">
                <SidebarNavigation pathname={pathname} onNavigate={() => setMobileMenuOpen(false)} />
              </div>

            </div>

            <div className="mt-6 border-t border-border pt-4">
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm text-muted hover:text-foreground"
              >
                <NavIcon name="settings" />
                Settings
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="mt-1 flex min-h-10 w-full items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10 text-sm font-medium text-red-600"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        {mobileNavigation.map((item) => {
          const active = isActivePath(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium transition-colors',
                active ? 'text-accent' : 'text-muted hover:text-foreground'
              )}
            >
              <NavIcon name={item.icon} className="size-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
