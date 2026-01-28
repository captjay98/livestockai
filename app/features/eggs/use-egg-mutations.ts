import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import {
  createEggRecordFn,
  deleteEggRecordFn,
  updateEggRecordFn,
} from './server'
import type { CreateEggRecordInput, UpdateEggRecordInput } from './server'
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
 * Egg record type for cache operations.
 */
export interface EggRecord extends OptimisticRecord {
  id: string
  batchId: string
  batchSpecies?: string | null
  farmId?: string
  farmName?: string | null
  date: Date
  quantityCollected: number
  quantityBroken: number
  quantitySold: number
}

/**
 * Query key constants for egg-related queries
 */
export const EGG_QUERY_KEYS = {
  all: ['eggs'] as const,
  lists: () => [...EGG_QUERY_KEYS.all, 'list'] as const,
  list: (farmId?: string) => [...EGG_QUERY_KEYS.lists(), farmId] as const,
  details: () => [...EGG_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EGG_QUERY_KEYS.details(), id] as const,
  summary: (farmId?: string) => ['egg-summary', farmId] as const,
} as const

/**
 * Input type for creating an egg record mutation
 */
export interface CreateEggInput {
  farmId: string
  record: CreateEggRecordInput
}

/**
 * Input type for updating an egg record mutation
 */
export interface UpdateEggInput {
  recordId: string
  data: UpdateEggRecordInput
}

/**
 * Input type for deleting an egg record mutation
 */
export interface DeleteEggInput {
  farmId: string
  recordId: string
}

/**
 * Result type for the useEggMutations hook
 */
export interface UseEggMutationsResult {
  createEgg: ReturnType<
    typeof useMutation<
      string,
      Error,
      CreateEggInput,
      OptimisticContext<Array<EggRecord>>
    >
  >
  updateEgg: ReturnType<
    typeof useMutation<
      boolean,
      Error,
      UpdateEggInput,
      OptimisticContext<Array<EggRecord>>
    >
  >
  deleteEgg: ReturnType<
    typeof useMutation<
      void,
      Error,
      DeleteEggInput,
      OptimisticContext<Array<EggRecord>>
    >
  >
  isPending: boolean
}

/**
 * Hook for egg record mutations with optimistic updates.
 *
 * @returns Object containing mutation functions and pending state
 *
 * **Validates: Requirements 5.5**
 */
export function useEggMutations(): UseEggMutationsResult {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['eggs', 'common'])

  const rollbackEggs = createRollback<Array<EggRecord>>(
    queryClient,
    EGG_QUERY_KEYS.all,
  )

  const createEgg = useMutation<
    string,
    Error,
    CreateEggInput,
    OptimisticContext<Array<EggRecord>>
  >({
    mutationFn: async ({ farmId, record }) => {
      return createEggRecordFn({ data: { farmId, record } })
    },

    onMutate: async ({ record }) => {
      await cancelQueries(queryClient, EGG_QUERY_KEYS.all)

      const previousEggs = getQueryData<Array<EggRecord>>(
        queryClient,
        EGG_QUERY_KEYS.all,
      )
      const tempId = generateEntityTempId('egg')

      const optimisticEgg: Omit<EggRecord, 'id'> = {
        batchId: record.batchId,
        date: record.date,
        quantityCollected: record.quantityCollected,
        quantityBroken: record.quantityBroken,
        quantitySold: record.quantitySold,
      }

      const updatedEggs = addOptimisticRecord(
        previousEggs,
        optimisticEgg,
        tempId,
      )
      setQueryData(queryClient, EGG_QUERY_KEYS.all, updatedEggs)

      return createOptimisticContext(previousEggs, tempId)
    },

    onError: (error, _variables, context) => {
      rollbackEggs(context)
      toast.error(
        t('messages.createError', {
          defaultValue: 'Failed to create egg record',
          ns: 'eggs',
        }),
        { description: error.message },
      )
    },

    onSuccess: async (serverId, { record }, context) => {
      if (context.tempId) {
        // Register the temp ID → server ID mapping for dependent mutations
        await tempIdResolver.register(context.tempId, serverId, 'egg')

        // Update pending mutations that reference this temp ID
        tempIdResolver.updatePendingMutations(queryClient)

        const currentEggs = getQueryData<Array<EggRecord>>(
          queryClient,
          EGG_QUERY_KEYS.all,
        )

        const serverEgg: EggRecord = {
          id: serverId,
          batchId: record.batchId,
          date: record.date,
          quantityCollected: record.quantityCollected,
          quantityBroken: record.quantityBroken,
          quantitySold: record.quantitySold,
          _isOptimistic: false,
          _tempId: undefined,
        }

        const updatedEggs = replaceTempIdWithRecord(
          currentEggs,
          context.tempId,
          serverEgg,
        )
        setQueryData(queryClient, EGG_QUERY_KEYS.all, updatedEggs)
      }

      toast.success(
        t('messages.created', {
          defaultValue: 'Egg record created successfully',
          ns: 'eggs',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: EGG_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['egg-summary'] })
    },
  })

  const updateEgg = useMutation<
    boolean,
    Error,
    UpdateEggInput,
    OptimisticContext<Array<EggRecord>>
  >({
    mutationFn: async ({ recordId, data }) => {
      return updateEggRecordFn({ data: { recordId, data } })
    },

    onMutate: async ({ recordId, data }) => {
      await cancelQueries(queryClient, EGG_QUERY_KEYS.all)

      const previousEggs = getQueryData<Array<EggRecord>>(
        queryClient,
        EGG_QUERY_KEYS.all,
      )
      const updatedEggs = updateById(
        previousEggs,
        recordId,
        data as Partial<EggRecord>,
      )
      setQueryData(queryClient, EGG_QUERY_KEYS.all, updatedEggs)

      return createOptimisticContext(previousEggs)
    },

    onError: (error, _variables, context) => {
      rollbackEggs(context)
      toast.error(
        t('messages.updateError', {
          defaultValue: 'Failed to update egg record',
          ns: 'eggs',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.updated', {
          defaultValue: 'Egg record updated successfully',
          ns: 'eggs',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: EGG_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['egg-summary'] })
    },
  })

  const deleteEgg = useMutation<
    void,
    Error,
    DeleteEggInput,
    OptimisticContext<Array<EggRecord>>
  >({
    mutationFn: async ({ farmId, recordId }) => {
      await deleteEggRecordFn({ data: { farmId, recordId } })
    },

    onMutate: async ({ recordId }) => {
      await cancelQueries(queryClient, EGG_QUERY_KEYS.all)

      const previousEggs = getQueryData<Array<EggRecord>>(
        queryClient,
        EGG_QUERY_KEYS.all,
      )
      const updatedEggs = removeById(previousEggs, recordId)
      setQueryData(queryClient, EGG_QUERY_KEYS.all, updatedEggs)

      return createOptimisticContext(previousEggs)
    },

    onError: (error, _variables, context) => {
      rollbackEggs(context)
      toast.error(
        t('messages.deleteError', {
          defaultValue: 'Failed to delete egg record',
          ns: 'eggs',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.deleted', {
          defaultValue: 'Egg record deleted successfully',
          ns: 'eggs',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: EGG_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['egg-summary'] })
    },
  })

  return {
    createEgg,
    updateEgg,
    deleteEgg,
    isPending:
      createEgg.isPending || updateEgg.isPending || deleteEgg.isPending,
  }
}
