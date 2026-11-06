'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher'
import { NotificationDropdown } from '@/components/workspace/notification-dropdown'
import { QuickActionsModal } from '@/components/workspace/quick-actions-modal'

interface NavLinkItem {
  label: string
  href: string
  icon: string
  badge?: string
}

const workspaceLinks: NavLinkItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Projects', href: '/projects', icon: '📁' },
  { label: 'My Tasks', href: '/tasks', icon: '📋' },
  { label: 'Calendar', href: '/calendar', icon: '🗓️' },
  { label: 'Meetings', href: '/meetings', icon: '🗓️' },
  { label: 'Notes', href: '/notes', icon: '📝' },
  { label: 'Knowledge', href: '/knowledge', icon: '📚' },
  { label: 'Learning', href: '/learning', icon: '🎯' },
  { label: 'Analytics', href: '/analytics', icon: '📈' },
]

const personalLinks: NavLinkItem[] = [
  { label: 'My Profile', href: '/profile/me', icon: '👤' },
  { label: 'Saved Items', href: '/saved', icon: '🔖' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
]

function BrandLogo() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-baseline font-mono text-xl font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
      aria-label="Commun Workspace"
    >
      commun<span className="text-accent animate-pulse-subtle">.</span>
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [quickActionOpen, setQuickActionOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<{
    email: string | null
    name: string | null
    avatar_url: string | null
  } | null>(null)

  // Public website and auth pages don't render the authenticated application shell
  const isPublicLanding = pathname === '/'
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
    if (isPublicLanding || isAuthRoute || isAuthCallback) return

    const client = createClient()
    void client.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserProfile({
          email: user.email ?? null,
          name: user.user_metadata?.name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Member',
          avatar_url: user.user_metadata?.avatar_url ?? null,
        })
      }
    })
  }, [pathname, isPublicLanding, isAuthRoute, isAuthCallback])

  // Handle logout
  const handleLogout = async () => {
    setUserMenuOpen(false)
    const client = createClient()
    await client.auth.signOut()
    router.push('/login')
  }

  // Keyboard shortcut ⌘K for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.getElementById('workspace-global-search')
        searchInput?.focus()
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

  if (isPublicLanding) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  if (isAuthRoute || isAuthCallback) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Application Header */}
      <header className="glass-surface sticky top-0 z-40 border-b border-border/70">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
          {/* Mobile Menu Trigger & Logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-workspace-navigation"
              className="flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:text-foreground"
            >
              ☰
            </button>
            <BrandLogo />
          </div>

          {/* Desktop Search Interface */}
          <div className="hidden lg:flex items-center flex-1 max-w-md">
            <form action="/search" className="relative w-full">
              <label htmlFor="workspace-global-search" className="sr-only">
                Search workspace
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs text-muted" aria-hidden="true">
                  ⌕
                </span>
                <input
                  id="workspace-global-search"
                  name="q"
                  type="search"
                  placeholder="Search tasks, projects, notes, knowledge..."
                  className="w-full rounded-xl border border-border bg-surface/70 py-2 pl-9 pr-14 text-xs text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent focus:bg-surface focus:ring-1 focus:ring-accent"
                />
                <kbd className="absolute right-3 rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted pointer-events-none">
                  ⌘ K
                </kbd>
              </div>
            </form>
          </div>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={() => setQuickActionOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-bold text-background shadow-sm shadow-accent/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <span className="text-sm font-black">+</span> Quick Action
            </button>

            <Link
              href="/search"
              aria-label="Search"
              className="flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:text-foreground lg:hidden"
            >
              ⌕
            </Link>

            <NotificationDropdown />
            <ThemeToggle />

            {/* User Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                className="flex size-10 items-center justify-center rounded-full border border-accent/40 bg-accent/15 font-mono text-xs font-bold text-accent transition-all hover:ring-2 hover:ring-accent/30"
              >
                {userProfile?.name?.slice(0, 1).toUpperCase() || 'U'}
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
                    className="glass-surface glass-floating dropdown-enter absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl p-2"
                  >
                    <div className="px-3 py-2 border-b border-border/80">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {userProfile?.name || 'Workspace Member'}
                      </p>
                      <p className="text-[11px] text-muted truncate">
                        {userProfile?.email || 'Logged in'}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        role="menuitem"
                        href="/profile/me"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted hover:bg-surface hover:text-foreground"
                      >
                        <span>👤</span> My Profile
                      </Link>
                      <Link
                        role="menuitem"
                        href="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted hover:bg-surface hover:text-foreground"
                      >
                        <span>⚙️</span> Workspace Settings
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-border/80">
                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => void handleLogout()}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-surface hover:text-red-300 text-left font-medium"
                      >
                        <span>🚪</span> Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex mx-auto w-full max-w-[1600px]">
        {/* Desktop Left Sidebar */}
        <aside className={cn('glass-surface hidden shrink-0 flex-col border-y-0 border-l-0 border-r border-border/70 bg-white/55 p-3 transition-[width] duration-300 ease-out dark:bg-card/55 lg:flex', sidebarCollapsed ? 'w-20' : 'w-64')}>
          <div className="sticky top-20 flex flex-col h-[calc(100vh-6rem)] justify-between">
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className={cn('flex', sidebarCollapsed ? 'justify-center' : 'justify-end')}>
                <button type="button" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!sidebarCollapsed} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="grid size-9 place-items-center rounded-xl border border-border bg-surface text-sm text-muted transition-colors hover:border-accent/40 hover:text-foreground">
                  <span aria-hidden="true" className="transition-transform duration-300">{sidebarCollapsed ? '›' : '‹'}</span>
                </button>
              </div>
              {/* Workspace Switcher */}
              {!sidebarCollapsed && <div className="workspace-enter">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted px-1 mb-2">
                  Workspace
                </p>
                <WorkspaceSwitcher />
              </div>}

              {/* Workspace Links */}
              <div>
                {!sidebarCollapsed && <p className="text-[10px] font-mono uppercase tracking-wider text-muted px-2 mb-2">Workspace Navigation</p>}
                <nav className="space-y-1" aria-label="Workspace Navigation">
                  {workspaceLinks.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'group relative flex items-center rounded-xl py-2 text-xs font-semibold transition-all duration-200',
                          sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
                          isActive
                            ? 'border border-accent/20 bg-accent/10 text-accent shadow-sm'
                            : 'text-muted hover:bg-surface hover:text-foreground'
                        )}
                        aria-label={sidebarCollapsed ? item.label : undefined}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <span className="shrink-0 text-sm transition-transform group-hover:-translate-y-0.5" aria-hidden="true">
                          {item.icon}
                        </span>
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        {isActive && !sidebarCollapsed && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* Personal Links */}
              <div>
                {!sidebarCollapsed && <p className="text-[10px] font-mono uppercase tracking-wider text-muted px-2 mb-2">
                  Personal
                </p>}
                <nav className="space-y-1" aria-label="Personal Navigation">
                  {personalLinks.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'group flex items-center rounded-xl py-2 text-xs font-semibold transition-all',
                          sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
                          isActive
                            ? 'bg-accent/15 text-accent border border-accent/25 shadow-sm'
                            : 'text-muted hover:bg-surface hover:text-foreground'
                        )}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <span className="shrink-0 text-sm transition-transform group-hover:-translate-y-0.5" aria-hidden="true">
                          {item.icon}
                        </span>
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        {isActive && !sidebarCollapsed && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* Bottom User Card */}
            <div className="pt-4 border-t border-border/80">
              <div className={cn('rounded-xl border border-border bg-surface p-2.5 flex items-center', sidebarCollapsed ? 'flex-col gap-2' : 'justify-between')}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-7 rounded-lg bg-accent/20 text-accent font-mono text-xs flex items-center justify-center font-bold shrink-0">
                    {userProfile?.name?.slice(0, 1).toUpperCase() || 'U'}
                  </div>
                  {!sidebarCollapsed && <div className="min-w-0 truncate">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {userProfile?.name || 'Member'}
                    </p>
                    <p className="font-mono text-[10px] text-muted truncate">
                      Active Session
                    </p>
                  </div>}
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  title="Log out"
                  className="rounded-lg p-1.5 text-muted hover:text-red-400 hover:bg-surface-hover text-xs"
                >
                  {sidebarCollapsed ? '↗' : '🚪'}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="workspace-enter min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Slide-Out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Workspace navigation">
          <div
            className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div id="mobile-workspace-navigation" className="glass-surface glass-floating drawer-enter relative z-10 flex w-80 max-w-[85%] flex-col justify-between overflow-y-auto border-r border-border p-5">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <BrandLogo />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="size-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-2">
                  Current Workspace
                </p>
                <WorkspaceSwitcher />
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-2">
                  Workspace
                </p>
                <nav className="space-y-1">
                  {workspaceLinks.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold min-h-[44px]',
                          isActive
                            ? 'bg-accent/15 text-accent border border-accent/30'
                            : 'text-muted hover:bg-surface hover:text-foreground'
                        )}
                      >
                        <span className="text-base">{item.icon}</span>
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-2">
                  Personal
                </p>
                <nav className="space-y-1">
                  {personalLinks.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold min-h-[44px]',
                          isActive
                            ? 'bg-accent/15 text-accent border border-accent/30'
                            : 'text-muted hover:bg-surface hover:text-foreground'
                        )}
                      >
                        <span className="text-base">{item.icon}</span>
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-xs font-bold text-red-300"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile quick navigation */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="glass-surface fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-x-0 border-b-0 border-t border-border/70 p-1.5 lg:hidden"
      >
        {[
          { label: 'Dashboard', href: '/dashboard', icon: '📊' },
          { label: 'Projects', href: '/projects', icon: '📁' },
          { label: 'Tasks', href: '/tasks', icon: '📋' },
          { label: 'Calendar', href: '/calendar', icon: '🗓️' },
          { label: 'Notes', href: '/notes', icon: '📝' },
        ].map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1.5 text-[10px] font-semibold transition-colors min-h-[44px]',
                isActive ? 'text-accent' : 'text-muted hover:text-foreground'
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Quick Action Modal Dialog */}
      <QuickActionsModal
        isOpen={quickActionOpen}
        onClose={() => setQuickActionOpen(false)}
      />
    </div>
  )
}
