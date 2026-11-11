import type { ReactNode } from 'react'
import Link from 'next/link'
import { LandingHeader } from '@/components/social/landing/landing-header'
import { LandingFooter } from '@/components/social/landing/landing-footer'
import {
  ArticlePreview,
  CommunityPreview,
  ConversationPreview,
  FeedPreview,
  HeroPreview,
  JobsPreview,
  ProjectPreview,
} from '@/components/social/landing/landing-previews'

type SectionStatus = 'live' | 'soon' | 'mixed'

type SectionShellProps = {
  id: string
  index: string
  eyebrow: string
  title: string
  description: string
  visual: ReactNode
  children?: ReactNode
  status?: SectionStatus
  tone?: 'surface' | 'base'
  stacked?: boolean
}

function StatusPill({ status }: { status: SectionStatus }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/25 bg-emerald-500/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-300">
        <span className="size-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
        Live today
      </span>
    )
  }

  if (status === 'mixed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-accent">
        <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
        Partly live
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
      <span className="size-1.5 rounded-full bg-subtle" aria-hidden="true" />
      In development
    </span>
  )
}

function PrimaryAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
    >
      {children}
    </Link>
  )
}

function SecondaryAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-accent"
    >
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  )
}

function CapabilityList({
  items,
}: {
  items: { label: string; detail: string; status?: string }[]
}) {
  return (
    <dl className="mt-8 divide-y divide-border border-y border-border">
      {items.map((item, index) => (
        <div key={item.label} className="flex gap-4 py-3.5">
          <span
            aria-hidden="true"
            className="mt-0.5 font-mono text-[10px] tabular-nums text-subtle"
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <dt className="text-sm font-medium text-foreground">{item.label}</dt>
            <dd className="mt-0.5 text-[13px] leading-5 text-muted">{item.detail}</dd>
          </div>
          {item.status && (
            <span className="ml-auto shrink-0 self-start rounded border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-subtle">
              {item.status}
            </span>
          )}
        </div>
      ))}
    </dl>
  )
}

function SectionShell({
  id,
  index,
  eyebrow,
  title,
  description,
  visual,
  children,
  status,
  tone = 'base',
  stacked = false,
}: SectionShellProps) {
  const background = tone === 'surface' ? 'bg-surface' : 'bg-background'
  const layout = stacked
    ? 'grid gap-10'
    : 'grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-14'

  return (
    <section id={id} className={`scroll-mt-20 border-b border-border ${background}`}>
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            {index} / {eyebrow}
          </p>
          {status && <StatusPill status={status} />}
        </div>

        <div className={`mt-7 ${layout}`}>
          <div className="min-w-0">
            <h2 className="max-w-[22ch] text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.14] tracking-[-0.03em] text-foreground">
              {title}
            </h2>
            <p className="mt-4 max-w-[48ch] text-[15px] leading-[1.7] text-muted sm:text-base">
              {description}
            </p>
            {children}
          </div>
          <div className="min-w-0">{visual}</div>
        </div>
      </div>
    </section>
  )
}

export function SocialLandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]"
      >
        Skip to content
      </a>

      <LandingHeader />

      <main id="main-content" className="flex-1">
        <section className="border-b border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-14">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                  Developer network · Built in public
                </p>
                <h1 className="mt-5 max-w-[17ch] text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-foreground">
                  Where developers connect, build, and grow together.
                </h1>
                <p className="mt-5 max-w-[54ch] text-[clamp(1.0625rem,0.98rem+0.4vw,1.1875rem)] leading-[1.7] text-muted">
                  Discover developers, share your code, publish technical knowledge,
                  showcase your projects, and find your community in one place.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                  <PrimaryAction href="/register">Join the community</PrimaryAction>
                  <SecondaryAction href="/discover">Explore developers</SecondaryAction>
                </div>

                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                  Free to join · Profiles, articles, and discussions are live
                </p>
              </div>

              <div className="min-w-0">
                <HeroPreview />
              </div>
            </div>
          </div>
        </section>

        <SectionShell
          id="feed"
          index="01"
          eyebrow="Home feed"
          title="A feed built around the work you care about."
          description="Follow developers, keep up with technical writing, and join discussions without losing your place. Commun is designed for signal, not noise."
          status="live"
          tone="base"
          stacked
          visual={<FeedPreview />}
        >
          <CapabilityList
            items={[
              {
                label: 'Following and latest',
                detail: 'A personal stream from developers you follow, plus a chronological view across Commun.',
              },
              {
                label: 'Topics and discovery',
                detail: 'Explore technologies, published articles, and open discussions by interest.',
              },
              {
                label: 'Saved reading',
                detail: 'Keep articles worth returning to in a private reading list.',
              },
              {
                label: 'Ranked recommendations',
                detail: 'A transparent, preference-aware ranking model is in development.',
                status: 'Soon',
              },
            ]}
          />
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <PrimaryAction href="/feed">Open your feed</PrimaryAction>
            <SecondaryAction href="/explore">Explore topics</SecondaryAction>
          </div>
        </SectionShell>

        <SectionShell
          id="articles"
          index="02"
          eyebrow="Articles & publishing"
          title="Publish technical knowledge that lasts."
          description="Write long-form articles in Markdown, include code, tag the technologies involved, and publish when the draft is ready."
          status="live"
          tone="surface"
          visual={<ArticlePreview />}
        >
          <CapabilityList
            items={[
              {
                label: 'Markdown and code',
                detail: 'Structured writing with code blocks, lists, quotes, and links.',
              },
              {
                label: 'Drafts and publishing',
                detail: 'Save work privately, then publish it to the community when it is ready.',
              },
              {
                label: 'Topics and tags',
                detail: 'Connect articles to technologies so readers can find related work.',
              },
              {
                label: 'Members-only writing',
                detail: 'Creators can publish gated articles backed by Stripe memberships.',
                status: 'Live',
              },
            ]}
          />
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <PrimaryAction href="/search?type=articles">Read articles</PrimaryAction>
            <SecondaryAction href="/write">Start writing</SecondaryAction>
          </div>
        </SectionShell>

        <SectionShell
          id="communities"
          index="03"
          eyebrow="Communities"
          title="Find the rooms where your stack lives."
          description="Dedicated spaces for frontend, backend, AI, DevOps, security, open source, and the technologies your team depends on."
          status="soon"
          tone="base"
          visual={<CommunityPreview />}
        >
          <CapabilityList
            items={[
              {
                label: 'Community spaces',
                detail: 'A home for discussions, resources, and announcements around a technology or practice.',
              },
              {
                label: 'Roles and moderation',
                detail: 'Owners, moderators, and members with clear permissions.',
              },
              {
                label: 'Channels and threads',
                detail: 'Focused conversations without mixing every topic together.',
              },
            ]}
          />
          <p className="mt-6 max-w-[46ch] font-mono text-[10px] leading-relaxed text-muted">
            Communities are in development. Discussions are available today as a
            single, shared forum.
          </p>
          <div className="mt-6">
            <SecondaryAction href="/discussions">Open discussions</SecondaryAction>
          </div>
        </SectionShell>

        <SectionShell
          id="projects"
          index="04"
          eyebrow="Projects & code"
          title="Show what you build, not just what you say."
          description="A project showcase for repositories, live demos, architecture notes, and the decisions behind the code. This is a showcase, not a task tracker."
          status="soon"
          tone="surface"
          visual={<ProjectPreview />}
        >
          <CapabilityList
            items={[
              {
                label: 'Repository and demo links',
                detail: 'Connect the source, the running product, and the story behind them.',
              },
              {
                label: 'Technology context',
                detail: 'Show the stack, the constraints, and the parts worth discussing.',
              },
              {
                label: 'Contributor discovery',
                detail: 'Open-source maintainers can describe the help they need.',
              },
            ]}
          />
          <p className="mt-6 font-mono text-[10px] leading-relaxed text-muted">
            Project showcases are in development. No repositories are imported or
            displayed yet.
          </p>
        </SectionShell>

        <SectionShell
          id="networking"
          index="05"
          eyebrow="Networking & messaging"
          title="Build a network with context."
          description="Follow developers whose work you learn from, understand what they are building, and start conversations from shared technical ground."
          status="mixed"
          tone="base"
          visual={<ConversationPreview />}
        >
          <CapabilityList
            items={[
              {
                label: 'Developer profiles',
                detail: 'Identity, interests, links, and published work in one place.',
                status: 'Live',
              },
              {
                label: 'Following and discovery',
                detail: 'Find developers by name, interests, and the work they share.',
                status: 'Live',
              },
              {
                label: 'Direct messaging',
                detail: 'One-to-one and group conversations with persisted history.',
                status: 'Soon',
              },
              {
                label: 'Collaboration requests',
                detail: 'A clear way to ask for help, feedback, or a collaborator.',
                status: 'Soon',
              },
            ]}
          />
          <div className="mt-8">
            <PrimaryAction href="/discover">Explore developers</PrimaryAction>
          </div>
        </SectionShell>

        <SectionShell
          id="jobs"
          index="06"
          eyebrow="Jobs & careers"
          title="Turn technical work into the next opportunity."
          description="A job board designed around engineering reality: the stack, the work arrangement, and the team — with applications that stay transparent."
          status="soon"
          tone="surface"
          visual={<JobsPreview />}
        >
          <CapabilityList
            items={[
              {
                label: 'Engineering-first listings',
                detail: 'Roles described by stack, scope, location, and work arrangement.',
              },
              {
                label: 'Applications with status',
                detail: 'Track where an application stands instead of guessing.',
              },
              {
                label: 'Recruiter discovery',
                detail: 'Candidate visibility is explicit and controlled by the developer.',
              },
            ]}
          />
          <p className="mt-6 max-w-[46ch] font-mono text-[10px] leading-relaxed text-muted">
            The job board and recruiter tools are in development. No jobs or
            companies are listed on Commun today.
          </p>
        </SectionShell>

        <SectionShell
          id="creators"
          index="07"
          eyebrow="Creator opportunities"
          title="Earn from the knowledge you share."
          description="Technical writing deserves a durable model. Commun supports creator memberships and members-only articles on top of Stripe, with an earnings ledger behind them."
          status="mixed"
          tone="base"
          visual={
            <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                Creator infrastructure
              </p>
              <div className="mt-4 divide-y divide-border border-y border-border">
                {[
                  { label: 'Recurring memberships', state: 'Implemented' },
                  { label: 'Members-only articles', state: 'Implemented' },
                  { label: 'Earnings ledger', state: 'Implemented' },
                  { label: 'One-time purchases', state: 'In development' },
                  { label: 'Services and freelance', state: 'In development' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 py-3">
                    <span className="text-sm text-foreground">{item.label}</span>
                    <span
                      className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] ${
                        item.state === 'Implemented'
                          ? 'border-emerald-600/25 text-emerald-300'
                          : 'border-border text-subtle'
                      }`}
                    >
                      {item.state}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] leading-5 text-muted">
                Membership availability depends on creator billing configuration.
                Payout eligibility, fees, refunds, and tax handling are subject to
                provider and legal review.
              </p>
            </div>
          }
        >
          <CapabilityList
            items={[
              {
                label: 'Memberships',
                detail: 'Recurring support for a creator, handled through Stripe Checkout.',
              },
              {
                label: 'Gated articles',
                detail: 'Entitlement is checked on the server before the body is returned.',
              },
              {
                label: 'Transparent earnings',
                detail: 'A ledger records paid invoices, platform fees, and creator net.',
              },
            ]}
          />
          <div className="mt-8">
            <PrimaryAction href="/register">Create your profile</PrimaryAction>
          </div>
        </SectionShell>

        <SectionShell
          id="integrations"
          index="08"
          eyebrow="Integrations"
          title="Connect the places you already build."
          description="Commun should meet developers where their work already lives. Public engineering news is live today; account linking and content import come next."
          status="mixed"
          tone="surface"
          visual={
            <div className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                Provider status
              </p>
              <div className="mt-4 divide-y divide-border border-y border-border">
                {[
                  {
                    provider: 'Engineering news feeds',
                    detail: 'Public technical sources, linked to the original article.',
                    state: 'Live',
                  },
                  {
                    provider: 'GitHub',
                    detail: 'OAuth, repository linking, and contribution metadata.',
                    state: 'Planned',
                  },
                  {
                    provider: 'DEV Community',
                    detail: 'Authorised article import with canonical attribution.',
                    state: 'Planned',
                  },
                  {
                    provider: 'LinkedIn',
                    detail: 'Profile links only, with no automated data scraping.',
                    state: 'Planned',
                  },
                ].map((item) => (
                  <div key={item.provider} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">{item.provider}</span>
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] ${
                          item.state === 'Live'
                            ? 'border-emerald-600/25 text-emerald-300'
                            : 'border-border text-subtle'
                        }`}
                      >
                        {item.state}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-muted">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <p className="mt-6 max-w-[46ch] font-mono text-[10px] leading-relaxed text-muted">
            Integrations are announced only when their technical and legal
            capabilities are verified. No account-connection button is shown until
            OAuth is configured.
          </p>
          <div className="mt-6">
            <SecondaryAction href="/news">Read developer news</SecondaryAction>
          </div>
        </SectionShell>

        <section className="bg-foreground text-background">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/60">
                Join Commun.dev
              </p>
              <h2 className="mt-4 max-w-[22ch] text-[clamp(1.9rem,3.6vw,3rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
                Your next collaborator is already building.
              </h2>
              <p className="mt-4 max-w-[50ch] text-[15px] leading-[1.7] text-background/70 sm:text-base">
                Create a developer identity, publish what you know, and find the
                people and opportunities that move your work forward.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/register"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                Join the community
              </Link>
              <Link
                href="/discover"
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-background/25 px-5 text-sm font-semibold text-background transition-colors hover:bg-background/10"
              >
                Explore developers
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
