import Link from 'next/link'
import { Wordmark } from '@/components/social/wordmark'
import { marketingNav } from '@/lib/social-navigation'

export function LandingFooter() {
  const liveLinks = marketingNav.filter((item) => item.status === 'live' && item.href)
  const soonLinks = marketingNav.filter((item) => item.status === 'soon')

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-14">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Link href="/" className="inline-flex rounded-md" aria-label="Commun.dev home">
              <Wordmark size="lg" />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
              A global developer community to discover people, share technical
              knowledge, showcase projects, and grow professionally.
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
              Discover. Connect. Create. Collaborate. Earn.
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Explore
            </p>
            <ul className="mt-3 space-y-2">
              {liveLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href as string}
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              In development
            </p>
            <ul className="mt-3 space-y-2">
              {soonLinks.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm text-muted">
                  {item.label}
                  <span className="rounded border border-border px-1 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-subtle">
                    Soon
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
            © 2026 Commun.dev. All rights reserved.
          </p>
          <p className="font-mono text-[10px] text-muted">
            Built for developers, in public.
          </p>
        </div>
      </div>
    </footer>
  )
}
