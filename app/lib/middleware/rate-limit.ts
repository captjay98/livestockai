import { AppError } from '~/lib/errors'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (use Redis/KV in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyGenerator?: (request: Request) => string
}

/**
 * Rate limiting middleware for public routes
 * Designed for /shared/* routes that don't require authentication
 */
export function rateLimit(
  request: Request,
  options: RateLimitOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
  },
): void {
  const key = options.keyGenerator
    ? options.keyGenerator(request)
    : getClientIP(request)

  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key)
  }

  const currentEntry = rateLimitStore.get(key) || {
    count: 0,
    resetTime: now + options.windowMs,
  }

  currentEntry.count++
  rateLimitStore.set(key, currentEntry)

  if (currentEntry.count > options.maxRequests) {
    throw new AppError('RATE_LIMITED', {
      message: 'Too many requests',
      metadata: {
        limit: options.maxRequests,
        windowMs: options.windowMs,
        resetTime: currentEntry.resetTime,
      },
    })
  }
}

/**
 * Get client IP from request headers
 */
function getClientIP(request: Request): string {
  // Check Cloudflare headers first
  const cfConnectingIP = request.headers.get('CF-Connecting-IP')
  if (cfConnectingIP) return cfConnectingIP

  // Check other common headers
  const xForwardedFor = request.headers.get('X-Forwarded-For')
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim()

  const xRealIP = request.headers.get('X-Real-IP')
  if (xRealIP) return xRealIP

  // Fallback
  return 'unknown'
}

/**
 * Rate limit for shared routes (more restrictive)
 */
export function rateLimitShared(request: Request): void {
  return rateLimit(request, {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20, // 20 requests per 5 minutes for shared routes
  })
}
