import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import {
  createFeedRecordFn,
  deleteFeedRecordFn,
  updateFeedRecordFn,
} from './server'
import type { CreateFeedRecordInput, FeedRecord } from './server'
import type {
  OptimisticContext,
  OptimisticRecord,
} from '~/lib/optimistic-utils'
import {
  addOptimisticRecord,
  cancelQueries,
  createOptimisticContext,
  createRollback,
  generateEntityTempId,
  getQueryData,
  removeById,
  replaceTempIdWithRecord,
  setQueryData,
  updateById,
} from '~/lib/optimistic-utils'
import { tempIdResolver } from '~/lib/temp-id-resolver'

/**
 * Feed record type for cache operations.
 * Extends the base feed data with optimistic markers.
 */
export interface FeedRecordCache extends OptimisticRecord {
  id: string
  batchId: string
  batchSpecies: string | null
  feedType: string
  brandName: string | null
  quantityKg: string
  cost: string
  date: Date
  supplierName: string | null
  notes: string | null
}

/**
 * Query key constants for feed-related queries
 */
export const FEED_QUERY_KEYS = {
  all: ['feed-records'] as const,
  lists: () => [...FEED_QUERY_KEYS.all, 'list'] as const,
  list: (farmId?: string) => [...FEED_QUERY_KEYS.lists(), farmId] as const,
  details: () => [...FEED_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...FEED_QUERY_KEYS.details(), id] as const,
  summary: (farmId?: string) => ['feed-summary', farmId] as const,
  inventory: (farmId?: string) => ['feed-inventory', farmId] as const,
} as const

/**
 * Input type for creating a feed record mutation
 */
export interface CreateFeedInput {
  farmId: string
  record: CreateFeedRecordInput
}

/**
 * Input type for updating a feed record mutation
 */
export interface UpdateFeedInput {
  farmId: string
  recordId: string
  data: Partial<CreateFeedRecordInput>
}

/**
 * Input type for deleting a feed record mutation
 */
export interface DeleteFeedInput {
  farmId: string
  recordId: string
}

/**
 * Result type for the useFeedMutations hook
 */
export interface UseFeedMutationsResult {
  createFeed: ReturnType<
    typeof useMutation<
      string,
      Error,
      CreateFeedInput,
      OptimisticContext<Array<FeedRecordCache>>
    >
  >
  updateFeed: ReturnType<
    typeof useMutation<
      void,
      Error,
      UpdateFeedInput,
      OptimisticContext<Array<FeedRecordCache>>
    >
  >
  deleteFeed: ReturnType<
    typeof useMutation<
      void,
      Error,
      DeleteFeedInput,
      OptimisticContext<Array<FeedRecordCache>>
    >
  >
  isPending: boolean
}

/**
 * Hook for feed record mutations with optimistic updates.
 *
 * Provides create, update, and delete mutations for feed records with:
 * - Immediate UI feedback via optimistic updates
 * - Automatic rollback on failure
 * - Temp ID replacement on success
 * - Cache invalidation on settlement
 *
 * @returns Object containing mutation functions and pending state
 *
 * **Validates: Requirements 5.1**
 */
export function useFeedMutations(): UseFeedMutationsResult {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['feed', 'common'])

  const rollbackFeed = createRollback<Array<FeedRecordCache>>(
    queryClient,
    FEED_QUERY_KEYS.all,
  )

  const createFeed = useMutation<
    string,
    Error,
    CreateFeedInput,
    OptimisticContext<Array<FeedRecordCache>>
  >({
    mutationFn: async ({ farmId, record }) => {
      return createFeedRecordFn({ data: { farmId, record } })
    },

    onMutate: async ({ record }) => {
      await cancelQueries(queryClient, FEED_QUERY_KEYS.all)
      const previousRecords = getQueryData<Array<FeedRecordCache>>(
        queryClient,
        FEED_QUERY_KEYS.all,
      )
      const tempId = generateEntityTempId('feed')

      const optimisticRecord: Omit<FeedRecordCache, 'id'> = {
        batchId: record.batchId,
        batchSpecies: null,
        feedType: record.feedType,
        brandName: record.brandName || null,
        quantityKg: record.quantityKg.toString(),
        cost: record.cost.toString(),
        date: record.date,
        supplierName: null,
        notes: record.notes || null,
      }

      const updatedRecords = addOptimisticRecord(
        previousRecords,
        optimisticRecord,
        tempId,
      )
      setQueryData(queryClient, FEED_QUERY_KEYS.all, updatedRecords)

      return createOptimisticContext(previousRecords, tempId)
    },

    onError: (error, _variables, context) => {
      rollbackFeed(context)
      toast.error(
        t('messages.createError', {
          defaultValue: 'Failed to create feed record',
          ns: 'feed',
        }),
        {
          description: error.message,
        },
      )
    },

    onSuccess: async (serverId, { record }, context) => {
      if (context.tempId) {
        // Register the temp ID → server ID mapping for dependent mutations
        await tempIdResolver.register(context.tempId, serverId, 'feed')

        // Update pending mutations that reference this temp ID
        tempIdResolver.updatePendingMutations(queryClient)

        const currentRecords = getQueryData<Array<FeedRecordCache>>(
          queryClient,
          FEED_QUERY_KEYS.all,
        )
        const serverRecord: FeedRecordCache = {
          id: serverId,
          batchId: record.batchId,
          batchSpecies: null,
          feedType: record.feedType,
          brandName: record.brandName || null,
          quantityKg: record.quantityKg.toString(),
          cost: record.cost.toString(),
          date: record.date,
          supplierName: null,
          notes: record.notes || null,
          _isOptimistic: false,
          _tempId: undefined,
        }
        const updatedRecords = replaceTempIdWithRecord(
          currentRecords,
          context.tempId,
          serverRecord,
        )
        setQueryData(queryClient, FEED_QUERY_KEYS.all, updatedRecords)
      }
      toast.success(
        t('messages.created', {
          defaultValue: 'Feed record created successfully',
          ns: 'feed',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['feed-summary'] })
      queryClient.invalidateQueries({ queryKey: ['feed-inventory'] })
    },
  })

  const updateFeed = useMutation<
    void,
    Error,
    UpdateFeedInput,
    OptimisticContext<Array<FeedRecordCache>>
  >({
    mutationFn: async ({ farmId, recordId, data }) => {
      await updateFeedRecordFn({ data: { farmId, recordId, data } })
    },

    onMutate: async ({ recordId, data }) => {
      await cancelQueries(queryClient, FEED_QUERY_KEYS.all)
      const previousRecords = getQueryData<Array<FeedRecordCache>>(
        queryClient,
        FEED_QUERY_KEYS.all,
      )

      const updates: Partial<FeedRecordCache> = {}
      if (data.feedType) updates.feedType = data.feedType
      if (data.quantityKg !== undefined)
        updates.quantityKg = data.quantityKg.toString()
      if (data.cost !== undefined) updates.cost = data.cost.toString()
      if (data.date) updates.date = data.date
      if (data.notes !== undefined) updates.notes = data.notes || null

      const updatedRecords = updateById(previousRecords, recordId, updates)
      setQueryData(queryClient, FEED_QUERY_KEYS.all, updatedRecords)

      return createOptimisticContext(previousRecords)
    },

    onError: (error, _variables, context) => {
      rollbackFeed(context)
      toast.error(
        t('messages.updateError', {
          defaultValue: 'Failed to update feed record',
          ns: 'feed',
        }),
        {
          description: error.message,
        },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.updated', {
          defaultValue: 'Feed record updated successfully',
          ns: 'feed',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['feed-summary'] })
    },
  })

  const deleteFeed = useMutation<
    void,
    Error,
    DeleteFeedInput,
    OptimisticContext<Array<FeedRecordCache>>
  >({
    mutationFn: async ({ farmId, recordId }) => {
      await deleteFeedRecordFn({ data: { farmId, recordId } })
    },

    onMutate: async ({ recordId }) => {
      await cancelQueries(queryClient, FEED_QUERY_KEYS.all)
      const previousRecords = getQueryData<Array<FeedRecordCache>>(
        queryClient,
        FEED_QUERY_KEYS.all,
      )
      const updatedRecords = removeById(previousRecords, recordId)
      setQueryData(queryClient, FEED_QUERY_KEYS.all, updatedRecords)
      return createOptimisticContext(previousRecords)
    },

    onError: (error, _variables, context) => {
      rollbackFeed(context)
      toast.error(
        t('messages.deleteError', {
          defaultValue: 'Failed to delete feed record',
          ns: 'feed',
        }),
        {
          description: error.message,
        },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.deleted', {
          defaultValue: 'Feed record deleted successfully',
          ns: 'feed',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['feed-summary'] })
      queryClient.invalidateQueries({ queryKey: ['feed-inventory'] })
    },
  })

  return {
    createFeed,
    updateFeed,
    deleteFeed,
    isPending:
      createFeed.isPending || updateFeed.isPending || deleteFeed.isPending,
  }
}
