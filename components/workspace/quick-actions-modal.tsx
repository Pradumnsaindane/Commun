'use client'

import React from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function QuickActionsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const handleReset = () => {
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleReset} title="Work management">
      <div className="space-y-5 py-2">
        <p className="text-sm leading-6 text-muted">
          Tasks, projects, meetings, and notes are not connected to persistent workspace records yet. Nothing entered here would be saved, so creation is unavailable.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Link onClick={handleReset} href="/tasks" className="rounded-xl border border-border bg-surface p-3 text-sm font-medium hover:border-accent/50">View tasks</Link>
          <Link onClick={handleReset} href="/projects" className="rounded-xl border border-border bg-surface p-3 text-sm font-medium hover:border-accent/50">View projects</Link>
          <Link onClick={handleReset} href="/meetings" className="rounded-xl border border-border bg-surface p-3 text-sm font-medium hover:border-accent/50">View meetings</Link>
          <Link onClick={handleReset} href="/notes" className="rounded-xl border border-border bg-surface p-3 text-sm font-medium hover:border-accent/50">View notes</Link>
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={handleReset}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}
