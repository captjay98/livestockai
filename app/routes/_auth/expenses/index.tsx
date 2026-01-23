import { createFileRoute } from '@tanstack/react-router'
import { Plus, Receipt, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Expense } from '~/components/expenses/expense-columns'
import { getExpenseColumns } from '~/components/expenses/expense-columns'
import { validateExpenseSearch } from '~/features/expenses/validation'
import { useExpensePage } from '~/features/expenses/use-expense-page'
import { useFormatCurrency, useFormatDate } from '~/features/settings'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { useFarm } from '~/features/farms/context'
import { PageHeader } from '~/components/page-header'
import {
  ExpenseDetailsDialog,
  ExpenseFormDialog,
  ExpensesSummary,
} from '~/components/expenses'
import { ExpenseFilters } from '~/components/expenses/expense-filters'
import { DeleteExpenseDialog } from '~/components/expenses/delete-dialog'

export const Route = createFileRoute('/_auth/expenses/')({
  component: ExpensesPage,
  validateSearch: validateExpenseSearch,
})

function ExpensesPage() {
  const { t } = useTranslation(['expenses', 'common'])
  const { selectedFarmId } = useFarm()
  const { format: formatCurrency, symbol: currencySymbol } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()
  const searchParams = Route.useSearch()

  const {
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
  } = useExpensePage({
    selectedFarmId,
    searchParams,
    routePath: Route.fullPath,
  })

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleView = (expense: Expense) => {
    setSelectedExpense(expense)
    setViewOpen(true)
  }

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense)
    setFormOpen(true)
  }

  const handleDelete = (expense: Expense) => {
    setSelectedExpense(expense)
    setDeleteOpen(true)
  }

  const handleFormSubmit = async (data: any) => {
    if (selectedExpense) {
      await handleEditSubmit(data)
    } else {
      await handleCreateSubmit(data)
    }
    setFormOpen(false)
  }

  const handleDeleteSubmit = async () => {
    await handleDeleteConfirm()
    setDeleteOpen(false)
  }

  const columns = useMemo(
    () =>
      getExpenseColumns({
        t,
        formatCurrency,
        formatDate,
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [t, formatCurrency, formatDate],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        icon={Receipt}
        actions={
          <Button
            onClick={() => {
              setSelectedExpense(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('record')}
          </Button>
        }
      />

      {summary && (
        <ExpensesSummary summary={summary} formatCurrency={formatCurrency} />
      )}

      <DataTable
        columns={columns}
        data={paginatedExpenses.data}
        total={paginatedExpenses.total}
        page={paginatedExpenses.page}
        pageSize={paginatedExpenses.pageSize}
        totalPages={paginatedExpenses.totalPages}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        searchValue={searchParams.q}
        isLoading={isLoading}
        onPaginationChange={(page, pageSize) =>
          updateSearch({ page, pageSize })
        }
        onSortChange={(sortBy, sortOrder) =>
          updateSearch({ sortBy, sortOrder, page: 1 })
        }
        onSearchChange={(q) => updateSearch({ q, page: 1 })}
        filters={
          <ExpenseFilters
            category={searchParams.category}
            onCategoryChange={(category) =>
              updateSearch({
                category,
                page: 1,
              })
            }
          />
        }
        emptyIcon={<Users className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('empty.title', { defaultValue: 'No expenses found' })}
        emptyDescription={t('empty.description', {
          defaultValue: 'Get started by recording your first expense.',
        })}
      />

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        batches={batches}
        suppliers={suppliers}
        currencySymbol={currencySymbol}
        isSubmitting={isSubmitting}
        initialData={selectedExpense}
      />

      <ExpenseDetailsDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        expense={selectedExpense}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <DeleteExpenseDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        expense={selectedExpense}
        onConfirm={handleDeleteSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
