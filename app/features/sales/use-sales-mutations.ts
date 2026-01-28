import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { createSaleFn, deleteSaleFn, updateSaleFn } from './server'
import type { CreateSaleInput, UpdateSaleInput } from './types'
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
 * Sale record type for cache operations.
 */
export interface SaleRecord extends OptimisticRecord {
    id: string
    farmId: string
    farmName?: string | null
    batchId?: string | null
    batchSpecies?: string | null
    customerId?: string | null
    customerName?: string | null
    livestockType: string
    quantity: number
    unitPrice: string
    totalAmount: string
    date: Date
    notes?: string | null
    unitType?: string | null
    ageWeeks?: number | null
    averageWeightKg?: string | null
    paymentStatus?: string | null
    paymentMethod?: string | null
}

/**
 * Query key constants for sales-related queries
 */
export const SALES_QUERY_KEYS = {
    all: ['sales'] as const,
    lists: () => [...SALES_QUERY_KEYS.all, 'list'] as const,
    list: (farmId?: string) => [...SALES_QUERY_KEYS.lists(), farmId] as const,
    details: () => [...SALES_QUERY_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...SALES_QUERY_KEYS.details(), id] as const,
    summary: (farmId?: string) => ['sales-summary', farmId] as const,
} as const

/**
 * Input type for creating a sale mutation
 */
export interface CreateSaleMutationInput {
    sale: CreateSaleInput
}

/**
 * Input type for updating a sale mutation
 */
export interface UpdateSaleMutationInput {
    saleId: string
    data: UpdateSaleInput
}

/**
 * Input type for deleting a sale mutation
 */
export interface DeleteSaleMutationInput {
    saleId: string
}

/**
 * Result type for the useSalesMutations hook
 */
export interface UseSalesMutationsResult {
    createSale: ReturnType<
        typeof useMutation<
            string,
            Error,
            CreateSaleMutationInput,
            OptimisticContext<Array<SaleRecord>>
        >
    >
    updateSale: ReturnType<
        typeof useMutation<
            boolean,
            Error,
            UpdateSaleMutationInput,
            OptimisticContext<Array<SaleRecord>>
        >
    >
    deleteSale: ReturnType<
        typeof useMutation<
            void,
            Error,
            DeleteSaleMutationInput,
            OptimisticContext<Array<SaleRecord>>
        >
    >
    isPending: boolean
}

/**
 * Hook for sales mutations with optimistic updates.
 *
 * @returns Object containing mutation functions and pending state
 *
 * **Validates: Requirements 6.1**
 */
export function useSalesMutations(): UseSalesMutationsResult {
    const queryClient = useQueryClient()
    const { t } = useTranslation(['sales', 'common'])

    const rollbackSales = createRollback<Array<SaleRecord>>(
        queryClient,
        SALES_QUERY_KEYS.all,
    )

    const createSale = useMutation<
        string,
        Error,
        CreateSaleMutationInput,
        OptimisticContext<Array<SaleRecord>>
    >({
        mutationFn: async ({ sale }) => {
            return createSaleFn({ data: { sale } })
        },

        onMutate: async ({ sale }) => {
            await cancelQueries(queryClient, SALES_QUERY_KEYS.all)

            const previousSales = getQueryData<Array<SaleRecord>>(
                queryClient,
                SALES_QUERY_KEYS.all,
            )
            const tempId = generateEntityTempId('sale')

            const totalAmount = (sale.quantity * sale.unitPrice).toFixed(2)

            const optimisticSale: Omit<SaleRecord, 'id'> = {
                farmId: sale.farmId,
                batchId: sale.batchId || null,
                customerId: sale.customerId || null,
                livestockType: sale.livestockType,
                quantity: sale.quantity,
                unitPrice: sale.unitPrice.toString(),
                totalAmount,
                date: sale.date,
                notes: sale.notes || null,
                unitType: sale.unitType || null,
                ageWeeks: sale.ageWeeks || null,
                averageWeightKg: sale.averageWeightKg?.toString() || null,
                paymentStatus: sale.paymentStatus || 'paid',
                paymentMethod: sale.paymentMethod || null,
            }

            const updatedSales = addOptimisticRecord(
                previousSales,
                optimisticSale,
                tempId,
            )
            setQueryData(queryClient, SALES_QUERY_KEYS.all, updatedSales)

            return createOptimisticContext(previousSales, tempId)
        },

        onError: (error, _variables, context) => {
            rollbackSales(context)
            toast.error(
                t('messages.createError', {
                    defaultValue: 'Failed to create sale',
                    ns: 'sales',
                }),
                { description: error.message },
            )
        },

        onSuccess: async (serverId, { sale }, context) => {
            if (context.tempId) {
                // Register the temp ID → server ID mapping for dependent mutations
                await tempIdResolver.register(context.tempId, serverId, 'sale')

                // Update pending mutations that reference this temp ID
                tempIdResolver.updatePendingMutations(queryClient)

                const currentSales = getQueryData<Array<SaleRecord>>(
                    queryClient,
                    SALES_QUERY_KEYS.all,
                )
                const totalAmount = (sale.quantity * sale.unitPrice).toFixed(2)

                const serverSale: SaleRecord = {
                    id: serverId,
                    farmId: sale.farmId,
                    batchId: sale.batchId || null,
                    customerId: sale.customerId || null,
                    livestockType: sale.livestockType,
                    quantity: sale.quantity,
                    unitPrice: sale.unitPrice.toString(),
                    totalAmount,
                    date: sale.date,
                    notes: sale.notes || null,
                    unitType: sale.unitType || null,
                    ageWeeks: sale.ageWeeks || null,
                    averageWeightKg: sale.averageWeightKg?.toString() || null,
                    paymentStatus: sale.paymentStatus || 'paid',
                    paymentMethod: sale.paymentMethod || null,
                    _isOptimistic: false,
                    _tempId: undefined,
                }

                const updatedSales = replaceTempIdWithRecord(
                    currentSales,
                    context.tempId,
                    serverSale,
                )
                setQueryData(queryClient, SALES_QUERY_KEYS.all, updatedSales)
            }

            toast.success(
                t('messages.created', {
                    defaultValue: 'Sale created successfully',
                    ns: 'sales',
                }),
            )
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.all })
            queryClient.invalidateQueries({ queryKey: ['sales-summary'] })
            queryClient.invalidateQueries({ queryKey: ['batches'] })
        },
    })

    const updateSale = useMutation<
        boolean,
        Error,
        UpdateSaleMutationInput,
        OptimisticContext<Array<SaleRecord>>
    >({
        mutationFn: async ({ saleId, data }) => {
            return updateSaleFn({ data: { saleId, data } })
        },

        onMutate: async ({ saleId, data }) => {
            await cancelQueries(queryClient, SALES_QUERY_KEYS.all)

            const previousSales = getQueryData<Array<SaleRecord>>(
                queryClient,
                SALES_QUERY_KEYS.all,
            )

            const updateData: Partial<SaleRecord> = {}
            if (data.quantity !== undefined) updateData.quantity = data.quantity
            if (data.unitPrice !== undefined)
                updateData.unitPrice = data.unitPrice.toString()
            if (data.date !== undefined) updateData.date = data.date
            if (data.notes !== undefined) updateData.notes = data.notes
            if (data.unitType !== undefined) updateData.unitType = data.unitType
            if (data.ageWeeks !== undefined) updateData.ageWeeks = data.ageWeeks
            if (data.averageWeightKg !== undefined)
                updateData.averageWeightKg =
                    data.averageWeightKg?.toString() || null
            if (data.paymentStatus !== undefined)
                updateData.paymentStatus = data.paymentStatus
            if (data.paymentMethod !== undefined)
                updateData.paymentMethod = data.paymentMethod

            const updatedSales = updateById(previousSales, saleId, updateData)
            setQueryData(queryClient, SALES_QUERY_KEYS.all, updatedSales)

            return createOptimisticContext(previousSales)
        },

        onError: (error, _variables, context) => {
            rollbackSales(context)
            toast.error(
                t('messages.updateError', {
                    defaultValue: 'Failed to update sale',
                    ns: 'sales',
                }),
                { description: error.message },
            )
        },

        onSuccess: () => {
            toast.success(
                t('messages.updated', {
                    defaultValue: 'Sale updated successfully',
                    ns: 'sales',
                }),
            )
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.all })
            queryClient.invalidateQueries({ queryKey: ['sales-summary'] })
        },
    })

    const deleteSale = useMutation<
        void,
        Error,
        DeleteSaleMutationInput,
        OptimisticContext<Array<SaleRecord>>
    >({
        mutationFn: async ({ saleId }) => {
            await deleteSaleFn({ data: { saleId } })
        },

        onMutate: async ({ saleId }) => {
            await cancelQueries(queryClient, SALES_QUERY_KEYS.all)

            const previousSales = getQueryData<Array<SaleRecord>>(
                queryClient,
                SALES_QUERY_KEYS.all,
            )
            const updatedSales = removeById(previousSales, saleId)
            setQueryData(queryClient, SALES_QUERY_KEYS.all, updatedSales)

            return createOptimisticContext(previousSales)
        },

        onError: (error, _variables, context) => {
            rollbackSales(context)
            toast.error(
                t('messages.deleteError', {
                    defaultValue: 'Failed to delete sale',
                    ns: 'sales',
                }),
                { description: error.message },
            )
        },

        onSuccess: () => {
            toast.success(
                t('messages.deleted', {
                    defaultValue: 'Sale deleted successfully',
                    ns: 'sales',
                }),
            )
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.all })
            queryClient.invalidateQueries({ queryKey: ['sales-summary'] })
            queryClient.invalidateQueries({ queryKey: ['batches'] })
        },
    })

    return {
        createSale,
        updateSale,
        deleteSale,
        isPending:
            createSale.isPending ||
            updateSale.isPending ||
            deleteSale.isPending,
    }
}
