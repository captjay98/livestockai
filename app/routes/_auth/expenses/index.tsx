import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Plus, Receipt, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Expense } from '~/components/expenses/expense-columns'
import { getExpenseColumns } from '~/components/expenses/expense-columns'
import { validateExpenseSearch } from '~/features/expenses/validation'
import {
    createExpenseFn,
    deleteExpenseFn,
    getExpensesPaginatedFn,
    updateExpenseFn,
} from '~/features/expenses/server'
import { getBatchesFn } from '~/features/batches/server'
import { getSuppliersFn } from '~/features/suppliers/server'
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
import { ExpensesSkeleton } from '~/components/expenses/expenses-skeleton'

export const Route = createFileRoute('/_auth/expenses/')({
    validateSearch: validateExpenseSearch,
    loaderDeps: ({ search }) => ({
        farmId: search.farmId,
        page: search.page,
        pageSize: search.pageSize,
        sortBy: search.sortBy,
        sortOrder: search.sortOrder,
        search: search.q,
        category: search.category,
    }),
    loader: async ({ deps }) => {
        const { getExpensesSummaryFn } =
            await import('~/features/expenses/server')

        const [paginatedExpenses, summary, batches, suppliers] =
            await Promise.all([
                getExpensesPaginatedFn({ data: deps }),
                getExpensesSummaryFn({ data: { farmId: deps.farmId } }),
                deps.farmId
                    ? getBatchesFn({ data: { farmId: deps.farmId } })
                    : Promise.resolve([]),
                getSuppliersFn({ data: { farmId: undefined } }),
            ])

        return {
            paginatedExpenses,
            summary,
            batches: batches.filter((b) => b.status === 'active'),
            suppliers,
        }
    },
    pendingComponent: ExpensesSkeleton,
    errorComponent: ({ error }) => (
        <div className="p-4 text-red-600">
            Error loading expenses: {error.message}
        </div>
    ),
    component: ExpensesPage,
})

function ExpensesPage() {
    const router = useRouter()
    const { t } = useTranslation(['expenses', 'common'])
    const { selectedFarmId } = useFarm()
    const { format: formatCurrency, symbol: currencySymbol } =
        useFormatCurrency()
    const { format: formatDate } = useFormatDate()
    const searchParams = Route.useSearch()
    const navigate = useNavigate({ from: Route.fullPath })

    // Get data from loader
    const { paginatedExpenses, summary, batches, suppliers } =
        Route.useLoaderData()

    // Dialog states
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [viewOpen, setViewOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Navigation helper for search params
    const updateSearch = (updates: Partial<typeof searchParams>) => {
        navigate({
            search: { ...searchParams, ...updates },
        })
    }

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
            setFormOpen(false)
            await router.invalidate()
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
                        category: data.category,
                        amount: data.amount,
                        description: data.description,
                    },
                },
            })
            toast.success(t('messages.updated'))
            setFormOpen(false)
            setSelectedExpense(null)
            await router.invalidate()
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
            setDeleteOpen(false)
            setSelectedExpense(null)
            await router.invalidate()
        } finally {
            setIsSubmitting(false)
        }
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

            <ExpensesSummary
                summary={summary}
                formatCurrency={formatCurrency}
            />

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
                emptyIcon={
                    <Users className="h-12 w-12 text-muted-foreground" />
                }
                emptyTitle={t('empty.title', {
                    defaultValue: 'No expenses found',
                })}
                emptyDescription={t('empty.description', {
                    defaultValue:
                        'Get started by recording your first expense.',
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
