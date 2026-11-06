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

