/**
 * Sentry (BetterStack) Error Tracking Configuration
 * DISABLED - Sentry removed to reduce bundle size
 */

/**
 * Initialize Sentry for error tracking
 * DISABLED - No-op function
 */
export function initSentry() {
  // Sentry disabled to reduce bundle size
}

/**
 * Manually capture an error (no-op)
 */
export function captureError(_error: Error, _context?: Record<string, any>) {
  // Sentry disabled
}

/**
 * Manually capture a message (no-op)
 */
export function captureMessage(
  _message: string,
  _level: 'info' | 'warning' | 'error' = 'info',
) {
  // Sentry disabled
}

/**
 * Set user context (no-op)
 */
export function setUser(_userId: string, _email?: string, _name?: string) {
  // Sentry disabled
}

/**
 * Clear user context (no-op)
 */
export function clearUser() {
  // Sentry disabled
}

/**
 * Add breadcrumb for debugging (no-op)
 */
export function addBreadcrumb(_message: string, _data?: Record<string, any>) {
  // Sentry disabled
}

/**
 * Set custom context (no-op)
 */
export function setContext(_key: string, _value: Record<string, any>) {
  // Sentry disabled
}
