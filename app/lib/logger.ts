/**
 * Simple logger utility for structured error logging
 * Uses AppError metadata for consistent error handling
 * Integrates with Sentry (BetterStack) for production error tracking
 *
 * Automatically detects server vs client context and uses appropriate Sentry functions
 */

import { AppError } from './errors'
import {
  captureError as captureClientError,
  captureMessage as captureClientMessage,
} from './sentry'

/**
 * Check if we're in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Get environment - works in both Node.js and Cloudflare Workers
 */
function getEnv(): string {
  // In local dev, use process.env directly
  if (typeof process !== 'undefined' && process.env.NODE_ENV) {
    return process.env.NODE_ENV
  }
  return 'production'
}

/**
 * Capture error using appropriate Sentry function (client or server)
 * Uses dynamic import for server-side to avoid bundling @sentry/node in browser
 */
async function captureError(err: Error, context?: Record<string, any>) {
  if (isBrowser()) {
    captureClientError(err, context)
  } else {
    // Dynamic import to avoid bundling server code in browser
    const { captureServerError } = await import('./sentry-server')
    captureServerError(err, context)
  }
}

/**
 * Capture message using appropriate Sentry function (client or server)
 * Uses dynamic import for server-side to avoid bundling @sentry/node in browser
 */
async function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
) {
  if (isBrowser()) {
    captureClientMessage(message, level)
  } else {
    // Dynamic import to avoid bundling server code in browser
    const { captureServerMessage } = await import('./sentry-server')
    captureServerMessage(message, level)
  }
}

/**
 * Conditional logging - only logs in development
 */
export function debug(...args: Array<any>) {
  const env = getEnv()
  if (env === 'development') {
    console.log('[DEBUG]', ...args)
  }
}

/**
 * Error logging - always logs errors and sends to Sentry in production
 */
export function error(
  message: string,
  err?: unknown,
  context?: Record<string, any>,
) {
  const env = getEnv()

  if (env === 'development') {
    console.error('[ERROR]', message, err)
  } else {
    // In production, log only the message without potentially sensitive error details
    console.error('[ERROR]', message)

    // Send to Sentry if error is an Error object
    if (err instanceof Error) {
      captureError(err, { message, ...context })
    } else {
      // If not an Error object, send as message
      captureMessage(`${message}: ${String(err)}`, 'error')
    }
  }
}

/**
 * Warning logging - logs warnings and sends to Sentry in production
 */
export function warn(message: string, context?: Record<string, any>) {
  const env = getEnv()

  if (env === 'development') {
    console.warn('[WARN]', message, context)
  } else {
    console.warn('[WARN]', message)
    captureMessage(message, 'warning')
  }
}

/**
 * Info logging - logs informational messages in development
 */
export function info(message: string, ...args: Array<any>) {
  const env = getEnv()
  if (env === 'development') {
    console.log('[INFO]', message, ...args)
  }
}

/**
 * Log error with context and throw AppError
 * @param context - Context where error occurred
 * @param err - Original error
 * @param errorCode - AppError code to throw
 */
export async function logAndThrow(
  context: string,
  err: unknown,
  errorCode:
    | 'DATABASE_ERROR'
    | 'UNAUTHORIZED'
    | 'ACCESS_DENIED' = 'DATABASE_ERROR',
): Promise<never> {
  // Log the error (respects environment and sends to Sentry)
  await error(`Error in ${context}`, err, { context })

  throw new AppError(errorCode, {
    message: `Error in ${context}`,
    metadata: { context },
    cause: err,
  })
}

/**
 * Logger object with structured logging methods
 * All methods integrate with Sentry (BetterStack) in production
 */
export const logger = {
  info: (message: string, ...args: Array<any>) => info(message, ...args),
  error: (message: string, err?: unknown, context?: Record<string, any>) =>
    error(message, err, context),
  warn: (message: string, context?: Record<string, any>) =>
    warn(message, context),
  debug: (...args: Array<any>) => debug(...args),
}
