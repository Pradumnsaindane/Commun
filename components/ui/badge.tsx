import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'emerald' | 'indigo' | 'outline' | 'muted'
  dot?: boolean
}

export function Badge({
  className,
  variant = 'default',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-surface text-foreground border-border',
    accent: 'bg-accent/10 text-accent border-accent/25',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
    outline: 'bg-transparent text-muted border-border',
    muted: 'bg-surface/50 text-subtle border-border/50',
  }[variant]

  const dotClasses = {
    default: 'bg-muted',
    accent: 'bg-accent',
    emerald: 'bg-emerald-400',
    indigo: 'bg-indigo-400',
    outline: 'bg-muted',
    muted: 'bg-subtle',
  }[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border font-mono tracking-tight',
        variantClasses,
        className
      )}
      {...props}
    >
      {dot && <span className={cn('size-1.5 rounded-full animate-pulse-subtle', dotClasses)} aria-hidden="true" />}
      {children}
    </span>
  )
}

