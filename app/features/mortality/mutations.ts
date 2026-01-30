import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import {
  deleteMortalityRecordFn,
  recordMortalityFn,
  updateMortalityRecordFn,
} from './server'
import type { CreateMortalityData, UpdateMortalityInput } from './server'
import type {
  OptimisticContext,
  OptimisticRecord,
} from '~/lib/optimistic-utils'
import { BATCH_QUERY_KEYS } from '~/features/batches/mutations'
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

export interface MortalityRecordCache extends OptimisticRecord {
  id: string
  batchId: string
  species: string
  livestockType: string
  farmName: string
  farmId: string
  quantity: number
  date: Date
  cause: string
  notes: string | null
  createdAt: Date
}

export const MORTALITY_QUERY_KEYS = {
  all: ['mortality-records'] as const,
  lists: () => [...MORTALITY_QUERY_KEYS.all, 'list'] as const,
  list: (farmId?: string) => [...MORTALITY_QUERY_KEYS.lists(), farmId] as const,
  summary: (farmId?: string) => ['mortality-summary', farmId] as const,
} as const

export interface CreateMortalityInput {
  farmId: string
  data: CreateMortalityData
}

export interface UpdateMortalityMutationInput {
  recordId: string
  data: UpdateMortalityInput
}

export interface DeleteMortalityInput {
  recordId: string
}

export interface UseMortalityMutationsResult {
  createMortality: ReturnType<
    typeof useMutation<
      string,
      Error,
      CreateMortalityInput,
      OptimisticContext<Array<MortalityRecordCache>>
    >
  >
  updateMortality: ReturnType<
    typeof useMutation<
      void,
      Error,
      UpdateMortalityMutationInput,
      OptimisticContext<Array<MortalityRecordCache>>
    >
  >
  deleteMortality: ReturnType<
    typeof useMutation<
      void,
      Error,
      DeleteMortalityInput,
      OptimisticContext<Array<MortalityRecordCache>>
    >
  >
  isPending: boolean
}

/**
 * Hook for mortality record mutations with optimistic updates.
 *
 * **Validates: Requirements 5.2**
 */
export function useMortalityMutations(): UseMortalityMutationsResult {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['mortality', 'common'])

  const rollbackMortality = createRollback<Array<MortalityRecordCache>>(
    queryClient,
    MORTALITY_QUERY_KEYS.all,
  )

  const createMortality = useMutation<
    string,
    Error,
    CreateMortalityInput,
    OptimisticContext<Array<MortalityRecordCache>>
  >({
    mutationFn: async ({ farmId, data }) => {
      return recordMortalityFn({ data: { farmId, data } })
    },

    onMutate: async ({ data }) => {
      await cancelQueries(queryClient, MORTALITY_QUERY_KEYS.all)
      const previousRecords = getQueryData<Array<MortalityRecordCache>>(
        queryClient,
        MORTALITY_QUERY_KEYS.all,
      )
      const tempId = generateEntityTempId('mortality')

      const optimisticRecord: Omit<MortalityRecordCache, 'id'> = {
        batchId: data.batchId,
        species: '',
        livestockType: '',
        farmName: '',
        farmId: '',
        quantity: data.quantity,
        date: data.date,
        cause: data.cause,
        notes: data.notes || null,
        createdAt: new Date(),
      }

      const updatedRecords = addOptimisticRecord(
        previousRecords,
        optimisticRecord,
        tempId,
      )
      setQueryData(queryClient, MORTALITY_QUERY_KEYS.all, updatedRecords)

      return createOptimisticContext(previousRecords, tempId)
    },

    onError: (error, _variables, context) => {
      rollbackMortality(context)
      toast.error(
        t('messages.createError', {
          defaultValue: 'Failed to record mortality',
          ns: 'mortality',
        }),
        {
          description: error.message,
        },
      )
    },

    onSuccess: async (serverId, { data }, context) => {
      if (context.tempId) {
        // Register the temp ID → server ID mapping for dependent mutations
        await tempIdResolver.register(context.tempId, serverId, 'mortality')

        // Update pending mutations that reference this temp ID
        tempIdResolver.updatePendingMutations(queryClient)

        const currentRecords = getQueryData<Array<MortalityRecordCache>>(
          queryClient,
          MORTALITY_QUERY_KEYS.all,
        )
        const serverRecord: MortalityRecordCache = {
          id: serverId,
          batchId: data.batchId,
          species: '',
          livestockType: '',
          farmName: '',
          farmId: '',
          quantity: data.quantity,
          date: data.date,
          cause: data.cause,
          notes: data.notes || null,
          createdAt: new Date(),
          _isOptimistic: false,
          _tempId: undefined,
        }
        const updatedRecords = replaceTempIdWithRecord(
          currentRecords,
          context.tempId,
          serverRecord,
        )
        setQueryData(queryClient, MORTALITY_QUERY_KEYS.all, updatedRecords)
      }
      toast.success(
        t('messages.created', {
          defaultValue: 'Mortality recorded successfully',
          ns: 'mortality',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: MORTALITY_QUERY_KEYS.all,
      })
      queryClient.invalidateQueries({
        queryKey: MORTALITY_QUERY_KEYS.summary(),
      })
      queryClient.invalidateQueries({ queryKey: BATCH_QUERY_KEYS.all })
    },
  })

  const updateMortality = useMutation<
    void,
    Error,
    UpdateMortalityMutationInput,
    OptimisticContext<Array<MortalityRecordCache>>
  >({
    mutationFn: async ({ recordId, data }) => {
      await updateMortalityRecordFn({ data: { recordId, data } })
    },

    onMutate: async ({ recordId, data }) => {
      await cancelQueries(queryClient, MORTALITY_QUERY_KEYS.all)
      const previousRecords = getQueryData<Array<MortalityRecordCache>>(
        queryClient,
        MORTALITY_QUERY_KEYS.all,
      )

      const updates: Partial<MortalityRecordCache> = {}
      if (data.quantity !== undefined) updates.quantity = data.quantity
      if (data.date) updates.date = data.date
      if (data.cause) updates.cause = data.cause
      if (data.notes !== undefined) updates.notes = data.notes

      const updatedRecords = updateById(previousRecords, recordId, updates)
      setQueryData(queryClient, MORTALITY_QUERY_KEYS.all, updatedRecords)

      return createOptimisticContext(previousRecords)
    },

    onError: (error, _variables, context) => {
      rollbackMortality(context)
      toast.error(
        t('messages.updateError', {
          defaultValue: 'Failed to update mortality record',
          ns: 'mortality',
        }),
        {
          description: error.message,
        },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.updated', {
          defaultValue: 'Mortality record updated successfully',
          ns: 'mortality',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: MORTALITY_QUERY_KEYS.all,
      })
      queryClient.invalidateQueries({
        queryKey: MORTALITY_QUERY_KEYS.summary(),
      })
      queryClient.invalidateQueries({ queryKey: BATCH_QUERY_KEYS.all })
    },
  })

  const deleteMortality = useMutation<
    void,
    Error,
    DeleteMortalityInput,
    OptimisticContext<Array<MortalityRecordCache>>
  >({
    mutationFn: async ({ recordId }) => {
      await deleteMortalityRecordFn({ data: { recordId } })
    },

    onMutate: async ({ recordId }) => {
      await cancelQueries(queryClient, MORTALITY_QUERY_KEYS.all)
      const previousRecords = getQueryData<Array<MortalityRecordCache>>(
        queryClient,
        MORTALITY_QUERY_KEYS.all,
      )
      const updatedRecords = removeById(previousRecords, recordId)
      setQueryData(queryClient, MORTALITY_QUERY_KEYS.all, updatedRecords)
      return createOptimisticContext(previousRecords)
    },

    onError: (error, _variables, context) => {
      rollbackMortality(context)
      toast.error(
        t('messages.deleteError', {
          defaultValue: 'Failed to delete mortality record',
          ns: 'mortality',
        }),
        {
          description: error.message,
        },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.deleted', {
          defaultValue: 'Mortality record deleted successfully',
          ns: 'mortality',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: MORTALITY_QUERY_KEYS.all,
      })
      queryClient.invalidateQueries({
        queryKey: MORTALITY_QUERY_KEYS.summary(),
      })
      queryClient.invalidateQueries({ queryKey: BATCH_QUERY_KEYS.all })
    },
  })

  return {
    createMortality,
    updateMortality,
    deleteMortality,
    isPending:
      createMortality.isPending ||
      updateMortality.isPending ||
      deleteMortality.isPending,
  }
}
