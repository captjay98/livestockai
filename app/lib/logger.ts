/**
 * Simple logger utility for structured error logging
 * Uses AppError metadata for consistent error handling
 */

import { AppError } from './errors'

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
 * Conditional logging - only logs in development
 */
export function debug(...args: Array<any>) {
  const env = getEnv()
  if (env === 'development') {
    console.log('[DEBUG]', ...args)
  }
}

/**
 * Error logging - always logs errors but filters sensitive data in production
 */
export function error(message: string, err?: unknown) {
  const env = getEnv()
  if (env === 'development') {
    console.error('[ERROR]', message, err)
  } else {
    // In production, log only the message without potentially sensitive error details
    console.error('[ERROR]', message)
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
export function logAndThrow(
  context: string,
  err: unknown,
  errorCode:
    | 'DATABASE_ERROR'
    | 'UNAUTHORIZED'
    | 'ACCESS_DENIED' = 'DATABASE_ERROR',
): never {
  // Log the error (respects environment)
  error(`Error in ${context}`, err)

  throw new AppError(errorCode, {
    message: `Error in ${context}`,
    metadata: { context },
    cause: err,
  })
}

/**
 * Logger object with structured logging methods
 */
export const logger = {
  info: (message: string, ...args: Array<any>) => info(message, ...args),
  error: (message: string, err?: unknown) => error(message, err),
  debug: (...args: Array<any>) => debug(...args),
}
