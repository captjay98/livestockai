import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import {
    createWeightSampleFn,
    deleteWeightSampleFn,
    updateWeightSampleFn,
} from './server'
import type { CreateWeightSampleInput, UpdateWeightSampleInput } from './server'
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

export interface WeightRecordCache extends OptimisticRecord {
    id: string
    batchId: string
    batchSpecies: string | null
    date: Date
    sampleSize: number
    averageWeightKg: string
    minWeightKg: string | null
    maxWeightKg: string | null
    notes: string | null
}

export const WEIGHT_QUERY_KEYS = {
    all: ['weight-records'] as const,
    lists: () => [...WEIGHT_QUERY_KEYS.all, 'list'] as const,
    list: (farmId?: string) => [...WEIGHT_QUERY_KEYS.lists(), farmId] as const,
    alerts: (farmId?: string) => ['growth-alerts', farmId] as const,
} as const

export interface CreateWeightInput {
    farmId: string
    data: CreateWeightSampleInput
}

export interface UpdateWeightInput {
    recordId: string
    data: UpdateWeightSampleInput
}

export interface DeleteWeightInput {
    recordId: string
}

export interface UseWeightMutationsResult {
    createWeight: ReturnType<
        typeof useMutation<
            string,
            Error,
            CreateWeightInput,
            OptimisticContext<Array<WeightRecordCache>>
        >
    >
    updateWeight: ReturnType<
        typeof useMutation<
            void,
            Error,
            UpdateWeightInput,
            OptimisticContext<Array<WeightRecordCache>>
        >
    >
    deleteWeight: ReturnType<
        typeof useMutation<
            void,
            Error,
            DeleteWeightInput,
            OptimisticContext<Array<WeightRecordCache>>
        >
    >
    isPending: boolean
}

/**
 * Hook for weight sample mutations with optimistic updates.
 *
 * **Validates: Requirements 5.3**
 */
export function useWeightMutations(): UseWeightMutationsResult {
    const queryClient = useQueryClient()
    const { t } = useTranslation(['weight', 'common'])

    const rollbackWeight = createRollback<Array<WeightRecordCache>>(
        queryClient,
        WEIGHT_QUERY_KEYS.all,
    )

    const createWeight = useMutation<
        string,
        Error,
        CreateWeightInput,
        OptimisticContext<Array<WeightRecordCache>>
    >({
        mutationFn: async ({ farmId, data }) => {
            return createWeightSampleFn({ data: { farmId, data } })
        },

        onMutate: async ({ data }) => {
            await cancelQueries(queryClient, WEIGHT_QUERY_KEYS.all)
            const previousRecords = getQueryData<Array<WeightRecordCache>>(
                queryClient,
                WEIGHT_QUERY_KEYS.all,
            )
            const tempId = generateEntityTempId('weight')

            const optimisticRecord: Omit<WeightRecordCache, 'id'> = {
                batchId: data.batchId,
                batchSpecies: null,
                date: data.date,
                sampleSize: data.sampleSize,
                averageWeightKg: data.averageWeightKg.toString(),
                minWeightKg: data.minWeightKg?.toString() || null,
                maxWeightKg: data.maxWeightKg?.toString() || null,
                notes: data.notes || null,
            }

            const updatedRecords = addOptimisticRecord(
                previousRecords,
                optimisticRecord,
                tempId,
            )
            setQueryData(queryClient, WEIGHT_QUERY_KEYS.all, updatedRecords)

            return createOptimisticContext(previousRecords, tempId)
        },

        onError: (error, _variables, context) => {
            rollbackWeight(context)
            toast.error(
                t('messages.createError', {
                    defaultValue: 'Failed to create weight record',
                    ns: 'weight',
                }),
                {
                    description: error.message,
                },
            )
        },

        onSuccess: async (serverId, { data }, context) => {
            if (context.tempId) {
                // Register the temp ID → server ID mapping for dependent mutations
                await tempIdResolver.register(
                    context.tempId,
                    serverId,
                    'weight',
                )

                // Update pending mutations that reference this temp ID
                tempIdResolver.updatePendingMutations(queryClient)

                const currentRecords = getQueryData<Array<WeightRecordCache>>(
                    queryClient,
                    WEIGHT_QUERY_KEYS.all,
                )
                const serverRecord: WeightRecordCache = {
                    id: serverId,
                    batchId: data.batchId,
                    batchSpecies: null,
                    date: data.date,
                    sampleSize: data.sampleSize,
                    averageWeightKg: data.averageWeightKg.toString(),
                    minWeightKg: data.minWeightKg?.toString() || null,
                    maxWeightKg: data.maxWeightKg?.toString() || null,
                    notes: data.notes || null,
                    _isOptimistic: false,
                    _tempId: undefined,
                }
                const updatedRecords = replaceTempIdWithRecord(
                    currentRecords,
                    context.tempId,
                    serverRecord,
                )
                setQueryData(queryClient, WEIGHT_QUERY_KEYS.all, updatedRecords)
            }
            toast.success(
                t('messages.created', {
                    defaultValue: 'Weight record created successfully',
                    ns: 'weight',
                }),
            )
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: WEIGHT_QUERY_KEYS.all })
            queryClient.invalidateQueries({ queryKey: ['growth-alerts'] })
        },
    })

    const updateWeight = useMutation<
        void,
        Error,
        UpdateWeightInput,
        OptimisticContext<Array<WeightRecordCache>>
    >({
        mutationFn: async ({ recordId, data }) => {
            await updateWeightSampleFn({ data: { recordId, data } })
        },

        onMutate: async ({ recordId, data }) => {
            await cancelQueries(queryClient, WEIGHT_QUERY_KEYS.all)
            const previousRecords = getQueryData<Array<WeightRecordCache>>(
                queryClient,
                WEIGHT_QUERY_KEYS.all,
            )

            const updates: Partial<WeightRecordCache> = {}
            if (data.date) updates.date = data.date
            if (data.sampleSize !== undefined)
                updates.sampleSize = data.sampleSize
            if (data.averageWeightKg !== undefined)
                updates.averageWeightKg = data.averageWeightKg.toString()
            if (data.minWeightKg !== undefined)
                updates.minWeightKg = data.minWeightKg?.toString() || null
            if (data.maxWeightKg !== undefined)
                updates.maxWeightKg = data.maxWeightKg?.toString() || null
            if (data.notes !== undefined) updates.notes = data.notes

            const updatedRecords = updateById(
                previousRecords,
                recordId,
                updates,
            )
            setQueryData(queryClient, WEIGHT_QUERY_KEYS.all, updatedRecords)

            return createOptimisticContext(previousRecords)
        },

        onError: (error, _variables, context) => {
            rollbackWeight(context)
            toast.error(
                t('messages.updateError', {
                    defaultValue: 'Failed to update weight record',
                    ns: 'weight',
                }),
                {
                    description: error.message,
                },
            )
        },

        onSuccess: () => {
            toast.success(
                t('messages.updated', {
                    defaultValue: 'Weight record updated successfully',
                    ns: 'weight',
                }),
            )
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: WEIGHT_QUERY_KEYS.all })
            queryClient.invalidateQueries({ queryKey: ['growth-alerts'] })
        },
    })

    const deleteWeight = useMutation<
        void,
        Error,
        DeleteWeightInput,
        OptimisticContext<Array<WeightRecordCache>>
    >({
        mutationFn: async ({ recordId }) => {
            await deleteWeightSampleFn({ data: { recordId } })
        },

        onMutate: async ({ recordId }) => {
            await cancelQueries(queryClient, WEIGHT_QUERY_KEYS.all)
            const previousRecords = getQueryData<Array<WeightRecordCache>>(
                queryClient,
                WEIGHT_QUERY_KEYS.all,
            )
            const updatedRecords = removeById(previousRecords, recordId)
            setQueryData(queryClient, WEIGHT_QUERY_KEYS.all, updatedRecords)
            return createOptimisticContext(previousRecords)
        },

        onError: (error, _variables, context) => {
            rollbackWeight(context)
            toast.error(
                t('messages.deleteError', {
                    defaultValue: 'Failed to delete weight record',
                    ns: 'weight',
                }),
                {
                    description: error.message,
                },
            )
        },

        onSuccess: () => {
            toast.success(
                t('messages.deleted', {
                    defaultValue: 'Weight record deleted successfully',
                    ns: 'weight',
                }),
            )
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: WEIGHT_QUERY_KEYS.all })
            queryClient.invalidateQueries({ queryKey: ['growth-alerts'] })
        },
    })

    return {
        createWeight,
        updateWeight,
        deleteWeight,
        isPending:
            createWeight.isPending ||
            updateWeight.isPending ||
            deleteWeight.isPending,
    }
}
