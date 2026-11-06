'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-32" id="testimonials">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4">
            Customer Stories
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Trusted by teams focused on execution.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            We are currently piloting Commun with selected enterprise teams and organizations.
            Genuine verified case studies and impact metrics will be published here as pilots conclude.
          </p>
        </div>

        {/* Masonry Placeholder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-dashed border-border/80 bg-surface/40 p-8 flex flex-col justify-between">
            <div>
              <Badge variant="muted" className="mb-4">
                Enterprise Pilot Program
              </Badge>
              <h3 className="text-base font-semibold text-foreground">
                Customer stories coming soon
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
                Pilot case study currently documenting how cross-functional engineering and operations
                teams unified sprint deliverables with architecture knowledge.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border/60 flex items-center gap-3">
              <div className="size-8 rounded-full bg-border flex items-center justify-center font-mono text-xs text-muted">
                P1
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Pilot Partner 01</p>
                <p className="text-[10px] text-muted">Software & Cloud Services</p>
              </div>
            </div>
          </Card>

          <Card className="border-dashed border-border/80 bg-surface/40 p-8 flex flex-col justify-between">
            <div>
              <Badge variant="muted" className="mb-4">
                L&D Case Study
              </Badge>
              <h3 className="text-base font-semibold text-foreground">
                Customer stories coming soon
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
                Ongoing study evaluating time-to-productivity for new hires onboarded via structured
                Commun learning tracks and integrated playbooks.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border/60 flex items-center gap-3">
              <div className="size-8 rounded-full bg-border flex items-center justify-center font-mono text-xs text-muted">
                P2
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Pilot Partner 02</p>
                <p className="text-[10px] text-muted">Professional Education</p>
              </div>
            </div>
          </Card>

          <Card className="border-dashed border-border/80 bg-surface/40 p-8 flex flex-col justify-between">
            <div>
              <Badge variant="muted" className="mb-4">
                Operations Review
              </Badge>
              <h3 className="text-base font-semibold text-foreground">
                Customer stories coming soon
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
                Measuring reductions in recurring status meetings and unassigned action items across
                distributed business operations.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border/60 flex items-center gap-3">
              <div className="size-8 rounded-full bg-border flex items-center justify-center font-mono text-xs text-muted">
                P3
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Pilot Partner 03</p>
                <p className="text-[10px] text-muted">Business Consulting</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Transparent Note */}
        <div className="mt-10 text-center">
          <p className="font-mono text-xs text-subtle">
            ● Policy note: Commun does not display fabricated endorsements or fictitious customer quotations.
          </p>
        </div>
      </div>
    </section>
  )
}

