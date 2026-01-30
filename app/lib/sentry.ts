/**
 * Sentry (BetterStack) Error Tracking Configuration
 *
 * Integrated with BetterStack for error tracking and monitoring.
 * DSN: https://8VcKcMeVVdKVHYRfrbZd1Az8@s1707120.eu-fsn-3.betterstackdata.com/1707120
 */

import * as Sentry from '@sentry/react'

/**
 * Check if we're in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Initialize Sentry for error tracking
 * Call this once at app startup
 */
export function initSentry() {
  // Only initialize in browser (not during SSR)
  if (!isBrowser()) {
    return
  }

  // Get environment
  const environment = getEnvironment()

  // Only track errors in production
  if (environment !== 'production') {
    console.log('🔍 Sentry disabled in development')
    return
  }

  Sentry.init({
    dsn: 'https://8VcKcMeVVdKVHYRfrbZd1Az8@s1707120.eu-fsn-3.betterstackdata.com/1707120',

    // Environment
    environment,

    // Release version (optional - set via CI/CD)
    // release: 'livestockai@1.0.0',

    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring

    // Session Replay (optional - captures user sessions for debugging)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Integrations
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration(),

      // Session replay for debugging
      Sentry.replayIntegration({
        maskAllText: true, // Mask sensitive text
        blockAllMedia: true, // Block images/videos
      }),
    ],

    // Filter out noise
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',

      // Network errors (user's connection issues)
      'NetworkError',
      'Failed to fetch',
      'Load failed',

      // Cancelled requests
      'AbortError',
      'The user aborted a request',
    ],

    // Before sending, add custom context
    beforeSend(event) {
      // Add user context if available
      const userId = getUserId()
      if (userId) {
        event.user = {
          id: userId,
        }
      }

      // Add farm context if available
      const farmId = getFarmId()
      if (farmId) {
        event.contexts = {
          ...event.contexts,
          farm: {
            farmId,
          },
        }
      }

      return event
    },
  })

  console.log('✅ Sentry initialized for error tracking')
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
 * Get current user ID from session storage
 */
function getUserId(): string | null {
  if (!isBrowser()) return null

  try {
    const session = sessionStorage.getItem('session')
    if (session) {
      const parsed = JSON.parse(session)
      return parsed.userId || null
    }
  } catch {
    // Ignore errors
  }
  return null
}

/**
 * Get current farm ID from local storage
 */
function getFarmId(): string | null {
  if (!isBrowser()) return null

  try {
    const farmId = localStorage.getItem('selectedFarmId')
    return farmId || null
  } catch {
    // Ignore errors
  }
  return null
}

/**
 * Manually capture an error (safe for SSR)
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (!isBrowser()) {
    console.error('[Sentry SSR]', error, context)
    return
  }

  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Manually capture a message (safe for SSR)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
) {
  if (!isBrowser()) {
    console.log(`[Sentry SSR] ${level}:`, message)
    return
  }

  Sentry.captureMessage(message, level)
}

/**
 * Set user context (safe for SSR)
 */
export function setUser(userId: string, email?: string, name?: string) {
  if (!isBrowser()) return

  Sentry.setUser({
    id: userId,
    email,
    username: name,
  })
}

/**
 * Clear user context (on logout) (safe for SSR)
 */
export function clearUser() {
  if (!isBrowser()) return

  Sentry.setUser(null)
}

/**
 * Add breadcrumb for debugging (safe for SSR)
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  if (!isBrowser()) return

  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
  })
}

/**
 * Set custom context (safe for SSR)
 */
export function setContext(key: string, value: Record<string, any>) {
  if (!isBrowser()) return

  Sentry.setContext(key, value)
}
