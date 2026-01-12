import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  Bird,
  Edit,
  Egg,
  Eye,
  Fish,
  Plus,
  ShoppingCart,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginatedResult } from '~/lib/sales/server'
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  UNIT_TYPES,
  createSale,
  deleteSaleFn,
  getSalesPaginatedFn,
  getSalesSummaryFn,
  updateSaleFn,
} from '~/lib/sales/server'
import { getBatchesFn } from '~/lib/batches/server'
import { getCustomersFn } from '~/lib/customers/server'
import { requireAuth } from '~/lib/auth/server-middleware'
import { formatCurrency } from '~/lib/currency'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
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
  DialogTrigger,
} from '~/components/ui/dialog'
import { DataTable } from '~/components/ui/data-table'
import { useFarm } from '~/components/farm-context'

interface Sale {
  id: string
  farmId: string
  farmName: string | null
  customerId: string | null
  customerName: string | null
  livestockType: string
  quantity: number
  unitPrice: string
  totalAmount: string
  date: Date
  notes: string | null
  batchSpecies: string | null
  unitType: string | null
  ageWeeks: number | null
  averageWeightKg: string | null
  paymentStatus: string | null
  paymentMethod: string | null
}

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

interface Customer {
  id: string
  name: string
  phone: string
}

interface SalesSummary {
  poultry: { count: number; quantity: number; revenue: number }
  fish: { count: number; quantity: number; revenue: number }
  eggs: { count: number; quantity: number; revenue: number }
  total: { count: number; quantity: number; revenue: number }
}

// Search params type
interface SalesSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
  livestockType?: string
  paymentStatus?: string
}

const getSalesDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      farmId?: string | null
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      search?: string
      livestockType?: string
      paymentStatus?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      await requireAuth()
      const farmId = data.farmId || undefined

      const [paginatedSales, summary, batches, customers] = await Promise.all([
        getSalesPaginatedFn({
          data: {
            farmId,
            page: data.page || 1,
            pageSize: data.pageSize || 10,
            sortBy: data.sortBy || 'date',
            sortOrder: data.sortOrder || 'desc',
            search: data.search,
            livestockType: data.livestockType,
            paymentStatus: data.paymentStatus,
          }
        }),
        getSalesSummaryFn({ data: { farmId } }),
        farmId ? getBatchesFn({ data: { farmId } }) : Promise.resolve([]),
        getCustomersFn(),
      ])
      return {
        paginatedSales,
        summary,
        batches: batches.filter((b) => b.status === 'active'),
        customers,
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })

const createSaleAction = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      farmId: string
      batchId?: string
      customerId?: string
      livestockType: string
      quantity: number
      unitPrice: number
      date: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const session = await requireAuth()
    const id = await createSale(session.user.id, {
      farmId: data.farmId,
      batchId: data.batchId || null,
      customerId: data.customerId || null,
      livestockType: data.livestockType as any,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      date: new Date(data.date),
    })
    return { success: true, id }
  })

export const Route = createFileRoute('/_auth/sales')({
  validateSearch: (search: Record<string, unknown>): SalesSearchParams => ({
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    sortBy: typeof search.sortBy === 'string' ? search.sortBy : 'date',
    sortOrder:
      typeof search.sortOrder === 'string' &&
        (search.sortOrder === 'asc' || search.sortOrder === 'desc')
        ? search.sortOrder
        : 'desc',
    q: typeof search.q === 'string' ? search.q : '',
    livestockType:
      typeof search.livestockType === 'string'
        ? search.livestockType
        : undefined,
    paymentStatus:
      typeof search.paymentStatus === 'string'
        ? search.paymentStatus
        : undefined,
  }),
  component: SalesPage,
})

function SalesPage() {
  const { selectedFarmId } = useFarm()
  const navigate = useNavigate({ from: '/sales' })
  const searchParams = Route.useSearch()

  const [paginatedSales, setPaginatedSales] = useState<PaginatedResult<Sale>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [customers, setCustomers] = useState<Array<Customer>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    livestockType: 'poultry' as 'poultry' | 'fish' | 'eggs',
    batchId: '',
    customerId: '',
    quantity: '',
    unitPrice: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // View/Edit/Delete dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [editFormData, setEditFormData] = useState({
    quantity: '',
    unitPrice: '',
  })

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getSalesDataForFarm({
        data: {
          farmId: selectedFarmId,
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.q,
          livestockType: searchParams.livestockType,
          paymentStatus: searchParams.paymentStatus,
        },
      })
      setPaginatedSales(result.paginatedSales)
      setSummary(result.summary)
      setBatches(result.batches)
      setCustomers(result.customers)
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [
    selectedFarmId,
    searchParams.page,
    searchParams.pageSize,
    searchParams.sortBy,
    searchParams.sortOrder,
    searchParams.q,
    searchParams.livestockType,
    searchParams.paymentStatus,
  ])

  const updateSearch = (updates: Partial<SalesSearchParams>) => {
    navigate({
      search: (prev: SalesSearchParams) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const resetForm = () => {
    setFormData({
      livestockType: 'poultry',
      batchId: '',
      customerId: '',
      quantity: '',
      unitPrice: '',
      date: new Date().toISOString().split('T')[0],
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) return

    setIsSubmitting(true)
    setError('')

    try {
      await createSaleAction({
        data: {
          farmId: selectedFarmId,
          batchId: formData.batchId || undefined,
          customerId: formData.customerId || undefined,
          livestockType: formData.livestockType,
          quantity: parseInt(formData.quantity),
          unitPrice: parseFloat(formData.unitPrice),
          date: formData.date,
        },
      })
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale)
    setViewDialogOpen(true)
  }

  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale)
    setEditFormData({
      quantity: sale.quantity.toString(),
      unitPrice: sale.unitPrice,
    })
    setEditDialogOpen(true)
  }

  const handleDeleteSale = (sale: Sale) => {
    setSelectedSale(sale)
    setDeleteDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSale) return

    setIsSubmitting(true)
    try {
      await updateSaleFn({
        data: {
          saleId: selectedSale.id,
          data: {
            quantity: parseInt(editFormData.quantity),
            unitPrice: parseFloat(editFormData.unitPrice),
          },
        },
      })
      setEditDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedSale) return

    setIsSubmitting(true)
    try {
      await deleteSaleFn({ data: { saleId: selectedSale.id } })
      setDeleteDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'poultry':
        return <Bird className="h-4 w-4" />
      case 'fish':
        return <Fish className="h-4 w-4" />
      case 'eggs':
        return <Egg className="h-4 w-4" />
      default:
        return <ShoppingCart className="h-4 w-4" />
    }
  }

  const TYPE_COLORS: Record<string, string> = {
    poultry: 'text-primary bg-primary/10',
    fish: 'text-info bg-info/10',
    eggs: 'text-warning bg-warning/10',
  }

  const getPaymentStatusBadge = (status: string | null) => {
    const statusInfo =
      PAYMENT_STATUSES.find((s) => s.value === status) || PAYMENT_STATUSES[0]
    return (
      <Badge className={`${statusInfo.color} border-0`}>
        {statusInfo.label}
      </Badge>
    )
  }

  // Table columns
  const columns: Array<ColumnDef<Sale>> = [
    {
      accessorKey: 'livestockType',
      header: 'Type',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center ${TYPE_COLORS[row.original.livestockType] || 'bg-muted'}`}
          >
            {getTypeIcon(row.original.livestockType)}
          </div>
          <span className="capitalize font-medium">
            {row.original.livestockType}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.customerName || 'Walk-in'}
        </span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.quantity}</span>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Amount',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-success">
          {formatCurrency(row.original.totalAmount)}
        </span>
      ),
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Payment',
      enableSorting: true,
      cell: ({ row }) => getPaymentStatusBadge(row.original.paymentStatus),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant="outline">
          {new Date(row.original.date).toLocaleDateString()}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleViewSale(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleEditSale(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => handleDeleteSale(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground mt-1">
            Track your farm sales and revenue
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Sale
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Sale</DialogTitle>
              <DialogDescription>Log a new sale</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.livestockType}
                  onValueChange={(value: string | null) =>
                    value &&
                    setFormData((prev) => ({
                      ...prev,
                      livestockType: value as 'poultry' | 'fish' | 'eggs',
                      batchId: '',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poultry">
                      <span className="flex items-center gap-2">
                        <Bird className="h-4 w-4" />
                        Poultry
                      </span>
                    </SelectItem>
                    <SelectItem value="fish">
                      <span className="flex items-center gap-2">
                        <Fish className="h-4 w-4" />
                        Fish
                      </span>
                    </SelectItem>
                    <SelectItem value="eggs">
                      <span className="flex items-center gap-2">
                        <Egg className="h-4 w-4" />
                        Eggs
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {batches.length > 0 && formData.livestockType !== 'eggs' && (
                <div className="space-y-2">
                  <Label>Batch (Optional)</Label>
                  <Select
                    value={formData.batchId || undefined}
                    onValueChange={(value: string | null) =>
                      setFormData((prev) => ({
                        ...prev,
                        batchId: value || '',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {formData.batchId
                          ? batches.find((b) => b.id === formData.batchId)
                            ?.species
                          : 'Select batch'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {batches
                        .filter(
                          (b) => b.livestockType === formData.livestockType,
                        )
                        .map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.species} ({batch.currentQuantity} available)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {customers.length > 0 && (
                <div className="space-y-2">
                  <Label>Customer (Optional)</Label>
                  <Select
                    value={formData.customerId || undefined}
                    onValueChange={(value: string | null) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerId: value || '',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {formData.customerId
                          ? customers.find((c) => c.id === formData.customerId)
                            ?.name
                          : 'Walk-in customer'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Price (₦)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        unitPrice: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              {formData.quantity && formData.unitPrice && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total:
                    </span>
                    <span className="text-lg font-bold text-success">
                      {formatCurrency(
                        parseInt(formData.quantity || '0') *
                        parseFloat(formData.unitPrice || '0'),
                      )}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !formData.quantity || !formData.unitPrice
                  }
                >
                  {isSubmitting ? 'Recording...' : 'Record Sale'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-success">
                {formatCurrency(summary.total.revenue)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {summary.total.count} sales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Poultry
              </CardTitle>
              <Bird className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatCurrency(summary.poultry.revenue)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {summary.poultry.quantity.toLocaleString()} sold
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Fish
              </CardTitle>
              <Fish className="h-3 w-3 sm:h-4 sm:w-4 text-info" />
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatCurrency(summary.fish.revenue)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {summary.fish.quantity.toLocaleString()} sold
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Eggs
              </CardTitle>
              <Egg className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatCurrency(summary.eggs.revenue)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {summary.eggs.quantity.toLocaleString()} crates
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Data Table */}
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
        searchPlaceholder="Search sales..."
        isLoading={isLoading}
        filters={
          <div className="flex gap-2">
            <Select
              value={searchParams.livestockType || 'all'}
              onValueChange={(value: string) => {
                updateSearch({
                  livestockType: value === 'all' ? undefined : value,
                  page: 1,
                })
              }}
            >
              <SelectTrigger className="w-[140px] h-10">
                <SelectValue>
                  {searchParams.livestockType === 'all' || !searchParams.livestockType
                    ? 'All Types'
                    : searchParams.livestockType === 'poultry'
                      ? 'Poultry'
                      : searchParams.livestockType === 'fish'
                        ? 'Fish'
                        : 'Eggs'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="poultry">
                  <div className="flex items-center gap-2">
                    <Bird className="h-4 w-4" />
                    Poultry
                  </div>
                </SelectItem>
                <SelectItem value="fish">
                  <div className="flex items-center gap-2">
                    <Fish className="h-4 w-4" />
                    Fish
                  </div>
                </SelectItem>
                <SelectItem value="eggs">
                  <div className="flex items-center gap-2">
                    <Egg className="h-4 w-4" />
                    Eggs
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={searchParams.paymentStatus || 'all'}
              onValueChange={(value: string) => {
                updateSearch({
                  paymentStatus: value === 'all' ? undefined : value,
                  page: 1,
                })
              }}
            >
              <SelectTrigger className="w-[140px] h-10">
                <SelectValue>
                  {searchParams.paymentStatus === 'all' || !searchParams.paymentStatus
                    ? 'All Payments'
                    : PAYMENT_STATUSES.find((s) => s.value === searchParams.paymentStatus)?.label || 'All Payments'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${status.color.split(' ')[1]}`}
                      />
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        emptyIcon={<ShoppingCart className="h-12 w-12" />}
        emptyTitle="No sales yet"
        emptyDescription="Record your first sale to get started."
        onPaginationChange={(page, pageSize) => {
          updateSearch({ page, pageSize })
        }}
        onSortChange={(sortBy, sortOrder) => {
          updateSearch({ sortBy, sortOrder, page: 1 })
        }}
        onSearchChange={(q) => {
          updateSearch({ q, page: 1 })
        }}
      />

      {/* View Sale Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${TYPE_COLORS[selectedSale.livestockType] || 'bg-gray-100'}`}
                >
                  {getTypeIcon(selectedSale.livestockType)}
                </div>
                <div>
                  <p className="font-semibold text-lg capitalize">
                    {selectedSale.livestockType} Sale
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSale.batchSpecies || 'No batch'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-lg text-green-600">
                    {formatCurrency(selectedSale.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Status:</span>
                  {getPaymentStatusBadge(selectedSale.paymentStatus)}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">
                    {selectedSale.customerName || 'Walk-in'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span>
                    {selectedSale.quantity}{' '}
                    {selectedSale.unitType
                      ? UNIT_TYPES.find(
                        (u) => u.value === selectedSale.unitType,
                      )?.label || selectedSale.unitType
                      : 'units'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unit Price:</span>
                  <span>{formatCurrency(selectedSale.unitPrice)}</span>
                </div>
                {selectedSale.paymentMethod && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Payment Method:
                    </span>
                    <span>
                      {PAYMENT_METHODS.find(
                        (m) => m.value === selectedSale.paymentMethod,
                      )?.label || selectedSale.paymentMethod}
                    </span>
                  </div>
                )}
                {selectedSale.ageWeeks && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Age at Sale:</span>
                    <span>{selectedSale.ageWeeks} weeks</span>
                  </div>
                )}
                {selectedSale.averageWeightKg && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Weight:</span>
                    <span>{selectedSale.averageWeightKg} kg</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span>
                    {new Date(selectedSale.date).toLocaleDateString()}
                  </span>
                </div>
                {selectedSale.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      Notes:
                    </span>
                    <p className="text-sm mt-1">{selectedSale.notes}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewDialogOpen(false)
                    handleEditSale(selectedSale)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setViewDialogOpen(false)
                    handleDeleteSale(selectedSale)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Sale Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
            <DialogDescription>Update sale details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={editFormData.quantity}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Unit Price (₦)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editFormData.unitPrice}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      unitPrice: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            {editFormData.quantity && editFormData.unitPrice && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    New Total:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(
                      parseInt(editFormData.quantity || '0') *
                      parseFloat(editFormData.unitPrice || '0'),
                    )}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sale? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${TYPE_COLORS[selectedSale.livestockType] || 'bg-gray-100'}`}
                >
                  {getTypeIcon(selectedSale.livestockType)}
                </div>
                <div>
                  <p className="font-medium capitalize">
                    {selectedSale.livestockType} Sale
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(selectedSale.totalAmount)} -{' '}
                    {selectedSale.quantity} units
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
