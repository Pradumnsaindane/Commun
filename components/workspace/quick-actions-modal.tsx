'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

export function QuickActionsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [selectedType, setSelectedType] = useState<'task' | 'project' | 'note' | 'doc'>('task')
  const [title, setTitle] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleReset = () => {
    setTitle('')
    setSubmitted(false)
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitted(true)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleReset} title="Workspace Quick Action">
      {submitted ? (
        <div className="py-6 text-center space-y-4">
          <div className="mx-auto size-12 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xl font-bold">
            ✓
          </div>
          <h4 className="text-base font-bold text-foreground">Action Captured (Phase 2 Preview)</h4>
          <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
            Your item <span className="text-foreground font-semibold">&ldquo;{title}&rdquo;</span> was validated.
            Full persistent creation for tasks, projects, and notes will be activated in Phase 3
            following database schema approval.
          </p>
          <Button variant="primary" size="sm" onClick={handleReset}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-2">Select Item Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedType('task')}
                className={`rounded-xl border p-2 text-xs font-semibold text-center transition-all ${
                  selectedType === 'task'
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-surface text-muted hover:text-foreground'
                }`}
              >
                📋 Task
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('project')}
                className={`rounded-xl border p-2 text-xs font-semibold text-center transition-all ${
                  selectedType === 'project'
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-surface text-muted hover:text-foreground'
                }`}
              >
                📁 Project
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('note')}
                className={`rounded-xl border p-2 text-xs font-semibold text-center transition-all ${
                  selectedType === 'note'
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-surface text-muted hover:text-foreground'
                }`}
              >
                📝 Note
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('doc')}
                className={`rounded-xl border p-2 text-xs font-semibold text-center transition-all ${
                  selectedType === 'doc'
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-surface text-muted hover:text-foreground'
                }`}
              >
                📚 Doc
              </button>
            </div>
          </div>

          <Input
            label="Title / Summary"
            placeholder={`Enter ${selectedType} title...`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Textarea
            label="Context / Details (Optional)"
            placeholder="Add relevant notes, deadlines, or objectives..."
            rows={3}
          />

          <div className="rounded-xl border border-border bg-surface/60 p-3 text-xs text-muted flex items-start gap-2">
            <span className="text-accent font-bold">ℹ</span>
            <p>
              Phase 2 Preview: Schema specification for work management is staged in
              <code className="text-accent ml-1 font-mono text-[11px]">supabase/proposed_work_management_schema.sql</code>.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={handleReset}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Create Item
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
