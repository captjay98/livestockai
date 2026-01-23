import { createFileRoute } from '@tanstack/react-router'
import { Building2, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { validateSupplierSearch } from '~/features/suppliers/server'
import { useSupplierPage } from '~/features/suppliers/use-supplier-page'
import { useFormatCurrency } from '~/features/settings'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { PageHeader } from '~/components/page-header'
import { SupplierDialog } from '~/components/suppliers/supplier-dialog'
import { SupplierFilters } from '~/components/suppliers/supplier-filters'
import { getSupplierColumns } from '~/components/suppliers/supplier-columns'

export const Route = createFileRoute('/_auth/suppliers/')({
  component: SuppliersPage,
  validateSearch: validateSupplierSearch,
})

function SuppliersPage() {
  const { t } = useTranslation(['suppliers', 'common'])
  const searchParams = Route.useSearch()
  const { format: formatCurrency } = useFormatCurrency()

  const { paginatedSuppliers, isLoading, loadData, updateSearch } =
    useSupplierPage({
      searchParams,
      routePath: Route.fullPath,
    })

  const [dialogOpen, setDialogOpen] = useState(false)

  const columns = useMemo(
    () =>
      getSupplierColumns({
        t,
        formatCurrency,
      }),
    [t, formatCurrency],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('suppliers:title')}
        description={t('suppliers:description')}
        icon={Building2}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('suppliers:add')}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={paginatedSuppliers.data}
        total={paginatedSuppliers.total}
        page={paginatedSuppliers.page}
        pageSize={paginatedSuppliers.pageSize}
        totalPages={paginatedSuppliers.totalPages}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        searchValue={searchParams.q}
        searchPlaceholder={t('suppliers:search')}
        isLoading={isLoading}
        filters={
          <SupplierFilters
            supplierType={searchParams.supplierType}
            onSupplierTypeChange={(supplierType) =>
              updateSearch({
                supplierType,
                page: 1,
              })
            }
          />
        }
        onPaginationChange={(page, pageSize) => {
          updateSearch({ page, pageSize })
        }}
        onSortChange={(sortBy, sortOrder) => {
          updateSearch({ sortBy, sortOrder, page: 1 })
        }}
        onSearchChange={(q) => {
          updateSearch({ q, page: 1 })
        }}
        emptyIcon={<Building2 className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('suppliers:empty.title')}
        emptyDescription={t('suppliers:empty.desc')}
      />

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadData}
      />
    </div>
  )
}
