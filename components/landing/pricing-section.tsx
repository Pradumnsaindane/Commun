'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <section className="py-20 md:py-32 border-t border-border/80 bg-surface/20" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="accent" className="mb-4">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Simple, predictable pricing for every stage.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            Commercial plans are currently being finalized with our pilot cohort. Flexible tiers
            for individuals, growing teams, and global enterprises will be introduced shortly.
          </p>

          {/* Billing Switcher */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-border bg-surface p-1.5">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'rounded-lg px-4 py-1.5 text-xs font-semibold transition-all',
                billingCycle === 'monthly'
                  ? 'bg-accent/15 text-accent border border-accent/25 shadow-sm'
                  : 'text-muted hover:text-foreground'
              )}
            >
              Billed Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={cn(
                'rounded-lg px-4 py-1.5 text-xs font-semibold transition-all',
                billingCycle === 'yearly'
                  ? 'bg-accent/15 text-accent border border-accent/25 shadow-sm'
                  : 'text-muted hover:text-foreground'
              )}
            >
              Billed Annually
            </button>
          </div>
        </div>

        {/* Pricing Tiers Grid with Honest "Pricing information coming soon" Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter Plan */}
          <Card className="p-8 flex flex-col justify-between border-border bg-card">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
                Starter Tier
              </span>
              <h3 className="mt-2 text-2xl font-bold text-foreground">Individual</h3>
              <p className="mt-2 text-xs text-muted">
                For solo professionals, students, and independent practitioners organizing their work and knowledge.
              </p>

              <div className="my-6 rounded-xl border border-border/80 bg-surface/60 p-4 text-center">
                <p className="text-sm font-semibold text-accent">Pricing information coming soon</p>
                <p className="mt-1 text-[11px] text-muted">Free early access during initial rollout</p>
              </div>

              <ul className="space-y-2.5 text-xs text-muted">
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Personal workspaces & tasks
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Structured meeting & work notes
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Markdown knowledge documentation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Personal learning milestones
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border/80">
              <Button variant="secondary" className="w-full text-xs">
                Join early access list
              </Button>
            </div>
          </Card>

          {/* Team Pro Plan (Featured) */}
          <Card className="p-8 flex flex-col justify-between border-accent/40 bg-surface shadow-glow relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <Badge variant="accent" dot>
                Most Popular
              </Badge>
            </div>

            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold">
                Team Tier
              </span>
              <h3 className="mt-2 text-2xl font-bold text-foreground">Team Pro</h3>
              <p className="mt-2 text-xs text-muted">
                For managers, departments, and fast-moving teams coordinating deliverables and team learning.
              </p>

              <div className="my-6 rounded-xl border border-accent/30 bg-accent/10 p-4 text-center">
                <p className="text-sm font-semibold text-accent">Pricing information coming soon</p>
                <p className="mt-1 text-[11px] text-muted">Tailored per-seat pricing will be announced</p>
              </div>

              <ul className="space-y-2.5 text-xs text-muted">
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Everything in Starter tier
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Multi-member team collaboration
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Shared sprint & milestone tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Team onboarding & training tracks
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Granular workspace access permissions
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border/80">
              <Button variant="primary" className="w-full text-xs font-bold">
                Request team pilot access
              </Button>
            </div>
          </Card>

          {/* Enterprise Plan */}
          <Card className="p-8 flex flex-col justify-between border-border bg-card">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
                Enterprise Tier
              </span>
              <h3 className="mt-2 text-2xl font-bold text-foreground">Organization</h3>
              <p className="mt-2 text-xs text-muted">
                For corporations requiring centralized administration, custom compliance, and dedicated support.
              </p>

              <div className="my-6 rounded-xl border border-border/80 bg-surface/60 p-4 text-center">
                <p className="text-sm font-semibold text-accent">Pricing information coming soon</p>
                <p className="mt-1 text-[11px] text-muted">Custom annual enterprise contracts</p>
              </div>

              <ul className="space-y-2.5 text-xs text-muted">
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Everything in Team Pro
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Unlimited organizational workspaces
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Enterprise SAML / SSO integration
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Dedicated customer success manager
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Custom data retention & audit logging
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border/80">
              <Button variant="secondary" className="w-full text-xs">
                Contact sales for enterprise
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

