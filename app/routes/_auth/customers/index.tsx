import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CustomerSearchParams } from '~/features/customers/types'
import { validateCustomerSearch } from '~/features/customers/validation'
import {
  getCustomersPaginatedFn,
  getTopCustomersFn,
} from '~/features/customers/server'
import { useCustomerActions } from '~/features/customers/hooks'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { PageHeader } from '~/components/page-header'
import { TopCustomersCard } from '~/components/customers/top-customers-card'
import { CustomerFormDialog } from '~/components/customers/customer-form-dialog'
import { CustomerFilters } from '~/components/customers/customer-filters'
import { getCustomerColumns } from '~/components/customers/customer-columns'
import { CustomersSkeleton } from '~/components/customers/customers-skeleton'

export const Route = createFileRoute('/_auth/customers/')({
  validateSearch: validateCustomerSearch,
  loaderDeps: ({ search }) => ({
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    search: search.q,
    customerType: search.customerType,
  }),
  loader: async ({ deps }) => {
    const [paginatedCustomers, topCustomers] = await Promise.all([
      getCustomersPaginatedFn({ data: deps }),
      getTopCustomersFn({ data: { limit: 5 } }),
    ])
    return { paginatedCustomers, topCustomers }
  },
  pendingComponent: CustomersSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">
      Error loading customers: {error.message}
    </div>
  ),
  component: CustomersPage,
})

function CustomersPage() {
  const { t } = useTranslation(['customers', 'common'])
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  // Get data from loader
  const { paginatedCustomers, topCustomers } = Route.useLoaderData()

  const {
    dialogOpen,
    setDialogOpen,
    dialogMode,
    selectedCustomer,
    isSubmitting,
    handleCreateOpen,
    handleEditOpen,
    handleFormSubmit,
  } = useCustomerActions()

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
