'use client'

import React from 'react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border bg-card text-muted">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Link
              href="/"
              className="inline-flex items-baseline font-mono text-2xl font-bold tracking-tight text-foreground"
            >
              commun<span className="text-accent">.</span>
            </Link>
            <p className="text-sm text-muted max-w-sm leading-relaxed">
              One workspace. Better work. More time.
              <br />
              Commun brings project orchestration, meeting notes, knowledge management,
              and team learning into one unified SaaS platform.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse-subtle" />
                One workspace for better work
              </span>
            </div>
          </div>

          {/* Product Column */}
          <div className="space-y-3">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              Product
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#capabilities" className="hover:text-foreground transition-colors">
                  Workspaces
                </a>
              </li>
              <li>
                <a href="#capabilities" className="hover:text-foreground transition-colors">
                  Projects & Tasks
                </a>
              </li>
              <li>
                <a href="#capabilities" className="hover:text-foreground transition-colors">
                  Meeting Notes
                </a>
              </li>
              <li>
                <a href="#capabilities" className="hover:text-foreground transition-colors">
                  Knowledge Base
                </a>
              </li>
              <li>
                <a href="#capabilities" className="hover:text-foreground transition-colors">
                  Learning Tracks
                </a>
              </li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div className="space-y-3">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              Solutions
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#solutions" className="hover:text-foreground transition-colors">
                  Corporate Teams
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-foreground transition-colors">
                  Managers & Leaders
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-foreground transition-colors">
                  L&D Leaders
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-foreground transition-colors">
                  Individual Pros
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-foreground transition-colors">
                  Students & Learners
                </a>
              </li>
            </ul>
          </div>

          {/* Company & Resources Column */}
          <div className="space-y-3">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              Company & Legal
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#product" className="hover:text-foreground transition-colors">
                  About Commun
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-foreground transition-colors">
                  Pricing Overview
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-foreground transition-colors">
                  Contact Team
                </a>
              </li>
              <li>
                <span className="text-muted/60">Privacy Policy (Coming Soon)</span>
              </li>
              <li>
                <span className="text-muted/60">Terms of Service (Coming Soon)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted">
          <p>© {new Date().getFullYear()} Commun SaaS Inc. All rights reserved.</p>
          <p>Engineered for clarity, security, and human focus.</p>
        </div>
      </div>
    </footer>
  )
}

