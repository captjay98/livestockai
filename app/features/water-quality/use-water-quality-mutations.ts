import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { deleteReadingFn, insertReadingFn, updateReadingFn } from './server'
import type { CreateWaterQualityInput, UpdateWaterQualityInput } from './server'
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

export interface WaterQualityRecordCache extends OptimisticRecord {
  id: string
  batchId: string
  date: Date
  ph: string
  temperatureCelsius: string
  dissolvedOxygenMgL: string
  ammoniaMgL: string
  notes: string | null
}

export const WATER_QUALITY_QUERY_KEYS = {
  all: ['water-quality-records'] as const,
  lists: () => [...WATER_QUALITY_QUERY_KEYS.all, 'list'] as const,
  list: (farmId?: string) =>
    [...WATER_QUALITY_QUERY_KEYS.lists(), farmId] as const,
} as const

export interface CreateWaterQualityMutationInput {
  farmId: string
  data: CreateWaterQualityInput
}

export interface UpdateWaterQualityMutationInput {
  recordId: string
  data: UpdateWaterQualityInput
}

export interface DeleteWaterQualityInput {
  recordId: string
}

export interface UseWaterQualityMutationsResult {
  createWaterQuality: ReturnType<
    typeof useMutation<
      string,
      Error,
      CreateWaterQualityMutationInput,
      OptimisticContext<Array<WaterQualityRecordCache>>
    >
  >
  updateWaterQuality: ReturnType<
    typeof useMutation<
      void,
      Error,
      UpdateWaterQualityMutationInput,
      OptimisticContext<Array<WaterQualityRecordCache>>
    >
  >
  deleteWaterQuality: ReturnType<
    typeof useMutation<
      void,
      Error,
      DeleteWaterQualityInput,
      OptimisticContext<Array<WaterQualityRecordCache>>
    >
  >
  isPending: boolean
}

/**
 * Hook for water quality record mutations with optimistic updates.
 *
 * **Validates: Requirements 5.4**
 */
export function useWaterQualityMutations(): UseWaterQualityMutationsResult {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['waterQuality', 'common'])

  const rollbackWaterQuality = createRollback<Array<WaterQualityRecordCache>>(
    queryClient,
    WATER_QUALITY_QUERY_KEYS.all,
  )

  const createWaterQuality = useMutation<
    string,
    Error,
    CreateWaterQualityMutationInput,
    OptimisticContext<Array<WaterQualityRecordCache>>
  >({
    mutationFn: async ({ farmId, data }) => {
      return insertReadingFn({ data: { farmId, data } })
    },

    onMutate: async ({ data }) => {
      await cancelQueries(queryClient, WATER_QUALITY_QUERY_KEYS.all)
      const previousRecords = getQueryData<Array<WaterQualityRecordCache>>(
        queryClient,
        WATER_QUALITY_QUERY_KEYS.all,
      )
      const tempId = generateEntityTempId('water-quality')

      const optimisticRecord: Omit<WaterQualityRecordCache, 'id'> = {
        batchId: data.batchId,
        date: data.date,
        ph: data.ph.toString(),
        temperatureCelsius: data.temperatureCelsius.toString(),
        dissolvedOxygenMgL: data.dissolvedOxygenMgL.toString(),
        ammoniaMgL: data.ammoniaMgL.toString(),
        notes: data.notes || null,
      }

      const updatedRecords = addOptimisticRecord(
        previousRecords,
        optimisticRecord,
        tempId,
      )
      setQueryData(queryClient, WATER_QUALITY_QUERY_KEYS.all, updatedRecords)

      return createOptimisticContext(previousRecords, tempId)
    },

    onError: (error, _variables, context) => {
      rollbackWaterQuality(context)
      toast.error(
        t('messages.createError', {
          defaultValue: 'Failed to create water quality record',
          ns: 'waterQuality',
        }),
        {
          description: error.message,
        },
      )
    },

    onSuccess: async (serverId, { data }, context) => {
      if (context.tempId) {
        // Register the temp ID → server ID mapping for dependent mutations
        await tempIdResolver.register(context.tempId, serverId, 'water-quality')

        // Update pending mutations that reference this temp ID
        tempIdResolver.updatePendingMutations(queryClient)

        const currentRecords = getQueryData<Array<WaterQualityRecordCache>>(
          queryClient,
          WATER_QUALITY_QUERY_KEYS.all,
        )
        const serverRecord: WaterQualityRecordCache = {
          id: serverId,
          batchId: data.batchId,
          date: data.date,
          ph: data.ph.toString(),
          temperatureCelsius: data.temperatureCelsius.toString(),
          dissolvedOxygenMgL: data.dissolvedOxygenMgL.toString(),
          ammoniaMgL: data.ammoniaMgL.toString(),
          notes: data.notes || null,
          _isOptimistic: false,
          _tempId: undefined,
        }
        const updatedRecords = replaceTempIdWithRecord(
          currentRecords,
          context.tempId,
          serverRecord,
        )
        setQueryData(queryClient, WATER_QUALITY_QUERY_KEYS.all, updatedRecords)
      }
      toast.success(
        t('messages.created', {
          defaultValue: 'Water quality record created successfully',
          ns: 'waterQuality',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WATER_QUALITY_QUERY_KEYS.all })
    },
  })

  const updateWaterQuality = useMutation<
    void,
    Error,
    UpdateWaterQualityMutationInput,
    OptimisticContext<Array<WaterQualityRecordCache>>
  >({
    mutationFn: async ({ recordId, data }) => {
      await updateReadingFn({ data: { recordId, data } })
    },

    onMutate: async ({ recordId, data }) => {
      await cancelQueries(queryClient, WATER_QUALITY_QUERY_KEYS.all)
      const previousRecords = getQueryData<Array<WaterQualityRecordCache>>(
        queryClient,
        WATER_QUALITY_QUERY_KEYS.all,
      )

      const updates: Partial<WaterQualityRecordCache> = {}
      if (data.date) updates.date = data.date
      if (data.ph !== undefined) updates.ph = data.ph.toString()
      if (data.temperatureCelsius !== undefined)
        updates.temperatureCelsius = data.temperatureCelsius.toString()
      if (data.dissolvedOxygenMgL !== undefined)
        updates.dissolvedOxygenMgL = data.dissolvedOxygenMgL.toString()
      if (data.ammoniaMgL !== undefined)
        updates.ammoniaMgL = data.ammoniaMgL.toString()
      if (data.notes !== undefined) updates.notes = data.notes

      const updatedRecords = updateById(previousRecords, recordId, updates)
      setQueryData(queryClient, WATER_QUALITY_QUERY_KEYS.all, updatedRecords)

      return createOptimisticContext(previousRecords)
    },

    onError: (error, _variables, context) => {
      rollbackWaterQuality(context)
      toast.error(
        t('messages.updateError', {
          defaultValue: 'Failed to update water quality record',
          ns: 'waterQuality',
        }),
        {
          description: error.message,
        },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.updated', {
          defaultValue: 'Water quality record updated successfully',
          ns: 'waterQuality',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WATER_QUALITY_QUERY_KEYS.all })
    },
  })

  const deleteWaterQuality = useMutation<
    void,
    Error,
    DeleteWaterQualityInput,
    OptimisticContext<Array<WaterQualityRecordCache>>
  >({
    mutationFn: async ({ recordId }) => {
      await deleteReadingFn({ data: { recordId } })
    },

    onMutate: async ({ recordId }) => {
      await cancelQueries(queryClient, WATER_QUALITY_QUERY_KEYS.all)
      const previousRecords = getQueryData<Array<WaterQualityRecordCache>>(
        queryClient,
        WATER_QUALITY_QUERY_KEYS.all,
      )
      const updatedRecords = removeById(previousRecords, recordId)
      setQueryData(queryClient, WATER_QUALITY_QUERY_KEYS.all, updatedRecords)
      return createOptimisticContext(previousRecords)
    },

    onError: (error, _variables, context) => {
      rollbackWaterQuality(context)
      toast.error(
        t('messages.deleteError', {
          defaultValue: 'Failed to delete water quality record',
          ns: 'waterQuality',
        }),
        {
          description: error.message,
        },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.deleted', {
          defaultValue: 'Water quality record deleted successfully',
          ns: 'waterQuality',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WATER_QUALITY_QUERY_KEYS.all })
    },
  })

  return {
    createWaterQuality,
    updateWaterQuality,
    deleteWaterQuality,
    isPending:
      createWaterQuality.isPending ||
      updateWaterQuality.isPending ||
      deleteWaterQuality.isPending,
  }
}
