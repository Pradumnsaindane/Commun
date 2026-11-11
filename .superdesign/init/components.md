# Shared UI Components

Framework: Next.js App Router, React 19, TypeScript, Tailwind CSS 3, custom component library. UI primitives are local components.

### `components/ui/accordion.tsx`

```tsx
'use client'

import React, { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

interface AccordionContextType {
  openItems: string[]
  toggleItem: (id: string) => void
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined)

export function Accordion({
  type = 'single',
  defaultValue,
  className,
  children,
}: {
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  className?: string
  children: React.ReactNode
}) {
  const [openItems, setOpenItems] = useState<string[]>(() => {
    if (!defaultValue) return []
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue]
  })

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      if (type === 'single') {
        return prev.includes(id) ? [] : [id]
      }
      return prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    })
  }

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cn('divide-y divide-border/80 border-y border-border/80', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

export function AccordionItem({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('py-1', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 'data-value': value } as any)
        }
        return child
      })}
    </div>
  )
}

export function AccordionTrigger({
  className,
  children,
  'data-value': itemValue,
}: {
  className?: string
  children: React.ReactNode
  'data-value'?: string
}) {
  const context = useContext(AccordionContext)
  if (!context) throw new Error('AccordionTrigger must be used within Accordion')
  const value = itemValue || ''
  const isOpen = context.openItems.includes(value)

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={() => context.toggleItem(value)}
      className={cn(
        'flex w-full items-center justify-between py-4 text-left font-medium transition-colors hover:text-accent',
        'focus-visible:outline-2 focus-visible:outline-accent',
        isOpen ? 'text-accent' : 'text-foreground',
        className
      )}
    >
      <span className="text-base font-semibold tracking-tight">{children}</span>
      <span
        className={cn(
          'ml-4 size-5 shrink-0 transition-transform duration-200 text-muted font-mono flex items-center justify-center',
          isOpen && 'rotate-180 text-accent'
        )}
        aria-hidden="true"
      >
        ▼
      </span>
    </button>
  )
}

export function AccordionContent({
  className,
  children,
  'data-value': itemValue,
}: {
  className?: string
  children: React.ReactNode
  'data-value'?: string
}) {
  const context = useContext(AccordionContext)
  if (!context) throw new Error('AccordionContent must be used within Accordion')
  const value = itemValue || ''
  const isOpen = context.openItems.includes(value)

  if (!isOpen) return null

  return (
    <div
      role="region"
      className={cn('pb-4 text-sm text-muted leading-relaxed transition-all animate-fadeIn', className)}
    >
      {children}
    </div>
  )
}


```
### `components/ui/badge.tsx`

```tsx
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
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/25',
    indigo: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-600/25',
    outline: 'bg-transparent text-muted border-border',
    muted: 'bg-surface/50 text-subtle border-border/50',
  }[variant]

  const dotClasses = {
    default: 'bg-muted',
    accent: 'bg-accent',
    emerald: 'bg-emerald-700 dark:bg-emerald-300',
    indigo: 'bg-indigo-700 dark:bg-indigo-300',
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


```
### `components/ui/button.tsx`

```tsx
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


```
### `components/ui/card.tsx`

```tsx
import React from 'react'
import { cn } from '@/lib/utils'

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-6 shadow-subtle transition-[border-color,box-shadow,transform] duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-xl font-semibold leading-none tracking-tight text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-muted leading-relaxed', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('pt-2', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center pt-4 border-t border-border/80', className)} {...props}>
      {children}
    </div>
  )
}


```
### `components/ui/input.tsx`

```tsx
import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, helperText, error, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={cn(
            'flex h-11 w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-foreground placeholder:text-muted/70',
            'transition-colors duration-150 outline-none',
            'focus:border-accent focus:ring-1 focus:ring-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-400 font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-muted">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'


```
### `components/ui/modal.tsx`

```tsx
'use client'

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal Dialog'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'glass-surface glass-floating modal-enter relative z-10 w-full max-w-lg rounded-2xl p-6',
          className
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="ml-auto rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface-hover"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}


```
### `components/ui/primitives.tsx`

```tsx
import { Card } from '@/components/ui/card'

export { Card }

export function EmptyState({ title, description, action, href }: { title: string; description: string; action?: string; href?: string }) {
  return (
    <Card className="flex min-h-48 flex-col items-center justify-center border-dashed bg-surface/70 p-8 text-center">
      <span aria-hidden="true" className="grid size-11 place-items-center rounded-xl border border-accent/20 bg-accent/10 text-xl text-accent">◌</span>
      <h2 className="mt-5 text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>
      {action && href && <a href={href} className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-accent">{action}</a>}
    </Card>
  )
}

export function PageContainer({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="workspace-enter mx-auto flex w-full max-w-7xl flex-col gap-7 py-2">
      <header className="border-b border-border/80 pb-7">
        {eyebrow && <p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>}
      </header>
      {children}
    </div>
  )
}

```
### `components/ui/product-surfaces.tsx`

```tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-col gap-5 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>}
      </div>
      {action}
    </header>
  )
}

export function Surface({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('rounded-2xl border border-border bg-surface shadow-subtle', className)}>{children}</section>
}

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'danger' }) {
  return <span className={cn('inline-flex rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider', tone === 'accent' && 'border-accent/30 bg-accent/10 text-accent', tone === 'danger' && 'border-red-500/30 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300', tone === 'neutral' && 'border-border bg-surface text-muted')}>{children}</span>
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="glass-surface flex flex-wrap items-center gap-2 rounded-xl p-2">{children}</div>
}

export function IconAvatar({ label, src }: { label: string; src?: string | null }) {
  return src ? <img src={src} alt="" className="size-10 rounded-full object-cover" /> : <span aria-hidden className="grid size-10 place-items-center rounded-full border border-accent/25 bg-accent/10 font-semibold text-accent">{label.slice(0, 1).toUpperCase()}</span>
}

```
### `components/ui/tabs.tsx`

```tsx
'use client'

import React, { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextType {
  value: string
  onChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (val: string) => void
  className?: string
  children: React.ReactNode
}) {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  const currentValue = value !== undefined ? value : internalValue

  const handleValueChange = (newVal: string) => {
    if (value === undefined) {
      setInternalValue(newVal)
    }
    onValueChange?.(newVal)
  }

  return (
    <TabsContext.Provider value={{ value: currentValue, onChange: handleValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface p-1.5 text-muted',
        className
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const isSelected = context.value === value

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isSelected}
      onClick={() => context.onChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
        'focus-visible:outline-2 focus-visible:outline-accent',
        isSelected
          ? 'bg-accent/15 text-accent border border-accent/25 shadow-sm'
          : 'text-muted hover:text-foreground hover:bg-surface-hover',
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')

  if (context.value !== value) return null

  return (
    <div
      role="tabpanel"
      tabIndex={0}
      className={cn('mt-4 focus-visible:outline-none', className)}
    >
      {children}
    </div>
  )
}


```
### `components/ui/textarea.tsx`

```tsx
import React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, id, rows = 4, ...props }, ref) => {
    const generatedId = React.useId()
    const textareaId = id || generatedId

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium text-foreground">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          className={cn(
            'flex w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70',
            'transition-colors duration-150 outline-none resize-y',
            'focus:border-accent focus:ring-1 focus:ring-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="text-xs text-red-400 font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-helper`} className="text-xs text-muted">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'


```
### `components/ui/theme-toggle.tsx`

```tsx
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

```
