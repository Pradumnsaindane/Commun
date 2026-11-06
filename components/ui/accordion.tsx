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

