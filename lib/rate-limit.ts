import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const redis = Redis.fromEnv()
const limiters = new Map<string, Ratelimit>()

function limiter(name: string, requests: number, window: `${number} s` | `${number} m`) {
  const existing = limiters.get(name)
  if (existing) return existing
  const created = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(requests, window), prefix: `commun:${name}` })
  limiters.set(name, created)
  return created
}

export async function enforceRateLimit(key: string, name: string, requests = 10, window: `${number} s` | `${number} m` = '1 m') {
  const result = await limiter(name, requests, window).limit(key)
  return { success: result.success, retryAfter: result.reset ? Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)) : 60 }
}

export function requestKey(request: Request, subject: string) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return `${subject}:${forwarded || request.headers.get('x-real-ip') || 'unknown'}`
}
