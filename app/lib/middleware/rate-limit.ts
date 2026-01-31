/**
 * Rate Limiting Middleware
 *
 * Tiered rate limiting for different endpoint types:
 * - Auth: 5 requests/minute (login, register)
 * - Mutation: 30 requests/minute (create, update, delete)
 * - Query: 100 requests/minute (read operations)
 *
 * Uses Cloudflare KV for distributed rate limiting in production
 * Falls back to in-memory for development
 */

import { AppError } from '~/lib/errors'

export type RateLimitTier = 'auth' | 'mutation' | 'query'

interface RateLimitConfig {
  requests: number
  windowSeconds: number
}

const RATE_LIMITS: Record<RateLimitTier, RateLimitConfig> = {
  auth: { requests: 5, windowSeconds: 60 }, // 5/min for auth
  mutation: { requests: 30, windowSeconds: 60 }, // 30/min for writes
  query: { requests: 100, windowSeconds: 60 }, // 100/min for reads
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for development (resets on restart)
const memoryStore = new Map<string, RateLimitEntry>()

/**
 * Check rate limit using Cloudflare KV (production) or memory (dev)
 */
export async function checkRateLimit(
  ip: string,
  tier: RateLimitTier = 'query',
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const config = RATE_LIMITS[tier]
  const key = `rate_limit:${tier}:${ip}`

  // Try to use Cloudflare KV if available
  const kv = await getKVNamespace()

  if (kv) {
    return checkRateLimitKV(kv, key, config)
  }

  // Fallback to in-memory for development
  return checkRateLimitMemory(key, config)
}

/**
 * Cloudflare KV-based rate limiting (production)
 */
async function checkRateLimitKV(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const resetAt = now + config.windowSeconds * 1000

  try {
    const value = await kv.get(key)

    if (!value) {
      // First request in window
      await kv.put(key, '1', { expirationTtl: config.windowSeconds })
      return {
        allowed: true,
        remaining: config.requests - 1,
        resetAt,
      }
    }

    const count = parseInt(value, 10)

    if (count >= config.requests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      }
    }

    // Increment counter
    await kv.put(key, (count + 1).toString(), {
      expirationTtl: config.windowSeconds,
    })

    return {
      allowed: true,
      remaining: config.requests - count - 1,
      resetAt,
    }
  } catch (error) {
    console.error('KV rate limit error:', error)
    // Allow request on error (fail open)
    return {
      allowed: true,
      remaining: config.requests,
      resetAt,
    }
  }
}

/**
 * In-memory rate limiting (development)
 */
function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    const resetAt = now + config.windowSeconds * 1000
    memoryStore.set(key, {
      count: 1,
      resetTime: resetAt,
    })
    return {
      allowed: true,
      remaining: config.requests - 1,
      resetAt,
    }
  }

  if (entry.count >= config.requests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetTime,
    }
  }

  // Increment counter
  entry.count++

  return {
    allowed: true,
    remaining: config.requests - entry.count,
    resetAt: entry.resetTime,
  }
}

/**
 * Get Cloudflare KV namespace if available
 */
async function getKVNamespace(): Promise<KVNamespace | null> {
  try {
    // Try to get KV from Cloudflare Workers env
    const { env } = await import('cloudflare:workers')
    return (env as any).RATE_LIMIT_KV || null
  } catch {
    // Not in Cloudflare Workers or KV not configured
    return null
  }
}

/**
 * Middleware wrapper for server functions
 * Usage: await withRateLimit(() => yourFunction(), ip, 'mutation')
 */
export async function withRateLimit<T>(
  handler: () => Promise<T>,
  ip: string,
  tier: RateLimitTier = 'query',
): Promise<T> {
  const { allowed, resetAt } = await checkRateLimit(ip, tier)

  if (!allowed) {
    throw new AppError('RATE_LIMIT_EXCEEDED', {
      message: 'Too many requests. Please try again later.',
      metadata: {
        resetAt: new Date(resetAt).toISOString(),
        tier,
      },
    })
  }

  // Add rate limit info to response headers (if possible)
  // Note: This requires access to response object, which varies by framework

  return handler()
}

/**
 * Get client IP from request
 * Works with Cloudflare Workers
 */
export function getClientIP(request: Request): string {
  // Cloudflare provides CF-Connecting-IP header
  const cfIP = request.headers.get('CF-Connecting-IP')
  if (cfIP) return cfIP

  // Fallback to X-Forwarded-For
  const forwardedFor = request.headers.get('X-Forwarded-For')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Fallback to X-Real-IP
  const realIP = request.headers.get('X-Real-IP')
  if (realIP) return realIP

  // Last resort
  return 'unknown'
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  remaining: number,
  resetAt: number,
  limit: number,
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
  }
}
