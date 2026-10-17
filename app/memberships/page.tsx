import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isMembershipActive, type MembershipStatus } from '@/lib/monetization'
import { canBill } from '@/lib/stripe'
import { PageContainer } from '@/components/ui/primitives'
import { StatusBadge, Surface } from '@/components/ui/product-surfaces'
import { ManageBilling } from '@/components/billing/manage-billing'

export const metadata = { title: 'Memberships — Commun' }

export default async function MembershipsPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/memberships')
  const { checkout } = await searchParams

  const { data: memberships } = await supabase
    .from('memberships')
    .select('id,creator_id,status,current_period_end,cancel_at_period_end,created_at')
    .eq('subscriber_id', user.id)
    .order('created_at', { ascending: false })

  const rows = memberships ?? []
  const creatorIds = rows.map((row) => row.creator_id)
  type CreatorRow = { id: string; display_name: string; username: string | null }
  let creators: CreatorRow[] = []
  if (creatorIds.length) {
    const { data } = await supabase.from('profiles').select('id,display_name,username').in('id', creatorIds)
    creators = (data ?? []) as CreatorRow[]
  }
  const creatorById = new Map(creators.map((creator) => [creator.id, creator]))

  return (
    <PageContainer eyebrow="Your billing" title="Memberships" description="Every creator membership you pay for, with its live status from Stripe.">
      {checkout === 'success' && (
        <Surface className="border-accent/40 p-5"><p className="text-sm text-accent">Checkout complete. Your membership activates as soon as Stripe confirms the first payment.</p></Surface>
      )}
      {checkout === 'canceled' && (
        <Surface className="p-5"><p className="text-sm text-muted">Checkout canceled — you were not charged.</p></Surface>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{rows.length} membership{rows.length === 1 ? '' : 's'}</p>
        <ManageBilling billingReady={canBill()} />
      </div>
      {rows.length === 0 ? (
        <Surface className="border-dashed p-10 text-center">
          <h2 className="text-base font-semibold">No memberships yet.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Follow creators you learn from, then subscribe to unlock their members-only articles.</p>
          <Link href="/explore" className="mt-5 inline-flex rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background">Discover creators</Link>
        </Surface>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const creator = creatorById.get(row.creator_id)
            const active = isMembershipActive(row as { status: MembershipStatus; current_period_end: string | null })
            const username = creator?.username ?? ''
            return (
              <Surface key={row.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid size-11 place-items-center rounded-full bg-accent/10 font-semibold text-accent">{(creator?.display_name ?? '?').slice(0, 1).toUpperCase()}</span>
                  <div>
                    {username ? <Link href={`/profile/${username}`} className="font-semibold hover:text-accent">{creator?.display_name ?? 'Creator'}</Link> : <p className="font-semibold">{creator?.display_name ?? 'Creator'}</p>}
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                      {row.current_period_end ? `Renews ${new Date(row.current_period_end).toLocaleDateString()}` : 'Status from Stripe'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {row.cancel_at_period_end && <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300">Ends at period end</span>}
                  <StatusBadge tone={active ? 'accent' : 'neutral'}>{active ? (row.status as string) : 'Inactive'}</StatusBadge>
                </div>
              </Surface>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}