import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  CustomerRecord,
  CustomerSearchParams,
  PaginatedResult,
} from '~/features/customers/types'
import type { TopCustomer } from '~/components/customers/top-customers-card'
import { validateCustomerSearch } from '~/features/customers/validation'
import { useCustomerActions } from '~/features/customers/hooks'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { PageHeader } from '~/components/page-header'
import { TopCustomersCard } from '~/components/customers/top-customers-card'
import { CustomerFormDialog } from '~/components/customers/customer-form-dialog'
import { CustomerFilters } from '~/components/customers/customer-filters'
import { getCustomerColumns } from '~/components/customers/customer-columns'

export const Route = createFileRoute('/_auth/customers/')({
  component: CustomersPage,
  validateSearch: validateCustomerSearch,
})

function CustomersPage() {
  const { t } = useTranslation(['customers', 'common'])
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const [paginatedCustomers, setPaginatedCustomers] = useState<
    PaginatedResult<CustomerRecord>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [topCustomers, setTopCustomers] = useState<Array<TopCustomer>>([])
  const [isLoading, setIsLoading] = useState(true)

  const {
    dialogOpen,
    setDialogOpen,
    dialogMode,
    selectedCustomer,
    isSubmitting,
    handleCreateOpen,
    handleEditOpen,
    handleFormSubmit,
    loadData,
  } = useCustomerActions(setPaginatedCustomers, setTopCustomers, setIsLoading)

  useEffect(() => {
    loadData(searchParams)
  }, [
    searchParams.page,
    searchParams.pageSize,
    searchParams.sortBy,
    searchParams.sortOrder,
    searchParams.q,
    searchParams.customerType,
  ])

  const updateSearch = (updates: Partial<CustomerSearchParams>) => {
    navigate({
      search: (prev: CustomerSearchParams) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const columns = getCustomerColumns({ t, onEdit: handleEditOpen })

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('customers:title')}
        description={t('customers:description')}
        icon={Users}
        actions={
          <Button onClick={handleCreateOpen}>
            <Plus className="h-4 w-4 mr-2" />
            {t('customers:add')}
          </Button>
        }
      />

      {topCustomers.length > 0 &&
        searchParams.page === 1 &&
        !searchParams.q && <TopCustomersCard customers={topCustomers} />}

      <DataTable
        columns={columns}
        data={paginatedCustomers.data}
        total={paginatedCustomers.total}
        page={paginatedCustomers.page}
        pageSize={paginatedCustomers.pageSize}
        totalPages={paginatedCustomers.totalPages}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        searchValue={searchParams.q || ''}
        searchPlaceholder={t('customers:search')}
        isLoading={isLoading}
        filters={
          <CustomerFilters
            customerType={searchParams.customerType}
            onCustomerTypeChange={(customerType) =>
              updateSearch({ customerType, page: 1 })
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
        emptyIcon={<Users className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('customers:empty.title')}
        emptyDescription={t('customers:empty.desc')}
      />

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialData={
          selectedCustomer
            ? {
                name: selectedCustomer.name,
                phone: selectedCustomer.phone,
                email: selectedCustomer.email || '',
                location: selectedCustomer.location || '',
                customerType: (selectedCustomer.customerType as any) || '',
              }
            : null
        }
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
