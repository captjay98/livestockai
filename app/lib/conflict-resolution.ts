/**
 * Conflict Resolution Utilities for Offline-First Mutations
 *
 * These utilities provide conflict detection and resolution for server functions
 * and mutation hooks. They implement a last-write-wins strategy based on
 * `updatedAt` timestamps.
 *
 * @module conflict-resolution
 */

import { AppError } from '~/lib/errors'

/**
 * Conflict response returned when a 409 Conflict is detected.
 * Contains both the server and client versions for resolution.
 */
export interface ConflictResponse<T> {
  /** The error reason code */
  reason: 'CONFLICT'
  /** HTTP status code (409) */
  httpStatus: 409
  /** The current server version of the record */
  serverVersion: T & { updatedAt: Date }
  /** The client version that was attempted to be saved */
  clientVersion: T & { updatedAt: Date }
  /** Which version should win based on timestamps */
  resolution: 'server-wins' | 'client-wins'
}

/**
 * Checks if an error is a conflict error (409 status).
 *
 * @param error - The error to check
 * @returns True if the error is a conflict error
 */
export function isConflictError(error: unknown): error is AppError {
  if (AppError.isAppError(error)) {
    return error.httpStatus === 409 && error.reason === 'CONFLICT'
  }
  return false
}

/**
 * Checks if an error is a not found error (404 status).
 * Used for orphaned mutation handling.
 *
 * @param error - The error to check
 * @returns True if the error is a not found error
 */
export function isNotFoundError(error: unknown): error is AppError {
  if (AppError.isAppError(error)) {
    return error.httpStatus === 404
  }
  return false
}

/**
 * Compares two timestamps to determine which version should win.
 * Implements last-write-wins conflict resolution.
 *
 * @param serverUpdatedAt - The server's updatedAt timestamp
 * @param clientUpdatedAt - The client's updatedAt timestamp
 * @returns 'server-wins' if server is newer, 'client-wins' if client is newer
 */
export function resolveConflict(
  serverUpdatedAt: Date | string,
  clientUpdatedAt: Date | string,
): 'server-wins' | 'client-wins' {
  const serverTime = new Date(serverUpdatedAt).getTime()
  const clientTime = new Date(clientUpdatedAt).getTime()

  // If timestamps are equal, server wins (conservative approach)
  return clientTime > serverTime ? 'client-wins' : 'server-wins'
}

/**
 * Detects if there's a conflict between server and client versions.
 * A conflict exists when the server version has been updated since
 * the client last fetched it.
 *
 * @param serverUpdatedAt - The server's current updatedAt timestamp
 * @param clientExpectedUpdatedAt - The updatedAt timestamp the client expects
 * @returns True if there's a conflict (server was modified)
 */
export function hasConflict(
  serverUpdatedAt: Date | string,
  clientExpectedUpdatedAt: Date | string,
): boolean {
  const serverTime = new Date(serverUpdatedAt).getTime()
  const clientExpectedTime = new Date(clientExpectedUpdatedAt).getTime()

  // Conflict exists if server version is newer than what client expected
  return serverTime > clientExpectedTime
}

/**
 * Creates a conflict error with both versions for client-side resolution.
 *
 * @template T - The type of the record
 * @param serverVersion - The current server version
 * @param clientVersion - The client version that was attempted
 * @returns An AppError with conflict metadata
 */
export function createConflictError<T extends { updatedAt: Date }>(
  serverVersion: T,
  clientVersion: T,
): AppError {
  const resolution = resolveConflict(
    serverVersion.updatedAt,
    clientVersion.updatedAt,
  )

  return new AppError('CONFLICT', {
    message: 'Resource was modified by another client',
    metadata: {
      serverVersion,
      clientVersion,
      resolution,
    },
  })
}

/**
 * Extracts conflict metadata from an AppError.
 *
 * @template T - The type of the record
 * @param error - The conflict error
 * @returns The conflict response with both versions, or null if not a conflict error
 */
export function extractConflictData<T>(
  error: AppError,
): ConflictResponse<T> | null {
  if (error.reason !== 'CONFLICT') {
    return null
  }

  const metadata = error.metadata as {
    serverVersion?: T & { updatedAt: Date }
    clientVersion?: T & { updatedAt: Date }
    resolution?: 'server-wins' | 'client-wins'
  }

  if (!metadata.serverVersion || !metadata.clientVersion) {
    return null
  }

  return {
    reason: 'CONFLICT',
    httpStatus: 409,
    serverVersion: metadata.serverVersion,
    clientVersion: metadata.clientVersion,
    resolution: metadata.resolution || 'server-wins',
  }
}

/**
 * Merges client updates with server data for retry after conflict.
 * Used when client-wins and we need to retry with the latest server data
 * but preserve the client's intended changes.
 *
 * @template T - The type of the record
 * @param serverVersion - The current server version
 * @param clientUpdates - The updates the client wanted to apply
 * @returns Merged data ready for retry
 */
export function mergeForRetry<T extends Record<string, unknown>>(
  serverVersion: T,
  clientUpdates: Partial<T>,
): T {
  return {
    ...serverVersion,
    ...clientUpdates,
    // Always use the server's updatedAt as the base for the next update
    // The server will set a new updatedAt on successful save
  }
}

/**
 * Type guard to check if an error response contains conflict data.
 *
 * @param response - The response to check
 * @returns True if the response is a conflict response
 */
export function isConflictResponse<T>(
  response: unknown,
): response is ConflictResponse<T> {
  if (typeof response !== 'object' || response === null) {
    return false
  }

  const obj = response as Record<string, unknown>
  return (
    obj.reason === 'CONFLICT' &&
    obj.httpStatus === 409 &&
    typeof obj.serverVersion === 'object' &&
    typeof obj.clientVersion === 'object'
  )
}
