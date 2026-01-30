/**
 * Sentry (BetterStack) Server-Side Error Tracking
 *
 * For tracking errors in:
 * - Server functions
 * - API routes
 * - Database operations
 * - Cloudflare Workers
 */

import * as Sentry from '@sentry/node'

let initialized = false

/**
 * Initialize Sentry for server-side error tracking
 * Call this once at server startup
 */
export function initSentryServer() {
  // Prevent double initialization
  if (initialized) {
    return
  }

  // Get environment
  const environment = getEnvironment()

  // Only track errors in production
  if (environment !== 'production') {
    console.log('🔍 Sentry Server disabled in development')
    return
  }

  try {
    Sentry.init({
      dsn: 'https://8VcKcMeVVdKVHYRfrbZd1Az8@s1707120.eu-fsn-3.betterstackdata.com/1707120',

      // Environment
      environment,

      // Release version (optional)
      // release: 'livestockai@1.0.0',

      // Performance Monitoring
      tracesSampleRate: 1.0,

      // Server-specific options
      integrations: [
        // HTTP integration for tracking requests
        Sentry.httpIntegration(),
      ],

      // Filter out noise
      ignoreErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'],

      // Before sending, add custom context
      beforeSend(event) {
        // Add server context
        event.contexts = {
          ...event.contexts,
          runtime: {
            name: 'cloudflare-workers',
          },
        }

        return event
      },
    })

    initialized = true
    console.log('✅ Sentry Server initialized for error tracking')
  } catch (error) {
    console.error('Failed to initialize Sentry Server:', error)
  }
}

/**
 * Get current environment
 */
function getEnvironment(): string {
  if (typeof process !== 'undefined' && process.env.NODE_ENV) {
    return process.env.NODE_ENV
  }
  return 'production'
}

/**
 * Capture server-side error
 */
export function captureServerError(
  error: Error,
  context?: Record<string, any>,
) {
  const env = getEnvironment()

  if (env === 'development') {
    console.error('[Server Error]', error, context)
    return
  }

  if (!initialized) {
    console.error('[Sentry not initialized]', error, context)
    return
  }

  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Capture server-side message
 */
export function captureServerMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
) {
  const env = getEnvironment()

  if (env === 'development') {
    console.log(`[Server ${level}]`, message)
    return
  }

  if (!initialized) {
    console.log(`[Sentry not initialized] ${level}:`, message)
    return
  }

  Sentry.captureMessage(message, level)
}

/**
 * Set server-side user context
 */
export function setServerUser(userId: string, email?: string) {
  if (!initialized) return

  Sentry.setUser({
    id: userId,
    email,
  })
}

/**
 * Clear server-side user context
 */
export function clearServerUser() {
  if (!initialized) return

  Sentry.setUser(null)
}

/**
 * Add server-side breadcrumb
 */
export function addServerBreadcrumb(
  message: string,
  data?: Record<string, any>,
) {
  if (!initialized) return

  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
  })
}

/**
 * Set server-side context
 */
export function setServerContext(key: string, value: Record<string, any>) {
  if (!initialized) return

  Sentry.setContext(key, value)
}

/**
 * Wrap async function with error tracking
 */
export function withServerErrorTracking<
  T extends (...args: Array<any>) => Promise<any>,
>(fn: T, context?: Record<string, any>): T {
  return (async (...args: Array<any>) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof Error) {
        captureServerError(error, context)
      }
      throw error
    }
  }) as T
}
