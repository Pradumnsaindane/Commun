import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'
import { platformFeePercent } from '@/lib/monetization'
import { canBill } from '@/lib/stripe'
import { EarningsDashboard } from '@/components/billing/earnings-dashboard'

export const metadata = { title: 'Earnings — Commun' }

export default async function EarningsPage({ searchParams }: { searchParams: Promise<{ onboarding?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/earnings')
  const { onboarding } = await searchParams

  const admin = createAdminClient()
  const [{ data: account }, { data: memberships }, { data: earnings }] = await Promise.all([
    admin.from('creator_accounts').select('details_submitted,charges_enabled,payouts_enabled').eq('user_id', user.id).maybeSingle(),
    admin.from('memberships').select('id,status,current_period_end').eq('creator_id', user.id),
    admin.from('earnings').select('id,stripe_invoice_id,gross_amount,platform_fee_amount,net_amount,currency,status,created_at').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(25),
  ])

  const rows = earnings ?? []
  const lifetime = rows.reduce((sum, row) => sum + Number(row.net_amount), 0)
  const activeMembers = (memberships ?? []).filter((row) => row.status === 'active' || row.status === 'trialing').length

  return (
    <EarningsDashboard
      billingReady={canBill()}
      feePercent={platformFeePercent()}
      account={account ?? null}
      activeMembers={activeMembers}
      totalMemberships={(memberships ?? []).length}
      lifetimeNetCents={lifetime}
      earnings={rows.map((row) => ({ id: row.id, label: row.stripe_invoice_id, gross: Number(row.gross_amount), fee: Number(row.platform_fee_amount), net: Number(row.net_amount), currency: row.currency, status: row.status, createdAt: row.created_at }))}
      onboarding={onboarding ?? null}
    />
  )
}