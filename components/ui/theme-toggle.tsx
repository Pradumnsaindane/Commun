'use client'

import React, { useEffect, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function getSnapshot() {
  return localStorage.getItem('commun-theme') || 'light'
}

function getServerSnapshot() {
  return 'light'
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('commun-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    window.dispatchEvent(new Event('storage'))
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={cn(
        'inline-flex items-center justify-center size-10 rounded-xl border border-border bg-surface text-muted hover:text-foreground hover:bg-surface-hover transition-colors',
        'focus-visible:outline-2 focus-visible:outline-accent',
        className
      )}
    >
      {theme === 'dark' ? (
        <span className="text-base" aria-hidden="true">
          ☀️
        </span>
      ) : (
        <span className="text-base" aria-hidden="true">
          🌙
        </span>
      )}
    </button>
  )
}
