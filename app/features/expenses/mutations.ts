import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { createExpenseFn, deleteExpenseFn, updateExpenseFn } from './server'
import type { CreateExpenseInput, UpdateExpenseInput } from './types'
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
 * Expense record type for cache operations.
 */
export interface ExpenseRecord extends OptimisticRecord {
  id: string
  farmId: string
  farmName?: string | null
  batchId?: string | null
  batchSpecies?: string | null
  batchType?: string | null
  category: string
  amount: string
  date: Date
  description: string
  supplierId?: string | null
  supplierName?: string | null
  isRecurring: boolean
}

/**
 * Query key constants for expense-related queries
 */
export const EXPENSE_QUERY_KEYS = {
  all: ['expenses'] as const,
  lists: () => [...EXPENSE_QUERY_KEYS.all, 'list'] as const,
  list: (farmId?: string) => [...EXPENSE_QUERY_KEYS.lists(), farmId] as const,
  details: () => [...EXPENSE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EXPENSE_QUERY_KEYS.details(), id] as const,
  summary: (farmId?: string) => ['expenses-summary', farmId] as const,
} as const

/**
 * Input type for creating an expense mutation
 */
export interface CreateExpenseMutationInput {
  expense: CreateExpenseInput
}

/**
 * Input type for updating an expense mutation
 */
export interface UpdateExpenseMutationInput {
  expenseId: string
  data: UpdateExpenseInput
}

/**
 * Input type for deleting an expense mutation
 */
export interface DeleteExpenseMutationInput {
  expenseId: string
}

/**
 * Result type for the useExpenseMutations hook
 */
export interface UseExpenseMutationsResult {
  createExpense: ReturnType<
    typeof useMutation<
      string,
      Error,
      CreateExpenseMutationInput,
      OptimisticContext<Array<ExpenseRecord>>
    >
  >
  updateExpense: ReturnType<
    typeof useMutation<
      boolean,
      Error,
      UpdateExpenseMutationInput,
      OptimisticContext<Array<ExpenseRecord>>
    >
  >
  deleteExpense: ReturnType<
    typeof useMutation<
      boolean,
      Error,
      DeleteExpenseMutationInput,
      OptimisticContext<Array<ExpenseRecord>>
    >
  >
  isPending: boolean
}

/**
 * Hook for expense mutations with optimistic updates.
 *
 * @returns Object containing mutation functions and pending state
 *
 * **Validates: Requirements 6.2**
 */
export function useExpenseMutations(): UseExpenseMutationsResult {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['expenses', 'common'])

  const rollbackExpenses = createRollback<Array<ExpenseRecord>>(
    queryClient,
    EXPENSE_QUERY_KEYS.all,
  )

  const createExpense = useMutation<
    string,
    Error,
    CreateExpenseMutationInput,
    OptimisticContext<Array<ExpenseRecord>>
  >({
    mutationFn: async ({ expense }) => {
      return createExpenseFn({
        data: {
          expense: {
            farmId: expense.farmId,
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            date: expense.date,
            supplierId: expense.supplierId || undefined,
          },
        },
      })
    },

    onMutate: async ({ expense }) => {
      await cancelQueries(queryClient, EXPENSE_QUERY_KEYS.all)

      const previousExpenses = getQueryData<Array<ExpenseRecord>>(
        queryClient,
        EXPENSE_QUERY_KEYS.all,
      )
      const tempId = generateEntityTempId('expense')

      const optimisticExpense: Omit<ExpenseRecord, 'id'> = {
        farmId: expense.farmId,
        batchId: expense.batchId || null,
        category: expense.category,
        amount: expense.amount.toString(),
        date: expense.date,
        description: expense.description,
        supplierId: expense.supplierId || null,
        isRecurring: expense.isRecurring || false,
      }

      const updatedExpenses = addOptimisticRecord(
        previousExpenses,
        optimisticExpense,
        tempId,
      )
      setQueryData(queryClient, EXPENSE_QUERY_KEYS.all, updatedExpenses)

      return createOptimisticContext(previousExpenses, tempId)
    },

    onError: (error, _variables, context) => {
      rollbackExpenses(context)
      toast.error(
        t('messages.createError', {
          defaultValue: 'Failed to create expense',
          ns: 'expenses',
        }),
        { description: error.message },
      )
    },

    onSuccess: async (serverId, { expense }, context) => {
      if (context.tempId) {
        // Register the temp ID → server ID mapping for dependent mutations
        await tempIdResolver.register(context.tempId, serverId, 'expense')

        // Update pending mutations that reference this temp ID
        tempIdResolver.updatePendingMutations(queryClient)

        const currentExpenses = getQueryData<Array<ExpenseRecord>>(
          queryClient,
          EXPENSE_QUERY_KEYS.all,
        )

        const serverExpense: ExpenseRecord = {
          id: serverId,
          farmId: expense.farmId,
          batchId: expense.batchId || null,
          category: expense.category,
          amount: expense.amount.toString(),
          date: expense.date,
          description: expense.description,
          supplierId: expense.supplierId || null,
          isRecurring: expense.isRecurring || false,
          _isOptimistic: false,
          _tempId: undefined,
        }

        const updatedExpenses = replaceTempIdWithRecord(
          currentExpenses,
          context.tempId,
          serverExpense,
        )
        setQueryData(queryClient, EXPENSE_QUERY_KEYS.all, updatedExpenses)
      }

      toast.success(
        t('messages.created', {
          defaultValue: 'Expense created successfully',
          ns: 'expenses',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: EXPENSE_QUERY_KEYS.summary() })
    },
  })

  const updateExpense = useMutation<
    boolean,
    Error,
    UpdateExpenseMutationInput,
    OptimisticContext<Array<ExpenseRecord>>
  >({
    mutationFn: async ({ expenseId, data }) => {
      return updateExpenseFn({
        data: {
          expenseId,
          data: {
            category: data.category,
            description: data.description,
            amount: data.amount,
            date: data.date,
            supplierId: data.supplierId || undefined,
          },
        },
      })
    },

    onMutate: async ({ expenseId, data }) => {
      await cancelQueries(queryClient, EXPENSE_QUERY_KEYS.all)

      const previousExpenses = getQueryData<Array<ExpenseRecord>>(
        queryClient,
        EXPENSE_QUERY_KEYS.all,
      )

      const updateData: Partial<ExpenseRecord> = {}
      if (data.category !== undefined) updateData.category = data.category
      if (data.amount !== undefined) updateData.amount = data.amount.toString()
      if (data.date !== undefined) updateData.date = data.date
      if (data.description !== undefined)
        updateData.description = data.description
      if (data.batchId !== undefined) updateData.batchId = data.batchId
      if (data.supplierId !== undefined) updateData.supplierId = data.supplierId
      if (data.isRecurring !== undefined)
        updateData.isRecurring = data.isRecurring

      const updatedExpenses = updateById(
        previousExpenses,
        expenseId,
        updateData,
      )
      setQueryData(queryClient, EXPENSE_QUERY_KEYS.all, updatedExpenses)

      return createOptimisticContext(previousExpenses)
    },

    onError: (error, _variables, context) => {
      rollbackExpenses(context)
      toast.error(
        t('messages.updateError', {
          defaultValue: 'Failed to update expense',
          ns: 'expenses',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.updated', {
          defaultValue: 'Expense updated successfully',
          ns: 'expenses',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: EXPENSE_QUERY_KEYS.summary() })
    },
  })

  const deleteExpense = useMutation<
    boolean,
    Error,
    DeleteExpenseMutationInput,
    OptimisticContext<Array<ExpenseRecord>>
  >({
    mutationFn: async ({ expenseId }) => {
      return deleteExpenseFn({ data: { expenseId } })
    },

    onMutate: async ({ expenseId }) => {
      await cancelQueries(queryClient, EXPENSE_QUERY_KEYS.all)

      const previousExpenses = getQueryData<Array<ExpenseRecord>>(
        queryClient,
        EXPENSE_QUERY_KEYS.all,
      )
      const updatedExpenses = removeById(previousExpenses, expenseId)
      setQueryData(queryClient, EXPENSE_QUERY_KEYS.all, updatedExpenses)

      return createOptimisticContext(previousExpenses)
    },

    onError: (error, _variables, context) => {
      rollbackExpenses(context)
      toast.error(
        t('messages.deleteError', {
          defaultValue: 'Failed to delete expense',
          ns: 'expenses',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.deleted', {
          defaultValue: 'Expense deleted successfully',
          ns: 'expenses',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: EXPENSE_QUERY_KEYS.summary() })
    },
  })

  return {
    createExpense,
    updateExpense,
    deleteExpense,
    isPending:
      createExpense.isPending ||
      updateExpense.isPending ||
      deleteExpense.isPending,
  }
}
