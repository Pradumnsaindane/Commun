'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300 px-4 sm:px-6 lg:px-8 pt-4 pb-2'
      )}
    >
      <div
        className={cn(
          'mx-auto max-w-7xl flex h-16 items-center justify-between rounded-2xl border px-5 transition-all duration-300',
          scrolled
            ? 'border-border/80 bg-background/85 backdrop-blur-xl shadow-dark-nav'
            : 'border-border/50 bg-background/60 backdrop-blur-md'
        )}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          className="inline-flex items-baseline font-mono text-xl font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
          aria-label="Commun Home"
        >
          commun<span className="text-accent animate-pulse-subtle">.</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-muted"
        >
          <a href="#product" className="transition-colors hover:text-foreground">
            Product
          </a>
          <a href="#capabilities" className="transition-colors hover:text-foreground">
            Capabilities
          </a>
          <a href="#solutions" className="transition-colors hover:text-foreground">
            Solutions
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#pricing" className="transition-colors hover:text-foreground">
            Pricing
          </a>
          <a href="#faq" className="transition-colors hover:text-foreground">
            FAQ
          </a>
          <a href="#contact" className="transition-colors hover:text-foreground">
            Contact
          </a>
        </nav>

        {/* Actions & Theme */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-lg px-3.5 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-xs font-bold text-background transition-all hover:brightness-110 shadow-sm shadow-accent/20 active:scale-95"
          >
            Get started
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            className="rounded-lg border border-border bg-surface p-2 text-muted hover:text-foreground"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mt-2 mx-auto max-w-7xl rounded-2xl border border-border bg-background/95 p-5 shadow-2xl backdrop-blur-xl sm:hidden">
          <nav aria-label="Mobile Navigation" className="flex flex-col gap-3 text-sm font-medium">
            <a
              href="#product"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-muted hover:bg-surface hover:text-foreground"
            >
              Product
            </a>
            <a
              href="#capabilities"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-muted hover:bg-surface hover:text-foreground"
            >
              Capabilities
            </a>
            <a
              href="#solutions"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-muted hover:bg-surface hover:text-foreground"
            >
              Solutions
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-muted hover:bg-surface hover:text-foreground"
            >
              How it works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-muted hover:bg-surface hover:text-foreground"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-muted hover:bg-surface hover:text-foreground"
            >
              FAQ
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-muted hover:bg-surface hover:text-foreground"
            >
              Contact
            </a>
            <div className="my-2 border-t border-border" />
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="rounded-lg border border-border bg-surface px-4 py-2.5 text-center text-xs font-semibold text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-accent px-4 py-2.5 text-center text-xs font-bold text-background"
              >
                Get started free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

