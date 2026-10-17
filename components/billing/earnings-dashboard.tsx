'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageContainer } from '@/components/ui/primitives'
import { StatusBadge, Surface } from '@/components/ui/product-surfaces'
import { formatMoney } from '@/lib/monetization'

type Account = { details_submitted: boolean; charges_enabled: boolean; payouts_enabled: boolean } | null
type EarningRow = { id: string; label: string; gross: number; fee: number; net: number; currency: string; status: string; createdAt: string }

export function EarningsDashboard({ billingReady, feePercent, account, activeMembers, totalMemberships, lifetimeNetCents, earnings, onboarding }: {
  billingReady: boolean
  feePercent: number
  account: Account
  activeMembers: number
  totalMemberships: number
  lifetimeNetCents: number
  earnings: EarningRow[]
  onboarding: string | null
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ready = Boolean(account && account.details_submitted && account.charges_enabled)

  async function startOnboarding() {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/billing/connect', { method: 'POST' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.url) {
        setError(result.error ?? 'Unable to start payout setup.')
        setBusy(false)
        return
      }
      window.location.href = result.url
    } catch {
      setError('Unable to start payout setup.')
      setBusy(false)
    }
  }

  return (
    <PageContainer
      eyebrow="Creator monetization"
      title="Earnings"
      description={`Members pay a monthly membership. Stripe transfers each payment to your connected payout account minus a ${feePercent}% platform fee.`}
    >
      {!billingReady && (
        <Surface className="border-amber-400/30 p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-amber-300">Payments not configured</p>
          <p className="mt-2 text-sm leading-6 text-muted">Add the Stripe secret key, webhook secret, and membership price on the server to enable checkout and payouts.</p>
        </Surface>
      )}

      {onboarding === 'return' && ready && (
        <Surface className="border-accent/40 p-5"><p className="text-sm text-accent">Payout setup finished. It may take a moment for Stripe to confirm your account.</p></Surface>
      )}
      {onboarding === 'refresh' && (
        <Surface className="border-amber-400/30 p-5"><p className="text-sm text-muted">Your onboarding link expired. Start again below.</p></Surface>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Surface className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent">Active members</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{activeMembers}</p>
          <p className="mt-1 font-mono text-xs text-muted">{totalMemberships} lifetime memberships</p>
        </Surface>
        <Surface className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent">Net earnings</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{formatMoney(lifetimeNetCents)}</p>
          <p className="mt-1 font-mono text-xs text-muted">After the {feePercent}% platform fee</p>
        </Surface>
        <Surface className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent">Payout account</p>
          <div className="mt-3"><StatusBadge tone={ready ? 'accent' : 'danger'}>{ready ? 'Payouts enabled' : 'Setup required'}</StatusBadge></div>
          <p className="mt-3 font-mono text-xs text-muted">{account ? (account.payouts_enabled ? 'Stripe pays out on its normal schedule.' : 'Complete onboarding to receive payouts.') : 'No connected account yet.'}</p>
        </Surface>
      </div>

      <Surface className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-accent">Payout setup</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Connect a Stripe payout account so membership revenue can be transferred to you. Subscriptions only become available to readers once this is complete.</p>
            {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
          </div>
          <button type="button" onClick={() => void startOnboarding()} disabled={busy || !billingReady} className="inline-flex shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-50">
            {busy ? 'Redirecting…' : ready ? 'Update payout details' : 'Set up payouts'}
          </button>
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent">Revenue ledger</p>
        </div>
        {earnings.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <h3 className="text-base font-semibold">No membership revenue yet.</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Publish members-only articles, then share your profile. New paid invoices appear here as their webhooks arrive.</p>
            <Link href="/write" className="mt-5 inline-flex rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background">Write a members-only article</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Invoice</th>
                  <th className="px-6 py-3 font-medium">Gross</th>
                  <th className="px-6 py-3 font-medium">Platform fee</th>
                  <th className="px-6 py-3 font-medium">Your share</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="px-6 py-3 whitespace-nowrap text-muted">{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td className="max-w-[10rem] truncate px-6 py-3 font-mono text-xs text-muted">{row.label}</td>
                    <td className="px-6 py-3 whitespace-nowrap">{formatMoney(row.gross, row.currency)}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-muted">−{formatMoney(row.fee, row.currency)}</td>
                    <td className="px-6 py-3 whitespace-nowrap font-semibold text-accent">{formatMoney(row.net, row.currency)}</td>
                    <td className="px-6 py-3"><StatusBadge tone={row.status === 'paid' ? 'accent' : 'neutral'}>{row.status}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </PageContainer>
  )
}