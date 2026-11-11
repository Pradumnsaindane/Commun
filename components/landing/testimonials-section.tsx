'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-32" id="testimonials">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4">Early access</Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Built with teams focused on execution.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            Commun is in early access. Customer stories and outcome data will be published after they are independently verified and approved by the teams involved.
          </p>
        </div>

        <Card className="mx-auto grid max-w-5xl gap-8 border-border bg-card p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-9">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[.14em] text-muted">Customer evidence</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight">Real outcomes take time to verify.</h3>
            <p className="mt-2 text-sm leading-6 text-muted">We’ll share customer perspectives when the work is complete and participants have approved publication. Until then, this space stays focused on the product.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted"><span className="size-2 rounded-full bg-accent" aria-hidden="true" />Early access</span>
        </Card>
      </div>
    </section>
  )
}

