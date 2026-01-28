/**
 * Simple logger utility for structured error logging
 * Uses AppError metadata for consistent error handling
 */

import { AppError } from './errors'

/**
 * Log error with context and throw AppError
 * @param context - Context where error occurred
 * @param error - Original error
 * @param errorCode - AppError code to throw
 */
export function logAndThrow(
    context: string,
    error: unknown,
    errorCode:
        | 'DATABASE_ERROR'
        | 'UNAUTHORIZED'
        | 'ACCESS_DENIED' = 'DATABASE_ERROR',
): never {
    throw new AppError(errorCode, {
        message: `Error in ${context}`,
        metadata: { context },
        cause: error,
    })
}
