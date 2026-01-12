import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Eye, FileText, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginatedResult } from '~/lib/invoices/server'
import { getInvoicesPaginatedFn } from '~/lib/invoices/server'
import { requireAuth } from '~/lib/auth/server-middleware'
import { formatNaira } from '~/lib/currency'
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
import { Input } from '~/components/ui/input'

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  date: string
  dueDate: string | null
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
        page: data.page,
        pageSize: data.pageSize,
        sortBy: data.sortBy,
        sortOrder: data.sortOrder,
        search: data.search,
        status: data.status,
      })
      return { paginatedInvoices }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/_auth/invoices')({
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
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const [paginatedInvoices, setPaginatedInvoices] = useState<
    PaginatedResult<any>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })

  const [isLoading, setIsLoading] = useState(true)

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
      setPaginatedInvoices(result.paginatedInvoices as PaginatedResult<any>)
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
      search: (prev) => ({
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
        cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ row }) =>
          row.original.dueDate
            ? new Date(row.original.dueDate).toLocaleDateString()
            : '-',
      },
      {
        accessorKey: 'totalAmount',
        header: 'Amount',
        cell: ({ row }) => (
          <span className="font-medium">
            {formatNaira(row.original.totalAmount)}
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
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/invoices/${row.original.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage customer invoices</p>
        </div>
        <Button asChild>
          <Link to="/invoices/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Select
          value={searchParams.status}
          onValueChange={(value) => updateSearch({ status: value, page: 1 })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
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
    </div>
  )
}
