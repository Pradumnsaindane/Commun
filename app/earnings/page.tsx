import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'
import { isBillingConfigured, isPhonePeNewProvider } from '@/lib/billing/config'
import { platformFeePercent } from '@/lib/monetization'
import { EarningsDashboard } from '@/components/billing/earnings-dashboard'

export const metadata = { title: 'Earnings — Commun' }

type EarningRow = { id: string; label: string; gross: number; fee: number; net: number; currency: string; status: string; createdAt: string }

export default async function EarningsPage({ searchParams }: { searchParams: Promise<{ onboarding?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/earnings')
  const { onboarding } = await searchParams
  const phonePe = isPhonePeNewProvider()

  const admin = createAdminClient()
  let account: { details_submitted: boolean; charges_enabled: boolean; payouts_enabled: boolean } | null = null
  let stripeMemberships: Array<{ id: string; status: string; current_period_end: string | null }> = []
  let providerMemberships: Array<{ id: string; status: string; paid_through: string | null }> = []
  let stripeEarnings: Array<{ id: string; stripe_invoice_id: string; gross_amount: number; platform_fee_amount: number; net_amount: number; currency: string; status: string; created_at: string }> = []
  let providerEarnings: Array<{ id: string; payment_id: string; gross_amount_minor: number; platform_fee_minor: number; net_amount_minor: number; currency: string; status: string; created_at: string }> = []
  if (admin) {
    const [accountResult, membershipsResult, earningsResult, providerMembershipsResult, providerEarningsResult] = await Promise.all([
      admin.from('creator_accounts').select('details_submitted,charges_enabled,payouts_enabled').eq('user_id', user.id).maybeSingle(),
      admin.from('memberships').select('id,status,current_period_end').eq('creator_id', user.id),
      admin.from('earnings').select('id,stripe_invoice_id,gross_amount,platform_fee_amount,net_amount,currency,status,created_at').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(25),
      admin.from('provider_subscriptions').select('id,status,paid_through').eq('provider', 'phonepe').eq('creator_id', user.id),
      admin.from('provider_ledger_entries').select('id,payment_id,gross_amount_minor,platform_fee_minor,net_amount_minor,currency,status,created_at').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(25),
    ])
    account = accountResult.data ?? null
    stripeMemberships = (membershipsResult.data ?? []) as typeof stripeMemberships
    stripeEarnings = (earningsResult.data ?? []) as typeof stripeEarnings
    providerMemberships = (providerMembershipsResult.data ?? []) as typeof providerMemberships
    providerEarnings = (providerEarningsResult.data ?? []) as typeof providerEarnings
  }

  const earnings: EarningRow[] = [
    ...stripeEarnings.map((row) => ({
      id: row.id,
      label: row.stripe_invoice_id,
      gross: Number(row.gross_amount),
      fee: Number(row.platform_fee_amount),
      net: Number(row.net_amount),
      currency: row.currency,
      status: row.status,
      createdAt: row.created_at,
    })),
    ...providerEarnings.map((row) => ({
      id: row.id,
      label: `PhonePe ${row.payment_id.slice(0, 8)}`,
      gross: Number(row.gross_amount_minor),
      fee: Number(row.platform_fee_minor),
      net: Number(row.net_amount_minor),
      currency: row.currency,
      status: row.status,
      createdAt: row.created_at,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 25)

  const lifetime = earnings.reduce((sum, row) => sum + row.net, 0)
  const activeMembers = [
    ...stripeMemberships.filter((row) => row.status === 'active' || row.status === 'trialing'),
    ...providerMemberships.filter((row) => row.status === 'active'),
  ].length
  const totalMemberships = stripeMemberships.length + providerMemberships.length

  return (
    <EarningsDashboard
      billingReady={isBillingConfigured()}
      feePercent={platformFeePercent()}
      account={phonePe ? null : account}
      activeMembers={activeMembers}
      totalMemberships={totalMemberships}
      lifetimeNetCents={lifetime}
      earnings={earnings}
      onboarding={onboarding ?? null}
      provider={phonePe ? 'phonepe' : 'stripe'}
    />
  )
}
