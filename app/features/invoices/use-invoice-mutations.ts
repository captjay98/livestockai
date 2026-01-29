import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import {
  createInvoiceFn,
  deleteInvoiceFn,
  updateInvoiceStatusFn,
} from './server'
import type { CreateInvoiceInput } from './types'
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
 * Invoice record type for cache operations.
 */
export interface InvoiceRecord extends OptimisticRecord {
  id: string
  invoiceNumber: string
  customerId: string
  customerName?: string | null
  farmId: string
  farmName?: string | null
  totalAmount: string
  status: 'unpaid' | 'partial' | 'paid'
  date: Date
  dueDate?: Date | null
  notes?: string | null
}

/**
 * Query key constants for invoice-related queries
 */
export const INVOICE_QUERY_KEYS = {
  all: ['invoices'] as const,
  lists: () => [...INVOICE_QUERY_KEYS.all, 'list'] as const,
  list: (farmId?: string) => [...INVOICE_QUERY_KEYS.lists(), farmId] as const,
  details: () => [...INVOICE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INVOICE_QUERY_KEYS.details(), id] as const,
  summary: (farmId?: string) => ['invoices-summary', farmId] as const,
} as const

/**
 * Input type for creating an invoice mutation
 */
export interface CreateInvoiceMutationInput {
  invoice: CreateInvoiceInput
}

/**
 * Input type for updating invoice status mutation
 */
export interface UpdateInvoiceStatusMutationInput {
  invoiceId: string
  status: 'unpaid' | 'partial' | 'paid'
}

/**
 * Input type for deleting an invoice mutation
 */
export interface DeleteInvoiceMutationInput {
  invoiceId: string
}

/**
 * Result type for the useInvoiceMutations hook
 */
export interface UseInvoiceMutationsResult {
  createInvoice: ReturnType<
    typeof useMutation<
      string,
      Error,
      CreateInvoiceMutationInput,
      OptimisticContext<Array<InvoiceRecord>>
    >
  >
  updateInvoiceStatus: ReturnType<
    typeof useMutation<
      void,
      Error,
      UpdateInvoiceStatusMutationInput,
      OptimisticContext<Array<InvoiceRecord>>
    >
  >
  deleteInvoice: ReturnType<
    typeof useMutation<
      void,
      Error,
      DeleteInvoiceMutationInput,
      OptimisticContext<Array<InvoiceRecord>>
    >
  >
  isPending: boolean
}

/**
 * Calculate total amount from invoice items
 */
function calculateTotal(items: CreateInvoiceInput['items']): string {
  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  )
  return total.toFixed(2)
}

/**
 * Generate a temporary invoice number for optimistic updates
 */
function generateTempInvoiceNumber(): string {
  const year = new Date().getFullYear()
  return `INV-${year}-TEMP`
}

/**
 * Hook for invoice mutations with optimistic updates.
 *
 * Provides create, update status, and delete mutations for invoices with:
 * - Immediate UI feedback via optimistic updates
 * - Automatic rollback on failure
 * - Temp ID replacement on success
 * - Cache invalidation on settlement
 *
 * @returns Object containing mutation functions and pending state
 *
 * **Validates: Requirements 6.3, 6.4**
 */
export function useInvoiceMutations(): UseInvoiceMutationsResult {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['invoices', 'common'])

  const rollbackInvoices = createRollback<Array<InvoiceRecord>>(
    queryClient,
    INVOICE_QUERY_KEYS.all,
  )

  /**
   * Create invoice mutation with optimistic updates
   */
  const createInvoice = useMutation<
    string,
    Error,
    CreateInvoiceMutationInput,
    OptimisticContext<Array<InvoiceRecord>>
  >({
    mutationFn: async ({ invoice }) => {
      return createInvoiceFn({ data: invoice })
    },

    onMutate: async ({ invoice }) => {
      await cancelQueries(queryClient, INVOICE_QUERY_KEYS.all)

      const previousInvoices = getQueryData<Array<InvoiceRecord>>(
        queryClient,
        INVOICE_QUERY_KEYS.all,
      )
      const tempId = generateEntityTempId('invoice')

      const totalAmount = calculateTotal(invoice.items)

      const optimisticInvoice: Omit<InvoiceRecord, 'id'> = {
        invoiceNumber: generateTempInvoiceNumber(),
        customerId: invoice.customerId,
        farmId: invoice.farmId,
        totalAmount,
        status: 'unpaid',
        date: new Date(),
        dueDate: invoice.dueDate || null,
        notes: invoice.notes || null,
      }

      const updatedInvoices = addOptimisticRecord(
        previousInvoices,
        optimisticInvoice,
        tempId,
      )
      setQueryData(queryClient, INVOICE_QUERY_KEYS.all, updatedInvoices)

      return createOptimisticContext(previousInvoices, tempId)
    },

    onError: (error, _variables, context) => {
      rollbackInvoices(context)
      toast.error(
        t('messages.createError', {
          defaultValue: 'Failed to create invoice',
          ns: 'invoices',
        }),
        { description: error.message },
      )
    },

    onSuccess: async (serverId, { invoice }, context) => {
      if (context.tempId) {
        // Register the temp ID → server ID mapping for dependent mutations
        await tempIdResolver.register(context.tempId, serverId, 'invoice')

        // Update pending mutations that reference this temp ID
        tempIdResolver.updatePendingMutations(queryClient)

        const currentInvoices = getQueryData<Array<InvoiceRecord>>(
          queryClient,
          INVOICE_QUERY_KEYS.all,
        )
        const totalAmount = calculateTotal(invoice.items)

        const serverInvoice: InvoiceRecord = {
          id: serverId,
          invoiceNumber: `INV-${new Date().getFullYear()}-PENDING`, // Will be updated on refetch
          customerId: invoice.customerId,
          farmId: invoice.farmId,
          totalAmount,
          status: 'unpaid',
          date: new Date(),
          dueDate: invoice.dueDate || null,
          notes: invoice.notes || null,
          _isOptimistic: false,
          _tempId: undefined,
        }

        const updatedInvoices = replaceTempIdWithRecord(
          currentInvoices,
          context.tempId,
          serverInvoice,
        )
        setQueryData(queryClient, INVOICE_QUERY_KEYS.all, updatedInvoices)
      }

      toast.success(
        t('messages.created', {
          defaultValue: 'Invoice created successfully',
          ns: 'invoices',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['invoices-summary'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })

  /**
   * Update invoice status mutation with optimistic updates
   *
   * **Validates: Requirement 6.4**
   */
  const updateInvoiceStatus = useMutation<
    void,
    Error,
    UpdateInvoiceStatusMutationInput,
    OptimisticContext<Array<InvoiceRecord>>
  >({
    mutationFn: async ({ invoiceId, status }) => {
      return updateInvoiceStatusFn({ data: { invoiceId, status } })
    },

    onMutate: async ({ invoiceId, status }) => {
      await cancelQueries(queryClient, INVOICE_QUERY_KEYS.all)

      const previousInvoices = getQueryData<Array<InvoiceRecord>>(
        queryClient,
        INVOICE_QUERY_KEYS.all,
      )

      const updatedInvoices = updateById(previousInvoices, invoiceId, {
        status,
      })
      setQueryData(queryClient, INVOICE_QUERY_KEYS.all, updatedInvoices)

      return createOptimisticContext(previousInvoices)
    },

    onError: (error, _variables, context) => {
      rollbackInvoices(context)
      toast.error(
        t('messages.updateError', {
          defaultValue: 'Failed to update invoice status',
          ns: 'invoices',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.updated', {
          defaultValue: 'Invoice status updated successfully',
          ns: 'invoices',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['invoices-summary'] })
    },
  })

  /**
   * Delete invoice mutation with optimistic updates
   */
  const deleteInvoice = useMutation<
    void,
    Error,
    DeleteInvoiceMutationInput,
    OptimisticContext<Array<InvoiceRecord>>
  >({
    mutationFn: async ({ invoiceId }) => {
      await deleteInvoiceFn({ data: { invoiceId } })
    },

    onMutate: async ({ invoiceId }) => {
      await cancelQueries(queryClient, INVOICE_QUERY_KEYS.all)

      const previousInvoices = getQueryData<Array<InvoiceRecord>>(
        queryClient,
        INVOICE_QUERY_KEYS.all,
      )
      const updatedInvoices = removeById(previousInvoices, invoiceId)
      setQueryData(queryClient, INVOICE_QUERY_KEYS.all, updatedInvoices)

      return createOptimisticContext(previousInvoices)
    },

    onError: (error, _variables, context) => {
      rollbackInvoices(context)
      toast.error(
        t('messages.deleteError', {
          defaultValue: 'Failed to delete invoice',
          ns: 'invoices',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.deleted', {
          defaultValue: 'Invoice deleted successfully',
          ns: 'invoices',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['invoices-summary'] })
    },
  })

  return {
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    isPending:
      createInvoice.isPending ||
      updateInvoiceStatus.isPending ||
      deleteInvoice.isPending,
  }
}
