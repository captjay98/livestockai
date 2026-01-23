import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createExpenseFn,
  deleteExpenseFn,
  getExpensesPaginatedFn,
  updateExpenseFn,
} from './server'
import type {
  ExpenseBatch,
  ExpenseCategory,
  ExpenseSearchParams,
  ExpenseSupplier,
  ExpensesSummaryData,
  PaginatedResult,
} from './types'
import type { Expense } from '~/components/expenses/expense-columns'
import { getBatchesFn } from '~/features/batches/server'
import { getSuppliersFn } from '~/features/suppliers/server'

interface UseExpensePageProps {
  selectedFarmId: string | null
  searchParams: ExpenseSearchParams
  routePath: string
}

export function useExpensePage({
  selectedFarmId,
  searchParams,
  routePath,
}: UseExpensePageProps) {
  const { t } = useTranslation(['expenses'])
  const navigate = useNavigate({ from: routePath as any })

  const [paginatedExpenses, setPaginatedExpenses] = useState<
    PaginatedResult<Expense>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [batches, setBatches] = useState<Array<ExpenseBatch>>([])
  const [suppliers, setSuppliers] = useState<Array<ExpenseSupplier>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary, setSummary] = useState<ExpensesSummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [paginatedResult, summaryResult, batchesResult, suppliersResult] =
        await Promise.all([
          getExpensesPaginatedFn({
            data: {
              farmId: selectedFarmId || undefined,
              page: searchParams.page,
              pageSize: searchParams.pageSize,
              sortBy: searchParams.sortBy,
              sortOrder: searchParams.sortOrder,
              search: searchParams.q,
              category: searchParams.category,
            },
          } as any),
          // Note: getExpensesSummary needs to be updated to be a server function
          Promise.resolve({ byCategory: {}, total: { count: 0, amount: 0 } } as any),
          selectedFarmId
            ? getBatchesFn({ data: { farmId: selectedFarmId } })
            : Promise.resolve([]),
          getSuppliersFn(),
        ])

      setPaginatedExpenses(paginatedResult as PaginatedResult<Expense>)
      setSummary(summaryResult as ExpensesSummaryData)
      setBatches(
        batchesResult.filter(
          (b: any) => b.status === 'active',
        ) as Array<ExpenseBatch>,
      )
      setSuppliers(suppliersResult as Array<ExpenseSupplier>)
    } catch (err) {
      console.error('Failed to load expenses data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedFarmId, searchParams])

  const updateSearch = (updates: Partial<ExpenseSearchParams>) => {
    navigate({
      // @ts-ignore - Type limitation
      search: (prev: any) => ({ ...prev, ...updates }),
    })
  }

  const handleCreateSubmit = async (data: any) => {
    if (!selectedFarmId) return
    setIsSubmitting(true)
    try {
      await createExpenseFn({
        data: {
          expense: {
            farmId: selectedFarmId,
            ...data,
          },
        },
      })
      toast.success(t('messages.recorded'))
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (data: any) => {
    if (!selectedExpense) return
    setIsSubmitting(true)
    try {
      await updateExpenseFn({
        data: {
          expenseId: selectedExpense.id,
          data: {
            category: data.category as ExpenseCategory,
            amount: data.amount,
            description: data.description,
          },
        },
      })
      toast.success(t('messages.updated'))
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedExpense) return
    setIsSubmitting(true)
    try {
      await deleteExpenseFn({ data: { expenseId: selectedExpense.id } })
      toast.success(t('messages.deleted'))
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    paginatedExpenses,
    summary,
    isLoading,
    selectedExpense,
    setSelectedExpense,
    batches,
    suppliers,
    isSubmitting,
    updateSearch,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  }
}
