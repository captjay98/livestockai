/**
 * Sentry (BetterStack) Server-Side Error Tracking
 * DISABLED - Sentry removed to reduce bundle size
 */

/**
 * Initialize Sentry for server-side error tracking
 * DISABLED - No-op function
 */
export function initSentryServer() {
  // Sentry disabled to reduce bundle size
}

/**
 * Capture server-side error (no-op)
 */
export function captureServerError(
  _error: Error,
  _context?: Record<string, any>,
) {
  // Sentry disabled
}

/**
 * Capture server-side message (no-op)
 */
export function captureServerMessage(
  _message: string,
  _level?: 'info' | 'warning' | 'error',
) {
  // Sentry disabled
}
