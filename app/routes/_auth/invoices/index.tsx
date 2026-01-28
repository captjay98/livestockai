import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FileText, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { InvoiceRecord } from '~/features/invoices/types'
import { validateInvoiceSearch } from '~/features/invoices/validation'
import { getInvoicesPaginatedFn } from '~/features/invoices/server'
import { useFormatCurrency, useFormatDate } from '~/features/settings'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/ui/data-table'
import { InvoiceDialog } from '~/components/dialogs/invoice-dialog'
import { InvoiceFilters } from '~/components/invoices/invoice-filters'
import { InvoiceViewDialog } from '~/components/invoices/invoice-view-dialog'
import { getInvoiceColumns } from '~/components/invoices/invoice-columns'
import { useFarm } from '~/features/farms/context'
import { PageHeader } from '~/components/page-header'
import { InvoicesSkeleton } from '~/components/invoices/invoices-skeleton'

export const Route = createFileRoute('/_auth/invoices/')({
    validateSearch: validateInvoiceSearch,
    loaderDeps: ({ search }) => ({
        page: search.page,
        pageSize: search.pageSize,
        sortBy: search.sortBy,
        sortOrder: search.sortOrder,
        q: search.q,
        status: search.status === 'all' ? undefined : search.status,
    }),
    loader: async ({ deps }) => {
        return getInvoicesPaginatedFn({ data: deps })
    },
    pendingComponent: InvoicesSkeleton,
    errorComponent: ({ error }) => (
        <div className="p-4 text-red-600">
            Error loading invoices: {error.message}
        </div>
    ),
    component: InvoicesPage,
})

function InvoicesPage() {
    const { t } = useTranslation(['invoices', 'common'])
    const { selectedFarmId } = useFarm()
    const { format: formatCurrency } = useFormatCurrency()
    const { format: formatDate } = useFormatDate()
    const searchParams = Route.useSearch()
    const navigate = useNavigate({ from: Route.fullPath })

    // Get data from loader
    const paginatedInvoices = Route.useLoaderData()

    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [viewInvoice, setViewInvoice] = useState<InvoiceRecord | null>(null)

    // Navigation helper for search params
    const updateSearch = (updates: Partial<typeof searchParams>) => {
        navigate({
            search: { ...searchParams, ...updates },
        })
    }

    const columns = useMemo(
        () =>
            getInvoiceColumns({
                t,
                formatCurrency,
                formatDate,
                onView: setViewInvoice,
            }),
        [t, formatCurrency, formatDate],
    )

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('title')}
                description={t('description')}
                icon={FileText}
                actions={
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('create')}
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={paginatedInvoices.data}
                total={paginatedInvoices.total}
                page={paginatedInvoices.page}
                pageSize={paginatedInvoices.pageSize}
                totalPages={paginatedInvoices.totalPages}
                sortBy={searchParams.sortBy}
                sortOrder={searchParams.sortOrder}
                searchValue={searchParams.q}
                searchPlaceholder={t('placeholders.search')}
                filters={
                    <InvoiceFilters
                        status={
                            searchParams.status === 'all'
                                ? undefined
                                : searchParams.status
                        }
                        onStatusChange={(status) =>
                            updateSearch({ status: status || 'all', page: 1 })
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
                    <FileText className="h-12 w-12 text-muted-foreground" />
                }
                emptyTitle={t('placeholders.empty')}
                emptyDescription={t('placeholders.emptyDesc')}
            />

            {selectedFarmId && (
                <InvoiceDialog
                    farmId={selectedFarmId}
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                />
            )}

            <InvoiceViewDialog
                invoice={viewInvoice}
                open={!!viewInvoice}
                onOpenChange={(open) => !open && setViewInvoice(null)}
            />
        </div>
    )
}
