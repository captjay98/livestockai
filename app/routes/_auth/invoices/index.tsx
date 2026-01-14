import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Eye, FileText, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { InvoiceRecord, PaginatedResult } from '~/features/invoices/server'
import { getInvoicesPaginatedFn } from '~/features/invoices/server'
import { requireAuth } from '~/features/auth/server-middleware'
import { useFormatCurrency, useFormatDate } from '~/features/settings'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { DataTable } from '~/components/ui/data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { InvoiceDialog } from '~/components/dialogs/invoice-dialog'
import { useFarm } from '~/features/farms/context'

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  date: Date
  dueDate: Date | null
  totalAmount: number
  status: 'paid' | 'partial' | 'unpaid'
}

interface InvoiceSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
  status?: 'paid' | 'partial' | 'unpaid' | 'all'
}

const getInvoiceData = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      search?: string
      status?: 'paid' | 'partial' | 'unpaid'
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      await requireAuth()
      const paginatedInvoices = await getInvoicesPaginatedFn({
        data: {
          page: data.page,
          pageSize: data.pageSize,
          sortBy: data.sortBy,
          sortOrder: data.sortOrder,
          search: data.search,
          status: data.status,
        },
      })
      return { paginatedInvoices }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/_auth/invoices/')({
  component: InvoicesPage,
  validateSearch: (search: Record<string, unknown>): InvoiceSearchParams => ({
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    sortBy: (search.sortBy as string) || 'date',
    sortOrder:
      typeof search.sortOrder === 'string' &&
      (search.sortOrder === 'asc' || search.sortOrder === 'desc')
        ? search.sortOrder
        : 'desc',
    q: typeof search.q === 'string' ? search.q : '',
    status:
      typeof search.status === 'string'
        ? (search.status as 'paid' | 'partial' | 'unpaid' | 'all')
        : 'all',
  }),
})

function InvoicesPage() {
  const { selectedFarmId } = useFarm()
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()

  const [paginatedInvoices, setPaginatedInvoices] = useState<
    PaginatedResult<InvoiceRecord>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewInvoice, setViewInvoice] = useState<InvoiceRecord | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getInvoiceData({
        data: {
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.q,
          status:
            searchParams.status === 'all' ? undefined : searchParams.status,
        },
      })
      setPaginatedInvoices(
        result.paginatedInvoices as PaginatedResult<InvoiceRecord>,
      )
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [
    searchParams.page,
    searchParams.pageSize,
    searchParams.sortBy,
    searchParams.sortOrder,
    searchParams.q,
    searchParams.status,
  ])

  const updateSearch = (updates: Partial<InvoiceSearchParams>) => {
    navigate({
      search: (prev: InvoiceSearchParams) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const columns = useMemo<Array<ColumnDef<Invoice>>>(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice #',
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.invoiceNumber}
          </span>
        ),
      },
      {
        accessorKey: 'customerName',
        header: 'Customer',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.customerName}</span>
        ),
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ row }) =>
          row.original.dueDate ? formatDate(row.original.dueDate) : '-',
      },
      {
        accessorKey: 'totalAmount',
        header: 'Amount',
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === 'paid'
                ? 'default'
                : row.original.status === 'partial'
                  ? 'secondary'
                  : 'destructive'
            }
            className={
              row.original.status === 'paid'
                ? 'bg-success/15 text-success hover:bg-success/25'
                : row.original.status === 'partial'
                  ? 'bg-warning/15 text-warning hover:bg-warning/25'
                  : 'bg-destructive/15 text-destructive hover:bg-destructive/25'
            }
          >
            {row.original.status.charAt(0).toUpperCase() +
              row.original.status.slice(1)}
          </Badge>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewInvoice(row.original)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage customer invoices</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Select
          value={searchParams.status}
          onValueChange={(value) =>
            updateSearch({ status: value || undefined, page: 1 })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              {searchParams.status || 'Filter by status'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
        searchPlaceholder="Search invoices..."
        isLoading={isLoading}
        onPaginationChange={(page, pageSize) => {
          updateSearch({ page, pageSize })
        }}
        onSortChange={(sortBy, sortOrder) => {
          updateSearch({ sortBy, sortOrder, page: 1 })
        }}
        onSearchChange={(q) => {
          updateSearch({ q, page: 1 })
        }}
        emptyIcon={<FileText className="h-12 w-12 text-muted-foreground" />}
        emptyTitle="No invoices"
        emptyDescription="Create invoices to track payments."
      />

      {selectedFarmId && (
        <InvoiceDialog
          farmId={selectedFarmId}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}

      {/* View Invoice Dialog */}
      <Dialog
        open={!!viewInvoice}
        onOpenChange={(open) => !open && setViewInvoice(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice {viewInvoice?.invoiceNumber}</DialogTitle>
            <DialogDescription>{viewInvoice?.customerName}</DialogDescription>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(viewInvoice.date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {viewInvoice.dueDate
                      ? formatDate(viewInvoice.dueDate)
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">
                    {formatCurrency(viewInvoice.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      viewInvoice.status === 'paid'
                        ? 'default'
                        : viewInvoice.status === 'partial'
                          ? 'secondary'
                          : 'destructive'
                    }
                    className={
                      viewInvoice.status === 'paid'
                        ? 'bg-success/15 text-success'
                        : viewInvoice.status === 'partial'
                          ? 'bg-warning/15 text-warning'
                          : 'bg-destructive/15 text-destructive'
                    }
                  >
                    {viewInvoice.status.charAt(0).toUpperCase() +
                      viewInvoice.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewInvoice(null)}>
                  Close
                </Button>
                <Button asChild>
                  <Link to={`/invoices/${viewInvoice.id}`}>
                    View Full Details
                  </Link>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
