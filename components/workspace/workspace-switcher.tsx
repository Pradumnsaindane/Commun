'use client'

import { cn } from '@/lib/utils'

export function WorkspaceSwitcher({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border/80 bg-surface/85 px-3 py-2.5', className)}>
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-mono text-xs font-bold text-accent" aria-hidden="true">
          C
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">Commun workspace</p>
          <p className="truncate text-[10px] text-muted">Workspace switching unavailable</p>
        </div>
      </div>
    </div>
  )
}
