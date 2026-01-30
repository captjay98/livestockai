import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { createBatchFn, deleteBatchFn, updateBatchFn } from './server'
import type { CreateBatchData, UpdateBatchData } from './server'
import type {
  OptimisticContext,
  OptimisticRecord,
} from '~/lib/optimistic-utils'
import {
  addOptimisticRecord,
  cancelQueries,
  createOptimisticContext,
  createRollback,
  extractConflictMetadata,
  generateEntityTempId,
  getQueryData,
  isConflictError,
  isNotFoundError,
  removeById,
  replaceTempIdWithRecord,
  setQueryData,
  shouldClientWin,
  updateById,
} from '~/lib/optimistic-utils'
import { tempIdResolver } from '~/lib/temp-id-resolver'

/**
 * Batch record type for cache operations.
 * Extends the base batch data with optimistic markers.
 */
export interface BatchRecord extends OptimisticRecord {
  id: string
  farmId: string
  farmName?: string | null
  livestockType: string
  species: string
  breedId?: string | null
  breedName?: string | null
  initialQuantity: number
  currentQuantity: number
  acquisitionDate: Date
  costPerUnit: string
  totalCost: string
  status: string
  batchName?: string | null
  sourceSize?: string | null
  structureId?: string | null
  targetHarvestDate?: Date | null
  target_weight_g?: number | null
  targetPricePerUnit?: string | null
  supplierId?: string | null
  notes?: string | null
  updatedAt?: Date | string | null
  createdAt?: Date | string | null
}

/**
 * Query key constants for batch-related queries
 */
export const BATCH_QUERY_KEYS = {
  all: ['batches'] as const,
  lists: () => [...BATCH_QUERY_KEYS.all, 'list'] as const,
  list: (farmId?: string) => [...BATCH_QUERY_KEYS.lists(), farmId] as const,
  details: () => [...BATCH_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...BATCH_QUERY_KEYS.details(), id] as const,
  summary: (farmId?: string) => ['inventory-summary', farmId] as const,
  farmModules: ['farm-modules'] as const,
} as const

/**
 * Input type for creating a batch mutation
 */
export interface CreateBatchInput {
  batch: CreateBatchData
}

/**
 * Input type for updating a batch mutation
 */
export interface UpdateBatchInput {
  batchId: string
  batch: UpdateBatchData
}

/**
 * Input type for deleting a batch mutation
 */
export interface DeleteBatchInput {
  batchId: string
}

/**
 * Result type for the useBatchMutations hook
 */
export interface UseBatchMutationsResult {
  /** Mutation for creating a new batch with optimistic updates */
  createBatch: ReturnType<
    typeof useMutation<
      string,
      Error,
      CreateBatchInput,
      OptimisticContext<Array<BatchRecord>>
    >
  >
  /** Mutation for updating an existing batch with optimistic updates */
  updateBatch: ReturnType<
    typeof useMutation<
      unknown,
      Error,
      UpdateBatchInput,
      OptimisticContext<Array<BatchRecord>>
    >
  >
  /** Mutation for deleting a batch with optimistic updates */
  deleteBatch: ReturnType<
    typeof useMutation<
      void,
      Error,
      DeleteBatchInput,
      OptimisticContext<Array<BatchRecord>>
    >
  >
  /** Combined pending state for all mutations */
  isPending: boolean
}

/**
 * Hook for batch mutations with optimistic updates.
 *
 * Provides create, update, and delete mutations for batches with:
 * - Immediate UI feedback via optimistic updates
 * - Automatic rollback on failure
 * - Temp ID replacement on success
 * - Cache invalidation on settlement
 *
 * @returns Object containing mutation functions and pending state
 *
 * @example
 * ```typescript
 * const { createBatch, updateBatch, deleteBatch, isPending } = useBatchMutations()
 *
 * // Create a new batch
 * createBatch.mutate({
 *   batch: {
 *     farmId: 'farm-123',
 *     livestockType: 'poultry',
 *     species: 'Broiler',
 *     initialQuantity: 500,
 *     acquisitionDate: new Date(),
 *     costPerUnit: 100,
 *   }
 * })
 *
 * // Update a batch
 * updateBatch.mutate({
 *   batchId: 'batch-123',
 *   batch: { status: 'depleted' }
 * })
 *
 * // Delete a batch
 * deleteBatch.mutate({ batchId: 'batch-123' })
 * ```
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
 */
export function useBatchMutations(): UseBatchMutationsResult {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['batches', 'common'])

  // Create rollback function for batch queries
  const rollbackBatches = createRollback<Array<BatchRecord>>(
    queryClient,
    BATCH_QUERY_KEYS.all,
  )

  /**
   * Create batch mutation with optimistic updates
   *
   * **Validates: Requirements 4.1, 4.5**
   */
  const createBatch = useMutation<
    string,
    Error,
    CreateBatchInput,
    OptimisticContext<Array<BatchRecord>>
  >({
    mutationFn: async ({ batch }) => {
      return createBatchFn({ data: { batch } })
    },

    /**
     * onMutate: Optimistically add the new batch to the cache
     * - Cancel outgoing refetches to prevent race conditions
     * - Snapshot current cache state for rollback
     * - Add new batch with temporary ID
     */
    onMutate: async ({ batch }) => {
      // Cancel any outgoing refetches
      await cancelQueries(queryClient, BATCH_QUERY_KEYS.all)

      // Snapshot the previous value
      const previousBatches = getQueryData<Array<BatchRecord>>(
        queryClient,
        BATCH_QUERY_KEYS.all,
      )

      // Generate a temporary ID for the new batch
      const tempId = generateEntityTempId('batch')

      // Create the optimistic batch record
      const optimisticBatch: Omit<BatchRecord, 'id'> = {
        farmId: batch.farmId,
        livestockType: batch.livestockType,
        species: batch.species,
        breedId: batch.breedId || null,
        initialQuantity: batch.initialQuantity,
        currentQuantity: batch.initialQuantity,
        acquisitionDate: batch.acquisitionDate,
        costPerUnit: batch.costPerUnit.toString(),
        totalCost: (batch.initialQuantity * batch.costPerUnit).toString(),
        status: 'active',
        batchName: batch.batchName || null,
        sourceSize: batch.sourceSize || null,
        structureId: batch.structureId || null,
        targetHarvestDate: batch.targetHarvestDate || null,
        target_weight_g: batch.target_weight_g || null,
        targetPricePerUnit: batch.targetPricePerUnit?.toString() || null,
        supplierId: batch.supplierId || null,
        notes: batch.notes || null,
      }

      // Optimistically add the new batch
      const updatedBatches = addOptimisticRecord(
        previousBatches,
        optimisticBatch,
        tempId,
      )
      setQueryData(queryClient, BATCH_QUERY_KEYS.all, updatedBatches)

      // Return context for rollback
      return createOptimisticContext(previousBatches, tempId)
    },

    /**
     * onError: Rollback to previous cache state
     */
    onError: (error, _variables, context) => {
      // Rollback to previous state
      rollbackBatches(context)

      // Show error toast with the actual error message
      toast.error(
        error.message ||
          t('messages.createError', {
            defaultValue: 'Failed to create batch',
            ns: 'batches',
          }),
      )
    },

    /**
     * onSuccess: Replace temp ID with server-assigned ID
     *
     * **Validates: Requirement 4.5, 11.1**
     */
    onSuccess: async (serverId, { batch }, context) => {
      if (context.tempId) {
        // Register the temp ID → server ID mapping for dependent mutations
        await tempIdResolver.register(context.tempId, serverId, 'batch')

        // Update pending mutations that reference this temp ID
        tempIdResolver.updatePendingMutations(queryClient)

        // Get current cache data
        const currentBatches = getQueryData<Array<BatchRecord>>(
          queryClient,
          BATCH_QUERY_KEYS.all,
        )

        // Create the server-confirmed batch record
        const serverBatch: BatchRecord = {
          id: serverId,
          farmId: batch.farmId,
          livestockType: batch.livestockType,
          species: batch.species,
          breedId: batch.breedId || null,
          initialQuantity: batch.initialQuantity,
          currentQuantity: batch.initialQuantity,
          acquisitionDate: batch.acquisitionDate,
          costPerUnit: batch.costPerUnit.toString(),
          totalCost: (batch.initialQuantity * batch.costPerUnit).toString(),
          status: 'active',
          batchName: batch.batchName || null,
          sourceSize: batch.sourceSize || null,
          structureId: batch.structureId || null,
          targetHarvestDate: batch.targetHarvestDate || null,
          target_weight_g: batch.target_weight_g || null,
          targetPricePerUnit: batch.targetPricePerUnit?.toString() || null,
          supplierId: batch.supplierId || null,
          notes: batch.notes || null,
          _isOptimistic: false,
          _tempId: undefined,
        }

        // Replace temp record with server record
        const updatedBatches = replaceTempIdWithRecord(
          currentBatches,
          context.tempId,
          serverBatch,
        )
        setQueryData(queryClient, BATCH_QUERY_KEYS.all, updatedBatches)
      }

      // Show success toast
      toast.success(
        t('messages.created', {
          defaultValue: 'Batch created successfully',
          ns: 'batches',
        }),
      )
    },

    /**
     * onSettled: Invalidate queries to ensure fresh data
     */
    onSettled: () => {
      // Invalidate all batch-related queries
      queryClient.invalidateQueries({ queryKey: BATCH_QUERY_KEYS.all })
      // Also invalidate inventory summary
      queryClient.invalidateQueries({ queryKey: BATCH_QUERY_KEYS.summary() })
      // Invalidate farm modules (batch counts may have changed)
      queryClient.invalidateQueries({ queryKey: BATCH_QUERY_KEYS.farmModules })
    },
  })

  /**
   * Update batch mutation with optimistic updates and conflict resolution
   *
   * **Validates: Requirements 4.2, 8.1, 8.2**
   */
  const updateBatch = useMutation<
    unknown,
    Error,
    UpdateBatchInput,
    OptimisticContext<Array<BatchRecord>>
  >({
    mutationFn: async ({ batchId, batch }) => {
      return updateBatchFn({ data: { batchId, batch } })
    },

    /**
     * onMutate: Optimistically update the batch in the cache
     */
    onMutate: async ({ batchId, batch }) => {
      // Cancel any outgoing refetches
      await cancelQueries(queryClient, BATCH_QUERY_KEYS.all)

      // Snapshot the previous value
      const previousBatches = getQueryData<Array<BatchRecord>>(
        queryClient,
        BATCH_QUERY_KEYS.all,
      )

      // Optimistically update the batch
      const updatedBatches = updateById(
        previousBatches,
        batchId,
        batch as Partial<BatchRecord>,
      )
      setQueryData(queryClient, BATCH_QUERY_KEYS.all, updatedBatches)

      // Return context for rollback
      return createOptimisticContext(previousBatches)
    },

    /**
     * onError: Handle conflicts and rollback
     *
     * **Validates: Requirements 8.1, 8.2**
     */
    onError: (error, { batchId }, context) => {
      // Handle conflict errors (409)
      if (isConflictError(error)) {
        const conflictData = extractConflictMetadata<BatchRecord>(error)

        if (conflictData) {
          const { serverVersion, clientVersion, resolution } = conflictData

          if (
            resolution === 'client-wins' ||
            (serverVersion.updatedAt &&
              clientVersion.updatedAt &&
              shouldClientWin(serverVersion.updatedAt, clientVersion.updatedAt))
          ) {
            // Client wins - retry with merged data
            // Keep the optimistic update and let the retry happen
            toast.info(
              t('messages.conflictRetrying', {
                defaultValue: 'Syncing your changes...',
                ns: 'batches',
              }),
            )
            // The mutation will be retried automatically by TanStack Query
            return
          } else {
            // Server wins - accept server version
            // Update cache with server version
            const currentBatches = getQueryData<Array<BatchRecord>>(
              queryClient,
              BATCH_QUERY_KEYS.all,
            )
            if (currentBatches) {
              const updatedBatches = updateById(
                currentBatches,
                batchId,
                serverVersion,
              )
              setQueryData(queryClient, BATCH_QUERY_KEYS.all, updatedBatches)
            }

            toast.info(
              t('messages.conflictServerWins', {
                defaultValue:
                  'Another update was applied. Your view has been refreshed.',
                ns: 'batches',
              }),
            )
            return
          }
        }
      }

      // Rollback to previous state for other errors
      rollbackBatches(context)

      // Show error toast
      toast.error(
        t('messages.updateError', {
          defaultValue: 'Failed to update batch',
          ns: 'batches',
        }),
        {
          description: error.message,
        },
      )
    },

    /**
     * onSuccess: Show success message
     */
    onSuccess: () => {
      toast.success(
        t('messages.updated', {
          defaultValue: 'Batch updated successfully',
          ns: 'batches',
        }),
      )
    },

    /**
     * onSettled: Invalidate queries to ensure fresh data
     */
    onSettled: () => {
      // Invalidate all batch-related queries
      queryClient.invalidateQueries({ queryKey: BATCH_QUERY_KEYS.all })
      // Also invalidate inventory summary
      queryClient.invalidateQueries({ queryKey: BATCH_QUERY_KEYS.summary() })
    },
  })

  /**
   * Delete batch mutation with optimistic updates
   *
   * **Validates: Requirements 4.3, 4.4, 8.3**
   */
  const deleteBatch = useMutation<
    void,
    Error,
    DeleteBatchInput,
    OptimisticContext<Array<BatchRecord>>
  >({
    mutationFn: async ({ batchId }) => {
      await deleteBatchFn({ data: { batchId } })
    },

    /**
     * onMutate: Optimistically remove the batch from the cache
     */
    onMutate: async ({ batchId }) => {
      // Cancel any outgoing refetches
      await cancelQueries(queryClient, BATCH_QUERY_KEYS.all)

      // Snapshot the previous value
      const previousBatches = getQueryData<Array<BatchRecord>>(
        queryClient,
        BATCH_QUERY_KEYS.all,
      )

      // Optimistically remove the batch
      const updatedBatches = removeById(previousBatches, batchId)
      setQueryData(queryClient, BATCH_QUERY_KEYS.all, updatedBatches)

      // Return context for rollback
      return createOptimisticContext(previousBatches)
    },

    /**
     * onError: Handle orphaned mutations (404) and rollback
     *
     * **Validates: Requirement 8.3**
     */
    onError: (error, { batchId }, context) => {
      // Handle orphaned mutations (404 - record no longer exists)
      if (isNotFoundError(error)) {
        // Record was already deleted - this is fine, just log and continue
        import('~/lib/logger').then(({ debug }) => {
          debug(
            `[Orphaned Mutation] Batch ${batchId} not found - already deleted`,
            { batchId },
          )
        })

        // Don't rollback - the record is already gone
        // Just show an info message
        toast.info(
          t('messages.alreadyDeleted', {
            defaultValue: 'Batch was already deleted',
            ns: 'batches',
          }),
        )
        return
      }

      // Rollback to previous state for other errors
      rollbackBatches(context)

      // Show error toast
      toast.error(
        t('messages.deleteError', {
          defaultValue: 'Failed to delete batch',
          ns: 'batches',
        }),
        {
          description: error.message,
        },
      )
    },

    /**
     * onSuccess: Show success message
     */
    onSuccess: () => {
      toast.success(
        t('messages.deleted', {
          defaultValue: 'Batch deleted successfully',
          ns: 'batches',
        }),
      )
    },

    /**
     * onSettled: Invalidate queries to ensure fresh data
     */
    onSettled: () => {
      // Invalidate all batch-related queries
      queryClient.invalidateQueries({ queryKey: BATCH_QUERY_KEYS.all })
      // Also invalidate inventory summary
      queryClient.invalidateQueries({ queryKey: BATCH_QUERY_KEYS.summary() })
      // Invalidate farm modules (batch counts may have changed)
      queryClient.invalidateQueries({ queryKey: BATCH_QUERY_KEYS.farmModules })
    },
  })

  return {
    createBatch,
    updateBatch,
    deleteBatch,
    isPending:
      createBatch.isPending || updateBatch.isPending || deleteBatch.isPending,
  }
}
