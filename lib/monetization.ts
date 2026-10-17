import { z } from 'zod'

export const ACCESS_LEVELS = ['FREE', 'MEMBERS'] as const
export type AccessLevel = (typeof ACCESS_LEVELS)[number]

export const MEMBERSHIP_STATUSES = ['incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused'] as const
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number]

export const ACCESSIBLE_STATUSES: MembershipStatus[] = ['active', 'trialing']

export type MembershipRecord = {
  subscriber_id: string
  creator_id: string
  status: string
  stripe_subscription_id: string
  current_period_end: string | null
}

export function platformFeePercent(raw: unknown = process.env.STRIPE_PLATFORM_FEE_PERCENT): number {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return 10
  return Math.min(100, Math.max(0, Math.floor(parsed)))
}

export function isMembershipActive(membership: Pick<MembershipRecord, 'status' | 'current_period_end'> | null, now: Date = new Date()): boolean {
  if (!membership) return false
  if (!ACCESSIBLE_STATUSES.includes(membership.status as MembershipStatus)) return false
  if (!membership.current_period_end) return membership.status === 'active'
  return new Date(membership.current_period_end).getTime() > now.getTime()
}

export function canAccessPost(input: { accessLevel: string; authorId: string; viewerId: string | null; membershipActive: boolean }): boolean {
  if (input.accessLevel !== 'MEMBERS') return true
  if (input.viewerId && input.viewerId === input.authorId) return true
  return input.membershipActive
}

export type MembershipState = 'guest' | 'owner' | 'member' | 'none'

export function membershipState(input: { viewerId: string | null; authorId: string; accessLevel: string; membershipActive: boolean }): MembershipState {
  if (input.accessLevel !== 'MEMBERS') return 'none'
  if (!input.viewerId) return 'guest'
  if (input.viewerId === input.authorId) return 'owner'
  return input.membershipActive ? 'member' : 'none'
}

export function membershipLabel(state: MembershipState): string {
  return state === 'member' ? 'Member' : state === 'owner' ? 'Your publication' : state === 'guest' ? 'Sign in to subscribe' : 'Become a member'
}

export function membershipStateTone(state: MembershipState): 'neutral' | 'accent' | 'danger' {
  return state === 'member' ? 'accent' : state === 'none' ? 'danger' : 'neutral'
}

export function splitGross(grossCents: number, feePercent: number = platformFeePercent()) {
  const gross = Math.max(0, Math.round(grossCents))
  const clamped = Math.min(100, Math.max(0, Math.floor(feePercent)))
  const platformFee = Math.floor((gross * clamped) / 100)
  return { gross, platformFee, creatorNet: gross - platformFee }
}

const CURRENCY_SYMBOLS: Record<string, string> = { usd: '$', eur: '€', gbp: '£', inr: '₹' }

export function formatMoney(cents: number, currency: string = 'usd'): string {
  const code = currency.toLowerCase()
  const symbol = CURRENCY_SYMBOLS[code] ?? ''
  const amount = (Math.max(0, Math.round(cents)) / 100).toFixed(2)
  return symbol ? `${symbol}${amount}` : `${amount} ${code.toUpperCase()}`
}

export function membershipStateSummary(memberships: Pick<MembershipRecord, 'status'>[] | null | undefined) {
  const rows = memberships ?? []
  return {
    total: rows.length,
    active: rows.filter((row) => ACCESSIBLE_STATUSES.includes(row.status as MembershipStatus)).length,
  }
}

export function canPublishMembersOnly(profile: { status?: string } | null): boolean {
  return profile?.status === 'ACTIVE'
}

export function gatedPostPayload<T extends { body: string }>(post: T, allowed: boolean) {
  if (allowed) return { post, gated: false }
  return { post: { ...post, body: '' }, gated: true }
}

export async function membershipFor(supabase: any, readerId: string | null, creatorId: string) {
  if (!readerId || readerId === creatorId) return null
  const { data } = await supabase
    .from('memberships')
    .select('status,current_period_end,subscriber_id,creator_id,stripe_subscription_id')
    .eq('subscriber_id', readerId)
    .eq('creator_id', creatorId)
    .maybeSingle()
  return data ?? null
}

export async function hasActiveMembership(supabase: any, readerId: string | null, creatorId: string): Promise<boolean> {
  return isMembershipActive(await membershipFor(supabase, readerId, creatorId))
}

export async function canViewPost(supabase: any, post: { access_level?: string | null; author_id: string }, viewerId: string | null): Promise<boolean> {
  if ((post.access_level ?? 'FREE') !== 'MEMBERS') return true
  if (viewerId && viewerId === post.author_id) return true
  return hasActiveMembership(supabase, viewerId, post.author_id)
}

export const checkoutRequestSchema = z.object({ creatorId: z.string().uuid() })

export function checkoutErrorMessage(error: unknown): string {
  if (error instanceof StripeAccountError) return error.message
  return 'Unable to start checkout right now.'
}

export class StripeAccountError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StripeAccountError'
  }
}

export type CreatorAccountState = {
  ready: boolean
  detailsSubmitted: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
}

export function accountStatus(account: { details_submitted: boolean; charges_enabled: boolean; payouts_enabled?: boolean } | null): CreatorAccountState {
  const detailsSubmitted = Boolean(account?.details_submitted)
  const chargesEnabled = Boolean(account?.charges_enabled)
  const payoutsEnabled = Boolean(account?.payouts_enabled)
  return { ready: detailsSubmitted && chargesEnabled, detailsSubmitted, chargesEnabled, payoutsEnabled }
}

export function isConnectReady(account: { details_submitted: boolean; charges_enabled: boolean } | null): boolean {
  return accountStatus(account).ready
}