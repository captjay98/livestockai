import type { QueryClient, QueryKey } from '@tanstack/react-query'

/**
 * Optimistic Update Utilities for Offline-First Mutations
 *
 * These utilities provide shared functionality for implementing optimistic updates
 * across all mutation hooks in the application. They enable immediate UI feedback
 * while mutations are pending, with automatic rollback on failure.
 *
 * @module optimistic-utils
 */

/**
 * Context object stored during optimistic updates for rollback capability.
 * Contains the previous cache state and optional temporary ID for new records.
 *
 * @template T - The type of data being cached
 */
export interface OptimisticContext<T> {
  /** Snapshot of the cache data before the optimistic update was applied */
  previousData: T | undefined
  /** Temporary ID assigned to newly created records (before server confirmation) */
  tempId?: string
}

/**
 * Marker interface for records that have been optimistically added to the cache.
 * These flags help identify records that haven't been confirmed by the server yet.
 */
export interface OptimisticRecord {
  /** True for records not yet confirmed by server */
  _isOptimistic?: boolean
  /** Temporary ID before server assigns real ID */
  _tempId?: string
}

/**
 * Options for creating an optimistic update handler.
 *
 * @template TData - The type of data in the query cache
 * @template TVariables - The type of mutation variables
 */
export interface OptimisticUpdateOptions<TData, TVariables> {
  /** The query key to update in the cache */
  queryKey: QueryKey
  /** Function to update the cached data with the new mutation variables */
  updater: (old: TData | undefined, variables: TVariables) => TData
  /** Optional function to generate a temporary ID for new records */
  generateTempId?: () => string
}

/**
 * Prefix used for all temporary IDs to easily identify them.
 * Format: "temp-{entity}-{uuid}"
 */
export const TEMP_ID_PREFIX = 'temp-'

/**
 * Generates a temporary ID for records created while offline.
 * Uses crypto.randomUUID() for guaranteed uniqueness.
 *
 * @returns A unique temporary ID string
 *
 * @example
 * ```typescript
 * const tempId = generateTempId()
 * // Returns: "temp-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
 * ```
 */
export function generateTempId(): string {
  return `${TEMP_ID_PREFIX}${crypto.randomUUID()}`
}

/**
 * Generates a temporary ID with an entity type prefix for easier debugging.
 * This format helps identify what type of record the temp ID belongs to.
 *
 * @param entityType - The type of entity (e.g., 'batch', 'sale', 'feed')
 * @returns A unique temporary ID string with entity prefix
 *
 * @example
 * ```typescript
 * const tempId = generateEntityTempId('batch')
 * // Returns: "temp-batch-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
 * ```
 */
export function generateEntityTempId(entityType: string): string {
  return `${TEMP_ID_PREFIX}${entityType}-${crypto.randomUUID()}`
}

/**
 * Checks if a given ID is a temporary ID (created offline).
 *
 * @param id - The ID to check
 * @returns True if the ID is a temporary ID, false otherwise
 *
 * @example
 * ```typescript
 * isTempId('temp-batch-123') // true
 * isTempId('550e8400-e29b-41d4-a716-446655440000') // false
 * ```
 */
export function isTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX)
}

/**
 * Creates an optimistic context object for storing cache snapshots.
 * This context is used in onMutate handlers to enable rollback on failure.
 *
 * @template T - The type of data being cached
 * @param previousData - The current cache data before the optimistic update
 * @param tempId - Optional temporary ID for newly created records
 * @returns An OptimisticContext object for use in mutation handlers
 *
 * @example
 * ```typescript
 * const context = createOptimisticContext(previousBatches, tempId)
 * // Use in onMutate handler to enable rollback
 * ```
 */
export function createOptimisticContext<T>(
  previousData: T | undefined,
  tempId?: string,
): OptimisticContext<T> {
  return {
    previousData,
    tempId,
  }
}

/**
 * Replaces a temporary ID with a server-assigned ID in an array of records.
 * Used in onSuccess handlers to update the cache with the real ID.
 *
 * @template T - The type of records in the array (must have an 'id' property)
 * @param records - The array of records to update
 * @param tempId - The temporary ID to replace
 * @param serverId - The server-assigned ID to use
 * @param additionalUpdates - Optional additional fields to update on the matched record
 * @returns A new array with the temporary ID replaced
 *
 * @example
 * ```typescript
 * const updatedBatches = replaceTempId(
 *   batches,
 *   'temp-batch-123',
 *   'real-uuid-from-server',
 *   { _isOptimistic: false }
 * )
 * ```
 */
export function replaceTempId<T extends { id: string }>(
  records: Array<T> | undefined,
  tempId: string,
  serverId: string,
  additionalUpdates?: Partial<Omit<T, 'id'>>,
): Array<T> {
  if (!records) return []

  return records.map((record) => {
    if (record.id === tempId) {
      return {
        ...record,
        id: serverId,
        _isOptimistic: false,
        _tempId: undefined,
        ...additionalUpdates,
      } as T
    }
    return record
  })
}

/**
 * Replaces a record with temporary ID with the full server response.
 * Used when the server returns the complete record with additional computed fields.
 *
 * @template T - The type of records in the array (must have an 'id' property)
 * @param records - The array of records to update
 * @param tempId - The temporary ID to find and replace
 * @param serverRecord - The complete record from the server
 * @returns A new array with the temporary record replaced by the server record
 *
 * @example
 * ```typescript
 * const updatedBatches = replaceTempIdWithRecord(
 *   batches,
 *   'temp-batch-123',
 *   serverBatch
 * )
 * ```
 */
export function replaceTempIdWithRecord<T extends { id: string }>(
  records: Array<T> | undefined,
  tempId: string,
  serverRecord: T,
): Array<T> {
  if (!records) return [serverRecord]

  const index = records.findIndex((record) => record.id === tempId)

  if (index === -1) {
    // Temp ID not found, append the server record
    return [...records, serverRecord]
  }

  // Replace the temp record with the server record
  const newRecords = [...records]
  newRecords[index] = {
    ...serverRecord,
    _isOptimistic: false,
    _tempId: undefined,
  } as T
  return newRecords
}

/**
 * Removes a record from an array by ID.
 * Used for optimistic deletes.
 *
 * @template T - The type of records in the array (must have an 'id' property)
 * @param records - The array of records to filter
 * @param id - The ID of the record to remove
 * @returns A new array without the specified record
 *
 * @example
 * ```typescript
 * const updatedBatches = removeById(batches, 'batch-to-delete')
 * ```
 */
export function removeById<T extends { id: string }>(
  records: Array<T> | undefined,
  id: string,
): Array<T> {
  if (!records) return []
  return records.filter((record) => record.id !== id)
}

/**
 * Updates a record in an array by ID.
 * Used for optimistic updates.
 *
 * @template T - The type of records in the array (must have an 'id' property)
 * @param records - The array of records to update
 * @param id - The ID of the record to update
 * @param updates - The partial updates to apply
 * @returns A new array with the specified record updated
 *
 * @example
 * ```typescript
 * const updatedBatches = updateById(batches, 'batch-123', { name: 'New Name' })
 * ```
 */
export function updateById<T extends { id: string }>(
  records: Array<T> | undefined,
  id: string,
  updates: Partial<T>,
): Array<T> {
  if (!records) return []

  return records.map((record) => {
    if (record.id === id) {
      return {
        ...record,
        ...updates,
        _isOptimistic: true,
      } as T
    }
    return record
  })
}

/**
 * Adds a new record to an array with optimistic markers.
 * Used for optimistic creates.
 *
 * @template T - The type of records in the array
 * @param records - The existing array of records
 * @param newRecord - The new record to add
 * @param tempId - The temporary ID assigned to the new record
 * @returns A new array with the new record appended
 *
 * @example
 * ```typescript
 * const tempId = generateTempId()
 * const updatedBatches = addOptimisticRecord(batches, newBatch, tempId)
 * ```
 */
export function addOptimisticRecord<T extends { id: string }>(
  records: Array<T> | undefined,
  newRecord: Omit<T, 'id'>,
  tempId: string,
): Array<T> {
  const optimisticRecord = {
    ...newRecord,
    id: tempId,
    _isOptimistic: true,
    _tempId: tempId,
  } as unknown as T

  if (!records) return [optimisticRecord]
  return [...records, optimisticRecord]
}

/**
 * Creates a rollback function for use in onError handlers.
 * Restores the cache to its previous state when a mutation fails.
 *
 * @template T - The type of data in the query cache
 * @param queryClient - The TanStack Query client instance
 * @param queryKey - The query key to rollback
 * @returns A function that accepts OptimisticContext and performs the rollback
 *
 * @example
 * ```typescript
 * const rollback = createRollback(queryClient, ['batches'])
 *
 * // In mutation config:
 * onError: (err, variables, context) => {
 *   rollback(context)
 * }
 * ```
 */
export function createRollback<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
): (context: OptimisticContext<T> | undefined) => void {
  return (context) => {
    if (context?.previousData !== undefined) {
      queryClient.setQueryData(queryKey, context.previousData)
    }
  }
}

/**
 * Cancels any outgoing refetches for a query key.
 * Should be called at the start of onMutate to prevent race conditions.
 *
 * @param queryClient - The TanStack Query client instance
 * @param queryKey - The query key to cancel refetches for
 * @returns A promise that resolves when cancellation is complete
 *
 * @example
 * ```typescript
 * // In onMutate handler:
 * await cancelQueries(queryClient, ['batches'])
 * ```
 */
export async function cancelQueries(
  queryClient: QueryClient,
  queryKey: QueryKey,
): Promise<void> {
  await queryClient.cancelQueries({ queryKey })
}

/**
 * Gets the current data from the query cache.
 * Used to snapshot data before optimistic updates.
 *
 * @template T - The type of data in the query cache
 * @param queryClient - The TanStack Query client instance
 * @param queryKey - The query key to get data for
 * @returns The current cached data, or undefined if not cached
 *
 * @example
 * ```typescript
 * const previousBatches = getQueryData<Batch[]>(queryClient, ['batches'])
 * ```
 */
export function getQueryData<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
): T | undefined {
  return queryClient.getQueryData<T>(queryKey)
}

/**
 * Sets data in the query cache.
 * Used to apply optimistic updates.
 *
 * @template T - The type of data to set
 * @param queryClient - The TanStack Query client instance
 * @param queryKey - The query key to set data for
 * @param data - The data to set
 *
 * @example
 * ```typescript
 * setQueryData(queryClient, ['batches'], updatedBatches)
 * ```
 */
export function setQueryData<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  data: T,
): void {
  queryClient.setQueryData(queryKey, data)
}

/**
 * Conflict handling utilities for mutation hooks
 */

/**
 * Checks if an error is a conflict error (409 status).
 * Used in onError handlers to detect conflicts.
 *
 * @param error - The error to check
 * @returns True if the error is a conflict error
 */
export function isConflictError(error: unknown): boolean {
  if (error instanceof Error) {
    // Check for AppError with CONFLICT reason
    const appError = error as { reason?: string; httpStatus?: number }
    if (appError.reason === 'CONFLICT' || appError.httpStatus === 409) {
      return true
    }
    // Check error message for conflict indicators
    if (error.message.includes('409') || error.message.includes('conflict')) {
      return true
    }
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
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof Error) {
    // Check for AppError with NOT_FOUND category
    const appError = error as { httpStatus?: number; category?: string }
    if (appError.httpStatus === 404 || appError.category === 'NOT_FOUND') {
      return true
    }
    // Check error message for not found indicators
    if (error.message.includes('404') || error.message.includes('not found')) {
      return true
    }
  }
  return false
}

/**
 * Extracts conflict metadata from an error.
 *
 * @param error - The error to extract conflict data from
 * @returns The conflict metadata or null if not a conflict error
 */
export function extractConflictMetadata<T>(error: unknown): {
  serverVersion: T
  clientVersion: T
  resolution: 'server-wins' | 'client-wins'
} | null {
  if (error instanceof Error) {
    const appError = error as {
      metadata?: {
        serverVersion?: T
        clientVersion?: T
        resolution?: 'server-wins' | 'client-wins'
      }
    }
    const metadata = appError.metadata
    if (metadata?.serverVersion && metadata.clientVersion) {
      return {
        serverVersion: metadata.serverVersion,
        clientVersion: metadata.clientVersion,
        resolution: metadata.resolution || 'server-wins',
      }
    }
  }
  return null
}

/**
 * Determines if the client version should win based on timestamps.
 *
 * @param serverUpdatedAt - Server's updatedAt timestamp
 * @param clientUpdatedAt - Client's updatedAt timestamp
 * @returns True if client version is newer and should win
 */
export function shouldClientWin(
  serverUpdatedAt: Date | string,
  clientUpdatedAt: Date | string,
): boolean {
  const serverTime = new Date(serverUpdatedAt).getTime()
  const clientTime = new Date(clientUpdatedAt).getTime()
  return clientTime > serverTime
}
