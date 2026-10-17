import { getAuthContext } from '@/lib/auth'
import { enforceRateLimit } from '@/lib/rate-limit'
import { getStripe, siteUrl } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const context = await getAuthContext()
  if (!context) return Response.json({ error: 'Sign in to manage billing.' }, { status: 401 })

  const limit = await enforceRateLimit(`portal:${context.user.id}`, 'billing-portal', 5, '1 m')
  if (!limit.success) return Response.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 })

  const stripe = getStripe()
  if (!stripe) return Response.json({ error: 'Payments are not configured on this deployment.' }, { status: 503 })

  const supabase = await createClient()
  const { data: customerRow } = await supabase.from('billing_customers').select('stripe_customer_id').eq('user_id', context.user.id).maybeSingle()
  if (!customerRow) return Response.json({ error: 'No billing account found yet.' }, { status: 404 })

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerRow.stripe_customer_id,
      return_url: `${siteUrl()}/memberships`,
    })
    if (!portal.url) return Response.json({ error: 'Billing portal unavailable.' }, { status: 502 })
    return Response.json({ url: portal.url })
  } catch {
    return Response.json({ error: 'Billing portal unavailable.' }, { status: 502 })
  }
}