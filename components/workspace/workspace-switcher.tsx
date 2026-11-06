'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Workspace {
  id: string
  name: string
  role: string
  tier: string
}

const mockWorkspaces: Workspace[] = [
  { id: 'ws-primary', name: 'Primary Workspace', role: 'Owner', tier: 'Pro' },
  { id: 'ws-eng', name: 'Engineering & Systems', role: 'Admin', tier: 'Enterprise' },
]

export function WorkspaceSwitcher({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [activeWorkspace, setActiveWorkspace] = useState(mockWorkspaces[0])

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-left transition-colors hover:border-border-strong hover:bg-surface-hover"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 font-mono text-xs font-bold text-accent">
            {activeWorkspace.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">
              {activeWorkspace.name}
            </p>
            <p className="truncate font-mono text-[10px] text-muted">
              {activeWorkspace.role} · {activeWorkspace.tier}
            </p>
          </div>
        </div>
        <span className="text-muted text-[10px] shrink-0 font-mono">▼</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="listbox"
            className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-border bg-card p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95"
          >
            <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted">
              Your Workspaces
            </div>
            {mockWorkspaces.map((ws) => (
              <button
                key={ws.id}
                role="option"
                aria-selected={activeWorkspace.id === ws.id}
                type="button"
                onClick={() => {
                  setActiveWorkspace(ws)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors',
                  activeWorkspace.id === ws.id
                    ? 'bg-accent/15 text-accent font-semibold'
                    : 'text-muted hover:bg-surface hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-accent" />
                  <span>{ws.name}</span>
                </div>
                {activeWorkspace.id === ws.id && (
                  <span className="text-accent text-xs">✓</span>
                )}
              </button>
            ))}

            <div className="my-1.5 border-t border-border/80" />
            <div className="px-2 py-1 text-[11px] text-muted">
              <span>Tenant isolation active</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

