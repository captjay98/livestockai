import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import type {
  CustomerRecord,
  CustomerSearchParams,
} from '~/features/customers/types'
import { validateCustomerSearch } from '~/features/customers/validation'
import {
  getCustomersPaginatedFn,
  getTopCustomersFn,
} from '~/features/customers/server'
import { useCustomerMutations } from '~/features/customers/mutations'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { PageHeader } from '~/components/page-header'
import { TopCustomersCard } from '~/components/customers/top-customers-card'
import { CustomerFormDialog } from '~/components/customers/customer-form-dialog'
import { CustomerFilters } from '~/components/customers/customer-filters'
import { getCustomerColumns } from '~/components/customers/customer-columns'
import { CustomersSkeleton } from '~/components/customers/customers-skeleton'
import { ErrorPage } from '~/components/error-page'

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
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: CustomersPage,
})

function CustomersPage() {
  const { t } = useTranslation(['customers', 'common'])
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  // Get data from loader
  const { paginatedCustomers, topCustomers } = Route.useLoaderData()

  // Local dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRecord | null>(null)

  // Use mutations
  const { createCustomer, updateCustomer, isPending } = useCustomerMutations()

  const handleCreateOpen = () => {
    setDialogMode('create')
    setSelectedCustomer(null)
    setDialogOpen(true)
  }

  const handleEditOpen = (customer: CustomerRecord) => {
    setDialogMode('edit')
    setSelectedCustomer(customer)
    setDialogOpen(true)
  }

  const handleFormSubmit = async (data: any) => {
    try {
      if (dialogMode === 'create') {
        await createCustomer.mutateAsync({
          customer: {
            farmId: '', // This will be set by the mutation based on farm context
            ...data,
            email: data.email || null,
            location: data.location || null,
            customerType: data.customerType || null,
          },
        })
      } else if (selectedCustomer) {
        await updateCustomer.mutateAsync({
          customerId: selectedCustomer.id,
          data: {
            name: data.name,
            phone: data.phone,
            email: data.email || null,
            location: data.location || null,
            customerType: data.customerType || null,
          },
        })
      }
      setDialogOpen(false)
    } catch (error) {
      // Error handling is done in the mutations
    }
  }

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
        sortBy={searchParams.sortBy as string | undefined}
        sortOrder={searchParams.sortOrder as 'asc' | 'desc' | undefined}
        searchValue={(searchParams.q as string) || ''}
        searchPlaceholder={t('customers:search')}
        containerClassName="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        filters={
          <CustomerFilters
            customerType={searchParams.customerType as string | undefined}
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
        emptyIcon={
          <div className="p-4 rounded-full bg-white/40 dark:bg-white/10 w-fit mx-auto mb-6 shadow-inner border border-white/20">
            <Users className="h-10 w-10 text-primary/40" />
          </div>
        }
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
        isSubmitting={isPending}
      />
    </div>
  )
}
