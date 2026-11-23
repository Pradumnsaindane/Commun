import Stripe from 'stripe'
import { isConfiguredValue } from '@/lib/env'

let client: Stripe | null = null

export function stripeSecretKey() {
  return isConfiguredValue(process.env.STRIPE_SECRET_KEY) ? process.env.STRIPE_SECRET_KEY : ''
}

export function isStripeConfigured() {
  return stripeSecretKey().startsWith('sk_') && isConfiguredValue(process.env.STRIPE_WEBHOOK_SECRET)
}

export function hasMembershipPrice() {
  return isConfiguredValue(process.env.STRIPE_PRICE_MEMBERSHIP_MONTHLY)
}

export function canBill() {
  return isStripeConfigured() && hasMembershipPrice()
}

export function getStripe(): Stripe | null {
  const key = stripeSecretKey()
  if (!key.startsWith('sk_')) return null
  if (!client) client = new Stripe(key)
  return client
}

export function stripeWebhookSecret() {
  return isConfiguredValue(process.env.STRIPE_WEBHOOK_SECRET) ? process.env.STRIPE_WEBHOOK_SECRET : ''
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
}