import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createExpenseFn, deleteExpenseFn, updateExpenseFn } from './server'
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
  const { t } = useTranslation(['expenses'])
  const navigate = useNavigate({ from: routePath as any })

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateSearch = (updates: Partial<ExpenseSearchParams>) => {
    navigate({
      // @ts-ignore - Type limitation
      search: (prev: ExpenseSearchParams) => ({ ...prev, ...updates }),
    })
  }

  const handleCreateSubmit = async (data: Record<string, unknown>) => {
    if (!selectedFarmId) return
    setIsSubmitting(true)
    try {
      await createExpenseFn({
        data: {
          expense: {
            farmId: selectedFarmId,
            category: data.category as ExpenseCategory,
            amount: data.amount as number,
            date: data.date as Date,
            description: data.description as string,
            supplierId: (data.supplierId as string | null) ?? undefined,
            notes: (data.notes as string | null) ?? undefined,
          },
        },
      })
      toast.success(t('messages.recorded'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (data: Record<string, unknown>) => {
    if (!selectedExpense) return
    setIsSubmitting(true)
    try {
      await updateExpenseFn({
        data: {
          expenseId: selectedExpense.id,
          data: {
            category: data.category as ExpenseCategory,
            amount: data.amount as number,
            description: data.description as string,
          },
        },
      })
      toast.success(t('messages.updated'))
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
    } finally {
      setIsSubmitting(false)
    }
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
