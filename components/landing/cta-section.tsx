'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function CtaSection() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,hsla(24,94%,53%,0.12),transparent_70%)] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-border/80 bg-gradient-to-b from-surface/90 to-card/90 p-8 sm:p-14 lg:p-20 text-center shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Subtle decorative grid */}
          <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

          {/* Masonry Mockup Preview Cards (Decorative Floating Previews) */}
          <div className="pointer-events-none absolute -left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4 opacity-40">
            <div className="w-56 rounded-xl border border-border bg-surface p-3 text-left shadow-lg">
              <span className="font-mono text-[9px] text-accent">PROJECT SPRINT</span>
              <p className="text-xs font-semibold text-foreground mt-1">Multi-Region Storage Sync</p>
              <div className="mt-2 h-1.5 w-full rounded bg-border">
                <div className="h-1.5 w-3/4 rounded bg-accent" />
              </div>
            </div>
            <div className="w-56 rounded-xl border border-border bg-surface p-3 text-left shadow-lg">
              <span className="font-mono text-[9px] text-emerald-400">MEETING ACTION</span>
              <p className="text-xs font-semibold text-foreground mt-1">Security Audit Sign-off</p>
              <span className="text-[10px] text-emerald-400">✓ Delegated</span>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4 opacity-40">
            <div className="w-56 rounded-xl border border-border bg-surface p-3 text-left shadow-lg">
              <span className="font-mono text-[9px] text-brand-indigo">RUNBOOK DOC</span>
              <p className="text-xs font-semibold text-foreground mt-1">Incident Escalation Matrix</p>
              <span className="text-[10px] text-muted">Verified standard</span>
            </div>
            <div className="w-56 rounded-xl border border-border bg-surface p-3 text-left shadow-lg">
              <span className="font-mono text-[9px] text-accent">LEARNING TRACK</span>
              <p className="text-xs font-semibold text-foreground mt-1">Systems Architecture</p>
              <span className="text-[10px] text-muted">Module 4 Complete</span>
            </div>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <Badge variant="accent" className="mb-6">
              One Workspace. Better Work. More Time.
            </Badge>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
              Ready to bring clarity and momentum to your work?
            </h2>

            <p className="mt-6 text-base sm:text-lg text-muted max-w-xl mx-auto leading-relaxed">
              Join forward-thinking teams and professionals who organize projects, knowledge,
              and learning together with Commun.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto px-8 font-bold">
                  Get started free <span className="ml-1 text-base">→</span>
                </Button>
              </Link>
              <a href="#contact">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto px-6">
                  Talk to our team
                </Button>
              </a>
            </div>

            <p className="mt-8 font-mono text-xs text-muted">
              Fast onboarding · Role-based security · No credit card required to start
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

