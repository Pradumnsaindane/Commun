import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'subtle'
  size?: 'sm' | 'md' | 'lg'
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      iconLeft,
      iconRight,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs font-medium rounded-md gap-1.5',
      md: 'px-4 py-2.5 text-sm font-semibold rounded-lg gap-2',
      lg: 'px-6 py-3.5 text-base font-semibold rounded-xl gap-2.5',
    }[size]

    const variantClasses = {
      primary:
        'bg-accent text-accent-foreground hover:brightness-105 active:scale-[0.98] shadow-sm shadow-accent/20 font-semibold',
      secondary:
        'bg-surface hover:bg-surface-hover text-foreground border border-border shadow-sm active:scale-[0.98]',
      outline:
        'bg-transparent hover:bg-surface text-foreground border border-border hover:border-border-strong active:scale-[0.98]',
      ghost:
        'bg-transparent hover:bg-surface text-muted hover:text-foreground active:scale-[0.98]',
      subtle:
        'bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 active:scale-[0.98]',
    }[variant]

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center transition-all select-none',
          'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          sizeClasses,
          variantClasses,
          className
        )}
        {...props}
      >
        {iconLeft && <span className="shrink-0" aria-hidden="true">{iconLeft}</span>}
        {children}
        {iconRight && <span className="shrink-0" aria-hidden="true">{iconRight}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'

