import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { createSupplierFn, deleteSupplierFn, updateSupplierFn } from './server'
import type { CreateSupplierInput } from './types'
import type {
  OptimisticContext,
  OptimisticRecord,
} from '~/lib/optimistic-utils'
import { EXPENSE_QUERY_KEYS } from '~/features/expenses/mutations'
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
 * Supplier record type for cache operations.
 */
export interface SupplierCacheRecord extends OptimisticRecord {
  id: string
  name: string
  phone: string
  email?: string | null
  location?: string | null
  products: Array<string>
  supplierType?: string | null
  createdAt?: Date
  totalSpent?: number
  expenseCount?: number
}

/**
 * Query key constants for supplier-related queries
 */
export const SUPPLIER_QUERY_KEYS = {
  all: ['suppliers'] as const,
  lists: () => [...SUPPLIER_QUERY_KEYS.all, 'list'] as const,
  list: (farmId?: string) => [...SUPPLIER_QUERY_KEYS.lists(), farmId] as const,
  details: () => [...SUPPLIER_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SUPPLIER_QUERY_KEYS.details(), id] as const,
} as const

/**
 * Input type for creating a supplier mutation
 */
export interface CreateSupplierMutationInput {
  supplier: CreateSupplierInput
}

/**
 * Input type for updating a supplier mutation
 */
export interface UpdateSupplierMutationInput {
  supplierId: string
  data: Partial<CreateSupplierInput>
}

/**
 * Input type for deleting a supplier mutation
 */
export interface DeleteSupplierMutationInput {
  supplierId: string
}

/**
 * Result type for the useSupplierMutations hook
 */
export interface UseSupplierMutationsResult {
  createSupplier: ReturnType<
    typeof useMutation<
      string,
      Error,
      CreateSupplierMutationInput,
      OptimisticContext<Array<SupplierCacheRecord>>
    >
  >
  updateSupplier: ReturnType<
    typeof useMutation<
      void,
      Error,
      UpdateSupplierMutationInput,
      OptimisticContext<Array<SupplierCacheRecord>>
    >
  >
  deleteSupplier: ReturnType<
    typeof useMutation<
      void,
      Error,
      DeleteSupplierMutationInput,
      OptimisticContext<Array<SupplierCacheRecord>>
    >
  >
  isPending: boolean
}

/**
 * Hook for supplier mutations with optimistic updates.
 *
 * @returns Object containing mutation functions and pending state
 *
 * **Validates: Requirements 7.2**
 */
export function useSupplierMutations(): UseSupplierMutationsResult {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['suppliers', 'common'])

  const rollbackSuppliers = createRollback<Array<SupplierCacheRecord>>(
    queryClient,
    SUPPLIER_QUERY_KEYS.all,
  )

  const createSupplier = useMutation<
    string,
    Error,
    CreateSupplierMutationInput,
    OptimisticContext<Array<SupplierCacheRecord>>
  >({
    mutationFn: async ({ supplier }) => {
      return createSupplierFn({ data: supplier })
    },

    onMutate: async ({ supplier }) => {
      await cancelQueries(queryClient, SUPPLIER_QUERY_KEYS.all)

      const previousSuppliers = getQueryData<Array<SupplierCacheRecord>>(
        queryClient,
        SUPPLIER_QUERY_KEYS.all,
      )
      const tempId = generateEntityTempId('supplier')

      const optimisticSupplier: Omit<SupplierCacheRecord, 'id'> = {
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email || null,
        location: supplier.location || null,
        products: supplier.products,
        supplierType: supplier.supplierType || null,
        createdAt: new Date(),
        totalSpent: 0,
        expenseCount: 0,
      }

      const updatedSuppliers = addOptimisticRecord(
        previousSuppliers,
        optimisticSupplier,
        tempId,
      )
      setQueryData(queryClient, SUPPLIER_QUERY_KEYS.all, updatedSuppliers)

      return createOptimisticContext(previousSuppliers, tempId)
    },

    onError: (error, _variables, context) => {
      rollbackSuppliers(context)
      toast.error(
        t('messages.createError', {
          defaultValue: 'Failed to create supplier',
          ns: 'suppliers',
        }),
        { description: error.message },
      )
    },

    onSuccess: async (serverId, { supplier }, context) => {
      if (context.tempId) {
        // Register the temp ID → server ID mapping for dependent mutations
        await tempIdResolver.register(context.tempId, serverId, 'supplier')

        // Update pending mutations that reference this temp ID
        tempIdResolver.updatePendingMutations(queryClient)

        const currentSuppliers = getQueryData<Array<SupplierCacheRecord>>(
          queryClient,
          SUPPLIER_QUERY_KEYS.all,
        )

        const serverSupplier: SupplierCacheRecord = {
          id: serverId,
          name: supplier.name,
          phone: supplier.phone,
          email: supplier.email || null,
          location: supplier.location || null,
          products: supplier.products,
          supplierType: supplier.supplierType || null,
          createdAt: new Date(),
          totalSpent: 0,
          expenseCount: 0,
          _isOptimistic: false,
          _tempId: undefined,
        }

        const updatedSuppliers = replaceTempIdWithRecord(
          currentSuppliers,
          context.tempId,
          serverSupplier,
        )
        setQueryData(queryClient, SUPPLIER_QUERY_KEYS.all, updatedSuppliers)
      }

      toast.success(
        t('messages.created', {
          defaultValue: 'Supplier created successfully',
          ns: 'suppliers',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_QUERY_KEYS.all })
    },
  })

  const updateSupplier = useMutation<
    void,
    Error,
    UpdateSupplierMutationInput,
    OptimisticContext<Array<SupplierCacheRecord>>
  >({
    mutationFn: async ({ supplierId, data }) => {
      return updateSupplierFn({ data: { id: supplierId, data } })
    },

    onMutate: async ({ supplierId, data }) => {
      await cancelQueries(queryClient, SUPPLIER_QUERY_KEYS.all)

      const previousSuppliers = getQueryData<Array<SupplierCacheRecord>>(
        queryClient,
        SUPPLIER_QUERY_KEYS.all,
      )

      const updateData: Partial<SupplierCacheRecord> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.phone !== undefined) updateData.phone = data.phone
      if (data.email !== undefined) updateData.email = data.email
      if (data.location !== undefined) updateData.location = data.location
      if (data.products !== undefined) updateData.products = data.products
      if (data.supplierType !== undefined)
        updateData.supplierType = data.supplierType

      const updatedSuppliers = updateById(
        previousSuppliers,
        supplierId,
        updateData,
      )
      setQueryData(queryClient, SUPPLIER_QUERY_KEYS.all, updatedSuppliers)

      return createOptimisticContext(previousSuppliers)
    },

    onError: (error, _variables, context) => {
      rollbackSuppliers(context)
      toast.error(
        t('messages.updateError', {
          defaultValue: 'Failed to update supplier',
          ns: 'suppliers',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.updated', {
          defaultValue: 'Supplier updated successfully',
          ns: 'suppliers',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_QUERY_KEYS.all })
    },
  })

  const deleteSupplier = useMutation<
    void,
    Error,
    DeleteSupplierMutationInput,
    OptimisticContext<Array<SupplierCacheRecord>>
  >({
    mutationFn: async ({ supplierId }) => {
      await deleteSupplierFn({ data: { id: supplierId } })
    },

    onMutate: async ({ supplierId }) => {
      await cancelQueries(queryClient, SUPPLIER_QUERY_KEYS.all)

      const previousSuppliers = getQueryData<Array<SupplierCacheRecord>>(
        queryClient,
        SUPPLIER_QUERY_KEYS.all,
      )
      const updatedSuppliers = removeById(previousSuppliers, supplierId)
      setQueryData(queryClient, SUPPLIER_QUERY_KEYS.all, updatedSuppliers)

      return createOptimisticContext(previousSuppliers)
    },

    onError: (error, _variables, context) => {
      rollbackSuppliers(context)
      toast.error(
        t('messages.deleteError', {
          defaultValue: 'Failed to delete supplier',
          ns: 'suppliers',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.deleted', {
          defaultValue: 'Supplier deleted successfully',
          ns: 'suppliers',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: EXPENSE_QUERY_KEYS.all })
    },
  })

  return {
    createSupplier,
    updateSupplier,
    deleteSupplier,
    isPending:
      createSupplier.isPending ||
      updateSupplier.isPending ||
      deleteSupplier.isPending,
  }
}
