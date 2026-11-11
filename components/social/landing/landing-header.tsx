'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wordmark } from '@/components/social/wordmark'
import { marketingNav } from '@/lib/social-navigation'

function SoonLabel() {
  return (
    <span className="rounded border border-border px-1 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-subtle">
      Soon
    </span>
  )
}

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="rounded-md focus-visible:outline-none" aria-label="Commun.dev home">
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 xl:flex">
          {marketingNav.map((item) =>
            item.status === 'live' && item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                title={item.description}
                className="inline-flex cursor-default items-center gap-1.5 px-3 py-2 text-sm text-muted"
              >
                {item.label}
                <SoonLabel />
              </span>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden min-h-10 items-center rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="hidden min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover sm:inline-flex"
          >
            Join the community
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-foreground xl:hidden"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              {menuOpen ? '✕' : '☰'}
            </span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="landing-mobile-menu"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-background px-5 pb-6 pt-4 sm:px-8 xl:hidden"
        >
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {marketingNav.map((item) =>
              item.status === 'live' && item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-11 items-center justify-between rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                >
                  {item.label}
                  <span aria-hidden="true" className="text-muted">
                    →
                  </span>
                </Link>
              ) : (
                <span
                  key={item.label}
                  className="flex min-h-11 items-center justify-between rounded-lg px-3 text-sm text-muted"
                >
                  {item.label}
                  <SoonLabel />
                </span>
              )
            )}
          </nav>

          <div className="mt-4 grid gap-2 border-t border-border pt-4">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface text-sm font-medium text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground"
            >
              Join the community
            </Link>
          </div>

          <p className="mt-4 font-mono text-[10px] leading-relaxed text-muted">
            Features marked Soon are in development and not yet available.
          </p>
        </div>
      )}
    </header>
  )
}
