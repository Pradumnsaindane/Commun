import { createAdminClient } from '@/lib/admin'
import { getAuthContext } from '@/lib/auth'
import { accountStatus } from '@/lib/monetization'
import { enforceRateLimit } from '@/lib/rate-limit'
import { getStripe, siteUrl } from '@/lib/stripe'
import { logServer } from '@/lib/logger'

export async function GET() {
  const context = await getAuthContext()
  if (!context) return Response.json({ error: 'Sign in to view earnings.' }, { status: 401 })
  const admin = createAdminClient()
  const { data: account } = await admin.from('creator_accounts').select('stripe_account_id,details_submitted,charges_enabled,payouts_enabled').eq('user_id', context.user.id).maybeSingle()
  const { data: memberships } = await admin.from('memberships').select('id,status').eq('creator_id', context.user.id)
  const active = (memberships ?? []).filter((row) => row.status === 'active' || row.status === 'trialing').length
  return Response.json({ account: accountStatus(account ?? null), members: active })
}

export async function POST() {
  const context = await getAuthContext()
  if (!context) return Response.json({ error: 'Sign in to set up payouts.' }, { status: 401 })
  if (context.status !== 'ACTIVE') return Response.json({ error: 'Your account must be active to receive payouts.' }, { status: 403 })

  const limit = await enforceRateLimit(`connect:${context.user.id}`, 'billing-connect', 5, '1 m')
  if (!limit.success) return Response.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 })

  const stripe = getStripe()
  if (!stripe) return Response.json({ error: 'Payments are not configured on this deployment.' }, { status: 503 })

  const admin = createAdminClient()
  try {
    let { data: account } = await admin.from('creator_accounts').select('stripe_account_id,updated_at').eq('user_id', context.user.id).maybeSingle()
    if (!account) {
      const created = await stripe.accounts.create({
        type: 'express',
        capabilities: { transfers: { requested: true } },
        metadata: { user_id: context.user.id },
      })
      const { error } = await admin.from('creator_accounts').insert({
        user_id: context.user.id,
        stripe_account_id: created.id,
        details_submitted: created.details_submitted ?? false,
        charges_enabled: created.charges_enabled ?? false,
        payouts_enabled: created.payouts_enabled ?? false,
      })
      if (error) {
        logServer('error', 'billing.connect.persist_failed', { userId: context.user.id })
        return Response.json({ error: 'Unable to save payout account.' }, { status: 500 })
      }
      account = { stripe_account_id: created.id, updated_at: new Date().toISOString() }
    }

    const link = await stripe.accountLinks.create({
      account: account.stripe_account_id,
      type: 'account_onboarding',
      refresh_url: `${siteUrl()}/earnings?onboarding=refresh`,
      return_url: `${siteUrl()}/earnings?onboarding=return`,
    })
    if (!link.url) return Response.json({ error: 'Onboarding link unavailable.' }, { status: 502 })
    logServer('info', 'billing.connect.started', { userId: context.user.id })
    return Response.json({ url: link.url })
  } catch {
    return Response.json({ error: 'Unable to start payout setup.' }, { status: 502 })
  }
}