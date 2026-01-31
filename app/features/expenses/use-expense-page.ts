import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useExpenseMutations } from './mutations'
import type { ExpenseCategory, ExpenseSearchParams } from './types'
import type { Expense } from '~/components/expenses/expense-columns'

interface UseExpensePageProps {
  selectedFarmId: string | null
  routePath: string
}

export function useExpensePage({
  selectedFarmId,
  routePath,
}: UseExpensePageProps) {
  const navigate = useNavigate({ from: routePath as any })

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const {
    createExpense,
    updateExpense,
    deleteExpense,
    isPending: isSubmitting,
  } = useExpenseMutations()

  const updateSearch = (updates: Partial<ExpenseSearchParams>) => {
    navigate({
      // @ts-ignore - Type limitation
      search: (prev: ExpenseSearchParams) => ({ ...prev, ...updates }),
    })
  }

  const handleCreateSubmit = (data: Record<string, unknown>) => {
    if (!selectedFarmId) return
    createExpense.mutate({
      expense: {
        farmId: selectedFarmId,
        category: data.category as ExpenseCategory,
        amount: data.amount as number,
        date: data.date as Date,
        description: data.description as string,
        supplierId: (data.supplierId as string | null) ?? undefined,
      },
    })
  }

  const handleEditSubmit = (data: Record<string, unknown>) => {
    if (!selectedExpense) return
    updateExpense.mutate({
      expenseId: selectedExpense.id,
      data: {
        category: data.category as ExpenseCategory,
        amount: data.amount as number,
        description: data.description as string,
      },
    })
  }

  const handleDeleteConfirm = () => {
    if (!selectedExpense) return
    deleteExpense.mutate({ expenseId: selectedExpense.id })
  }

  return {
    selectedExpense,
    setSelectedExpense,
    isSubmitting,
    updateSearch,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  }
}
