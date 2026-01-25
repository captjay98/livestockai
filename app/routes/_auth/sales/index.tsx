import { createFileRoute } from '@tanstack/react-router'
import { Plus, Receipt, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMemo, useState } from 'react'
import type { Sale } from '~/components/sales/sale-columns'
import { getSaleColumns } from '~/components/sales/sale-columns'
import { validateSalesSearch } from '~/features/sales/types'
import { getSalesPageDataFn } from '~/features/sales/server'
import { useSalesPage } from '~/features/sales/use-sales-page'
import {
  useFormatCurrency,
  useFormatDate,
  useFormatWeight,
} from '~/features/settings'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { useFarm } from '~/features/farms/context'
import { PageHeader } from '~/components/page-header'
import {
  SaleDetailsDialog,
  SaleFormDialog,
  SalesSummary,
} from '~/components/sales'
import { SaleFilters } from '~/components/sales/sale-filters'
import { DeleteSaleDialog } from '~/components/sales/delete-dialog'
import { SalesSkeleton } from '~/components/sales/sales-skeleton'

export const Route = createFileRoute('/_auth/sales/')({
  validateSearch: validateSalesSearch,
  loaderDeps: ({ search }) => ({
    farmId: search.farmId,
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    search: search.q,
    livestockType: search.livestockType as
      | 'poultry'
      | 'fish'
      | 'eggs'
      | undefined,
    paymentStatus: search.paymentStatus as
      | 'paid'
      | 'pending'
      | 'partial'
      | undefined,
  }),
  loader: async ({ deps }) => {
    return getSalesPageDataFn({ data: deps })
  },
  pendingComponent: SalesSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">Error loading sales: {error.message}</div>
  ),
  component: SalesPage,
})

function SalesPage() {
  const { t } = useTranslation(['sales', 'common'])
  const { selectedFarmId } = useFarm()
  const { format: formatCurrency, symbol: currencySymbol } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()
  const { format: formatWeight } = useFormatWeight()
  const searchParams = Route.useSearch()

  // Get data from loader
  const { paginatedSales, summary, batches, customers } = Route.useLoaderData()

  const {
    selectedSale,
    setSelectedSale,
    isSubmitting,
    updateSearch,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  } = useSalesPage({
    selectedFarmId,
    routePath: Route.fullPath,
  })

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleView = (sale: Sale) => {
    setSelectedSale(sale)
    setViewOpen(true)
  }

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale)
    setFormOpen(true)
  }

  const handleDelete = (sale: Sale) => {
    setSelectedSale(sale)
    setDeleteOpen(true)
  }

  const handleFormSubmit = async (data: any) => {
    if (selectedSale) {
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
      getSaleColumns({
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
              setSelectedSale(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('record')}
          </Button>
        }
      />

      <SalesSummary summary={summary} formatCurrency={formatCurrency} />

      <DataTable
        columns={columns}
        data={paginatedSales.data}
        total={paginatedSales.total}
        page={paginatedSales.page}
        pageSize={paginatedSales.pageSize}
        totalPages={paginatedSales.totalPages}
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
          <SaleFilters
            livestockType={searchParams.livestockType}
            paymentStatus={searchParams.paymentStatus}
            onLivestockTypeChange={(v) =>
              updateSearch({ livestockType: v, page: 1 })
            }
            onPaymentStatusChange={(v) =>
              updateSearch({ paymentStatus: v, page: 1 })
            }
          />
        }
        emptyIcon={<Users className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('empty.title', { defaultValue: 'No sales found' })}
        emptyDescription={t('empty.description', {
          defaultValue: 'Get started by recording your first sale.',
        })}
      />

      <SaleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        batches={batches}
        customers={customers}
        currencySymbol={currencySymbol}
        formatCurrency={formatCurrency}
        isSubmitting={isSubmitting}
        initialData={selectedSale}
      />

      <SaleDetailsDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        sale={selectedSale}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        formatWeight={formatWeight}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <DeleteSaleDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteSubmit}
        isSubmitting={isSubmitting}
        sale={selectedSale}
        formatCurrency={formatCurrency}
      />
    </div>
  )
}
