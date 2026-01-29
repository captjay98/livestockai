/**
 * Simple in-memory rate limiter for Cloudflare Workers
 * 10 requests per minute per IP for shared routes
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (resets on worker restart)
const rateLimitStore = new Map<string, RateLimitEntry>()

const RATE_LIMIT = 10 // requests per window
const WINDOW_MS = 60 * 1000 // 1 minute

export function checkRateLimit(ip: string): {
  allowed: boolean
  remaining: number
} {
  const now = Date.now()
  const key = `rate_limit:${ip}`

  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + WINDOW_MS,
    })
    return { allowed: true, remaining: RATE_LIMIT - 1 }
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT - entry.count }
}

export function getRateLimitHeaders(ip: string) {
  const { remaining } = checkRateLimit(ip)
  return {
    'X-RateLimit-Limit': RATE_LIMIT.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil((Date.now() + WINDOW_MS) / 1000).toString(),
  }
}
