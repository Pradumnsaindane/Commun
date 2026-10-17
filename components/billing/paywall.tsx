import Link from 'next/link'
import { Surface } from '@/components/ui/product-surfaces'
import { SubscribeButton } from './subscribe-button'

export function Paywall({ creatorId, authorName, loginNext, billingReady, state = 'guest' }: { creatorId: string; authorName: string; loginNext: string; billingReady: boolean; state?: 'guest' | 'none' }) {
  return (
    <Surface className="mt-10 border-accent/30 p-6 sm:p-8">
      <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">Members-only article</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">Read the rest with a membership</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
        {authorName} publishes members-only deep dives on Commun. Subscribe to unlock this article and every other members-only piece they publish.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <SubscribeButton creatorId={creatorId} state={state} billingReady={billingReady} />
        {!billingReady && <p className="text-sm text-muted">Payments are not configured on this deployment yet.</p>}
        {state === 'guest' && (
          <Link href={`/login?next=${encodeURIComponent(loginNext)}`} className="font-mono text-xs uppercase tracking-wider text-muted hover:text-accent">
            Sign in first
          </Link>
        )}
      </div>
    </Surface>
  )
}