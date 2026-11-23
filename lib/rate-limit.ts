import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { hasUpstashConfiguration } from '@/lib/env'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN

/**
 * Upstash is preferred in production. When it is not configured — including
 * when `.env.example` placeholders were copied verbatim — a small in-process
 * fixed window keeps abuse-sensitive routes available instead of turning every
 * request into a 500 against a fake host. Multi-instance deployments should
 * always configure Redis so limits are shared.
 */
const redis =
  hasUpstashConfiguration() && redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null
const limiters = new Map<string, Ratelimit>()
const memoryWindows = new Map<string, { count: number; reset: number }>()

type RateWindow = `${number} s` | `${number} m`

function windowToMs(value: RateWindow) {
  const [amount, unit] = value.split(' ')
  return Number(amount) * (unit === 'm' ? 60_000 : 1_000)
}

function inMemoryLimit(key: string, name: string, requests: number, window: RateWindow) {
  const memoryKey = `${name}:${key}`
  const now = Date.now()
  const duration = windowToMs(window)
  const current = memoryWindows.get(memoryKey)
  const bucket =
    current && current.reset > now ? current : { count: 0, reset: now + duration }

  bucket.count += 1
  memoryWindows.set(memoryKey, bucket)

  return {
    success: bucket.count <= requests,
    retryAfter: Math.max(1, Math.ceil((bucket.reset - now) / 1_000)),
  }
}

export async function enforceRateLimit(
  key: string,
  name: string,
  requests = 10,
  window: RateWindow = '1 m'
) {
  if (!redis) return inMemoryLimit(key, name, requests, window)

  const existing = limiters.get(name)
  const limiter =
    existing ??
    new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(requests, window), prefix: `commun:${name}` })
  if (!existing) limiters.set(name, limiter)

  const result = await limiter.limit(key)
  return {
    success: result.success,
    retryAfter: result.reset ? Math.max(1, Math.ceil((result.reset - Date.now()) / 1_000)) : 60,
  }
}

export function requestKey(request: Request, subject: string) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return `${subject}:${forwarded || request.headers.get('x-real-ip') || 'unknown'}`
}
