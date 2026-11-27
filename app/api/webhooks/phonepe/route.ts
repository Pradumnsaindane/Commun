import { createAdminClient } from '@/lib/admin'
import { logServer } from '@/lib/logger'
import { phonePeWebhookConfig } from '@/lib/phonepe/config'
import {
  derivePhonePeEventId,
  isSupportedPhonePeEvent,
  payloadHash,
  phonePeEventTimestamp,
  PHONEPE_WEBHOOK_MAX_BYTES,
  phonePeWebhookSchema,
  verifyPhonePeWebhook,
} from '@/lib/phonepe/webhook'
import {
  findProviderEvent,
  insertProviderEvent,
  resetExpiredProviderEventLease,
  updateProviderEvent,
} from '@/server/repositories/provider-billing'
import { processPhonePeWebhookEvent } from '@/server/modules/billing/providers/phonepe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PROCESSING_LEASE_MS = 5 * 60_000

export async function POST(request: Request) {
  if (!phonePeWebhookConfig()) {
    return Response.json({ error: 'PhonePe webhook is not configured on this deployment.' }, { status: 503 })
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > PHONEPE_WEBHOOK_MAX_BYTES) {
    return new Response('Payload too large', { status: 413 })
  }

  const raw = await request.text()
  if (Buffer.byteLength(raw, 'utf8') > PHONEPE_WEBHOOK_MAX_BYTES) {
    return new Response('Payload too large', { status: 413 })
  }

  const verified = verifyPhonePeWebhook(request.headers, raw)
  if (!verified.ok) {
    logServer('warn', 'phonepe.webhook.invalid_signature', { reason: verified.reason })
    return new Response('Invalid PhonePe webhook signature', { status: 400 })
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }
  const parsed = phonePeWebhookSchema.safeParse(json)
  if (!parsed.success) return new Response('Invalid webhook payload', { status: 400 })

  const admin = createAdminClient()
  if (!admin) return Response.json({ error: 'Payments are not configured on this deployment.' }, { status: 503 })

  const hash = payloadHash(raw)
  const eventAt = phonePeEventTimestamp(parsed.data)
  const eventAtIso = new Date(eventAt).toISOString()
  const eventId = derivePhonePeEventId(parsed.data.event, parsed.data, eventAt)
  const now = Date.now()
  const nowIso = new Date(now).toISOString()
  const leaseExpiresAt = new Date(now + PROCESSING_LEASE_MS).toISOString()

  const claim = await insertProviderEvent(admin, {
    provider: 'phonepe',
    event_id: eventId,
    event_type: parsed.data.event,
    state: parsed.data.payload.state ?? null,
    status: 'received',
    payload_hash: hash,
    event_at: eventAtIso,
    error: null,
    received_at: nowIso,
    lease_expires_at: null,
    processed_at: null,
  })
  if (claim.error) {
    if (claim.error.code !== '23505') {
      logServer('error', 'phonepe.webhook.claim_failed', { code: claim.error.code ?? 'unknown' })
      return new Response('Storage unavailable', { status: 500 })
    }
    const existing = await findProviderEvent(admin, 'phonepe', eventId)
    if (existing.data?.status === 'processed' || existing.data?.status === 'ignored') {
      return Response.json({ received: true, duplicate: true })
    }
    if (existing.data?.status === 'failed') {
      await updateProviderEvent(admin, 'phonepe', eventId, {
        status: 'received',
        error: null,
        lease_expires_at: null,
      })
    } else if (existing.data?.status === 'processing') {
      const leaseAt = existing.data.lease_expires_at
        ? Date.parse(existing.data.lease_expires_at)
        : Number.NaN
      if (Number.isFinite(leaseAt) && leaseAt > now) {
        return Response.json({ received: true, duplicate: true })
      }
      const recovered = await resetExpiredProviderEventLease(admin, 'phonepe', eventId, nowIso)
      if (recovered.error || !recovered.data || recovered.data.length === 0) {
        return Response.json({ received: true, duplicate: true })
      }
    } else {
      return Response.json({ received: true, duplicate: true })
    }
  }

  const acquired = await updateProviderEvent(admin, 'phonepe', eventId, {
    status: 'processing',
    lease_expires_at: leaseExpiresAt,
    error: null,
  })
    .eq('status', 'received')
    .select('event_id')
    .maybeSingle()
  if (!acquired.data) return Response.json({ received: true, duplicate: true })

  try {
    const outcome = isSupportedPhonePeEvent(parsed.data.event)
      ? await processPhonePeWebhookEvent(admin, parsed.data, eventAt)
      : 'ignored'
    await updateProviderEvent(admin, 'phonepe', eventId, {
      status: outcome,
      processed_at: new Date().toISOString(),
      error: null,
      lease_expires_at: null,
    })
    logServer('info', 'phonepe.webhook.processed', { eventId, event: parsed.data.event, outcome })
    return Response.json({ received: true, outcome })
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : 'unknown error'
    await updateProviderEvent(admin, 'phonepe', eventId, {
      status: 'failed',
      error: message,
      lease_expires_at: null,
    })
    logServer('error', 'phonepe.webhook.failed', { eventId, event: parsed.data.event })
    return new Response('Processing failed', { status: 500 })
  }
}
