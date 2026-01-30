import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { createCustomerFn, deleteCustomerFn, updateCustomerFn } from './server'
import type { CreateCustomerInput } from './types'
import type {
  OptimisticContext,
  OptimisticRecord,
} from '~/lib/optimistic-utils'
import { SALES_QUERY_KEYS } from '~/features/sales/mutations'
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
 * Customer record type for cache operations.
 */
export interface CustomerCacheRecord extends OptimisticRecord {
  id: string
  farmId: string
  name: string
  phone: string
  email?: string | null
  location?: string | null
  customerType?: string | null
  createdAt?: Date
  salesCount?: number
  totalSpent?: number
}

/**
 * Query key constants for customer-related queries
 */
export const CUSTOMER_QUERY_KEYS = {
  all: ['customers'] as const,
  lists: () => [...CUSTOMER_QUERY_KEYS.all, 'list'] as const,
  list: (farmId?: string) => [...CUSTOMER_QUERY_KEYS.lists(), farmId] as const,
  details: () => [...CUSTOMER_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CUSTOMER_QUERY_KEYS.details(), id] as const,
  top: (farmId?: string) => ['top-customers', farmId] as const,
} as const

/**
 * Input type for creating a customer mutation
 */
export interface CreateCustomerMutationInput {
  customer: CreateCustomerInput
}

/**
 * Input type for updating a customer mutation
 */
export interface UpdateCustomerMutationInput {
  customerId: string
  data: Partial<Omit<CreateCustomerInput, 'farmId'>>
}

/**
 * Input type for deleting a customer mutation
 */
export interface DeleteCustomerMutationInput {
  customerId: string
}

/**
 * Result type for the useCustomerMutations hook
 */
export interface UseCustomerMutationsResult {
  createCustomer: ReturnType<
    typeof useMutation<
      string,
      Error,
      CreateCustomerMutationInput,
      OptimisticContext<Array<CustomerCacheRecord>>
    >
  >
  updateCustomer: ReturnType<
    typeof useMutation<
      void,
      Error,
      UpdateCustomerMutationInput,
      OptimisticContext<Array<CustomerCacheRecord>>
    >
  >
  deleteCustomer: ReturnType<
    typeof useMutation<
      void,
      Error,
      DeleteCustomerMutationInput,
      OptimisticContext<Array<CustomerCacheRecord>>
    >
  >
  isPending: boolean
}

/**
 * Hook for customer mutations with optimistic updates.
 *
 * @returns Object containing mutation functions and pending state
 *
 * **Validates: Requirements 7.1**
 */
export function useCustomerMutations(): UseCustomerMutationsResult {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['customers', 'common'])

  const rollbackCustomers = createRollback<Array<CustomerCacheRecord>>(
    queryClient,
    CUSTOMER_QUERY_KEYS.all,
  )

  const createCustomer = useMutation<
    string,
    Error,
    CreateCustomerMutationInput,
    OptimisticContext<Array<CustomerCacheRecord>>
  >({
    mutationFn: async ({ customer }) => {
      return createCustomerFn({ data: customer })
    },

    onMutate: async ({ customer }) => {
      await cancelQueries(queryClient, CUSTOMER_QUERY_KEYS.all)

      const previousCustomers = getQueryData<Array<CustomerCacheRecord>>(
        queryClient,
        CUSTOMER_QUERY_KEYS.all,
      )
      const tempId = generateEntityTempId('customer')

      const optimisticCustomer: Omit<CustomerCacheRecord, 'id'> = {
        farmId: customer.farmId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        location: customer.location || null,
        customerType: customer.customerType || null,
        createdAt: new Date(),
        salesCount: 0,
        totalSpent: 0,
      }

      const updatedCustomers = addOptimisticRecord(
        previousCustomers,
        optimisticCustomer,
        tempId,
      )
      setQueryData(queryClient, CUSTOMER_QUERY_KEYS.all, updatedCustomers)

      return createOptimisticContext(previousCustomers, tempId)
    },

    onError: (error, _variables, context) => {
      rollbackCustomers(context)
      toast.error(
        t('messages.createError', {
          defaultValue: 'Failed to create customer',
          ns: 'customers',
        }),
        { description: error.message },
      )
    },

    onSuccess: async (serverId, { customer }, context) => {
      if (context.tempId) {
        // Register the temp ID → server ID mapping for dependent mutations
        await tempIdResolver.register(context.tempId, serverId, 'customer')

        // Update pending mutations that reference this temp ID
        tempIdResolver.updatePendingMutations(queryClient)

        const currentCustomers = getQueryData<Array<CustomerCacheRecord>>(
          queryClient,
          CUSTOMER_QUERY_KEYS.all,
        )

        const serverCustomer: CustomerCacheRecord = {
          id: serverId,
          farmId: customer.farmId,
          name: customer.name,
          phone: customer.phone,
          email: customer.email || null,
          location: customer.location || null,
          customerType: customer.customerType || null,
          createdAt: new Date(),
          salesCount: 0,
          totalSpent: 0,
          _isOptimistic: false,
          _tempId: undefined,
        }

        const updatedCustomers = replaceTempIdWithRecord(
          currentCustomers,
          context.tempId,
          serverCustomer,
        )
        setQueryData(queryClient, CUSTOMER_QUERY_KEYS.all, updatedCustomers)
      }

      toast.success(
        t('messages.created', {
          defaultValue: 'Customer created successfully',
          ns: 'customers',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.top() })
    },
  })

  const updateCustomer = useMutation<
    void,
    Error,
    UpdateCustomerMutationInput,
    OptimisticContext<Array<CustomerCacheRecord>>
  >({
    mutationFn: async ({ customerId, data }) => {
      return updateCustomerFn({ data: { id: customerId, data } })
    },

    onMutate: async ({ customerId, data }) => {
      await cancelQueries(queryClient, CUSTOMER_QUERY_KEYS.all)

      const previousCustomers = getQueryData<Array<CustomerCacheRecord>>(
        queryClient,
        CUSTOMER_QUERY_KEYS.all,
      )

      const updateData: Partial<CustomerCacheRecord> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.phone !== undefined) updateData.phone = data.phone
      if (data.email !== undefined) updateData.email = data.email
      if (data.location !== undefined) updateData.location = data.location
      if (data.customerType !== undefined)
        updateData.customerType = data.customerType

      const updatedCustomers = updateById(
        previousCustomers,
        customerId,
        updateData,
      )
      setQueryData(queryClient, CUSTOMER_QUERY_KEYS.all, updatedCustomers)

      return createOptimisticContext(previousCustomers)
    },

    onError: (error, _variables, context) => {
      rollbackCustomers(context)
      toast.error(
        t('messages.updateError', {
          defaultValue: 'Failed to update customer',
          ns: 'customers',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.updated', {
          defaultValue: 'Customer updated successfully',
          ns: 'customers',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.top() })
    },
  })

  const deleteCustomer = useMutation<
    void,
    Error,
    DeleteCustomerMutationInput,
    OptimisticContext<Array<CustomerCacheRecord>>
  >({
    mutationFn: async ({ customerId }) => {
      await deleteCustomerFn({ data: { id: customerId } })
    },

    onMutate: async ({ customerId }) => {
      await cancelQueries(queryClient, CUSTOMER_QUERY_KEYS.all)

      const previousCustomers = getQueryData<Array<CustomerCacheRecord>>(
        queryClient,
        CUSTOMER_QUERY_KEYS.all,
      )
      const updatedCustomers = removeById(previousCustomers, customerId)
      setQueryData(queryClient, CUSTOMER_QUERY_KEYS.all, updatedCustomers)

      return createOptimisticContext(previousCustomers)
    },

    onError: (error, _variables, context) => {
      rollbackCustomers(context)
      toast.error(
        t('messages.deleteError', {
          defaultValue: 'Failed to delete customer',
          ns: 'customers',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.deleted', {
          defaultValue: 'Customer deleted successfully',
          ns: 'customers',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.top() })
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.all })
    },
  })

  return {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    isPending:
      createCustomer.isPending ||
      updateCustomer.isPending ||
      deleteCustomer.isPending,
  }
}
