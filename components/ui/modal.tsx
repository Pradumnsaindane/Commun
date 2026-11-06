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

