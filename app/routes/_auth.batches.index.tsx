import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  AlertTriangle,
  Bird,
  Edit,
  Eye,
  Fish,
  Plus,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type {PaginatedResult} from '~/lib/batches/server';
import {
  
  createBatch,
  deleteBatchFn,
  getBatchesPaginated,
  getInventorySummary,
  updateBatchFn
} from '~/lib/batches/server'
import { getSpeciesOptions } from '~/lib/batches/constants'
import { requireAuth } from '~/lib/auth/server-middleware'
import { formatNaira } from '~/lib/currency'
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

interface Batch {
  id: string
  farmId: string
  livestockType: 'poultry' | 'fish'
  species: string
  initialQuantity: number
  currentQuantity: number
  acquisitionDate: Date
  costPerUnit: string
  totalCost: string
  status: 'active' | 'depleted' | 'sold'
  createdAt: Date
  updatedAt: Date
}

interface InventorySummary {
  poultry: { batches: number; quantity: number; investment: number }
  fish: { batches: number; quantity: number; investment: number }
  overall: {
    totalBatches: number
    activeBatches: number
    depletedBatches: number
    totalQuantity: number
    totalInvestment: number
  }
}

// Search params type
interface BatchSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
  status?: 'active' | 'depleted' | 'sold'
  livestockType?: 'poultry' | 'fish'
}

const getBatchesForFarmFn = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      farmId?: string | null
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      search?: string
      status?: 'active' | 'depleted' | 'sold'
      livestockType?: 'poultry' | 'fish'
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const farmId = data.farmId || undefined

      const [paginatedBatches, summary] = await Promise.all([
        getBatchesPaginated(session.user.id, {
          farmId,
          page: data.page,
          pageSize: data.pageSize,
          sortBy: data.sortBy,
          sortOrder: data.sortOrder,
          search: data.search,
          status: data.status,
          livestockType: data.livestockType,
        }),
        getInventorySummary(session.user.id, farmId),
      ])

      return { paginatedBatches, summary }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })

const createBatchAction = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      farmId: string
      livestockType: 'poultry' | 'fish'
      species: string
      initialQuantity: number
      acquisitionDate: string
      costPerUnit: number
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const batchId = await createBatch(session.user.id, {
        farmId: data.farmId,
        livestockType: data.livestockType,
        species: data.species,
        initialQuantity: data.initialQuantity,
        acquisitionDate: new Date(data.acquisitionDate),
        costPerUnit: data.costPerUnit,
      })
      return { success: true, batchId }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })

export const Route = createFileRoute('/_auth/batches/')({
  component: BatchesPage,
  validateSearch: (search: Record<string, unknown>): BatchSearchParams => {
    const validStatuses = ['active', 'depleted', 'sold'] as const
    const validLivestockTypes = ['poultry', 'fish'] as const
    
    return {
      page: Number(search.page) || 1,
      pageSize: Number(search.pageSize) || 10,
      sortBy: (search.sortBy as string) || 'createdAt',
      sortOrder: typeof search.sortOrder === 'string' && (search.sortOrder === 'asc' || search.sortOrder === 'desc') ? search.sortOrder : 'desc',
      q: typeof search.q === 'string' ? search.q : '',
      status:
        typeof search.status === 'string' && (validStatuses as ReadonlyArray<string>).includes(search.status)
          ? (search.status as 'active' | 'depleted' | 'sold')
          : undefined,
      livestockType:
        typeof search.livestockType === 'string' && (validLivestockTypes as ReadonlyArray<string>).includes(search.livestockType)
          ? (search.livestockType as 'poultry' | 'fish')
          : undefined,
    }
  },
})

function BatchesPage() {
  const { selectedFarmId } = useFarm()
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const [paginatedBatches, setPaginatedBatches] = useState<PaginatedResult<Batch>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)

  const [formData, setFormData] = useState({
    livestockType: 'poultry' as 'poultry' | 'fish',
    species: '',
    initialQuantity: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    costPerUnit: '',
  })

  const [editFormData, setEditFormData] = useState({
    currentQuantity: '',
    status: 'active' as 'active' | 'depleted' | 'sold',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const speciesOptions = getSpeciesOptions(formData.livestockType)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getBatchesForFarmFn({
        data: {
          farmId: selectedFarmId,
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.q,
          status: searchParams.status,
          livestockType: searchParams.livestockType,
        },
      })
      setPaginatedBatches(result.paginatedBatches as PaginatedResult<Batch>)
      setSummary(result.summary)
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
    searchParams.status,
    searchParams.livestockType,
  ])

  const updateSearch = (updates: Partial<BatchSearchParams>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const resetForm = () => {
    setFormData({
      livestockType: 'poultry',
      species: '',
      initialQuantity: '',
      acquisitionDate: new Date().toISOString().split('T')[0],
      costPerUnit: '',
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) return

    setIsSubmitting(true)
    setError('')

    try {
      await createBatchAction({
        data: {
          farmId: selectedFarmId,
          livestockType: formData.livestockType,
          species: formData.species,
          initialQuantity: parseInt(formData.initialQuantity),
          acquisitionDate: formData.acquisitionDate,
          costPerUnit: parseFloat(formData.costPerUnit),
        },
      })
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLivestockTypeChange = (type: string | null) => {
    if (type && (type === 'poultry' || type === 'fish')) {
      setFormData((prev) => ({ ...prev, livestockType: type, species: '' }))
    }
  }



  const handleEditBatch = (batch: Batch) => {
    setSelectedBatch(batch)
    setEditFormData({
      currentQuantity: batch.currentQuantity.toString(),
      status: batch.status,
    })
    setEditDialogOpen(true)
  }

  const handleDeleteBatch = (batch: Batch) => {
    setSelectedBatch(batch)
    setDeleteDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatch) return

    setIsSubmitting(true)
    setError('')
    try {
      await updateBatchFn({
        data: {
          batchId: selectedBatch.id,
          batch: {
            status: editFormData.status,
          },
        },
      })
      setEditDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update batch')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedBatch) return

    setIsSubmitting(true)
    setError('')
    try {
      await deleteBatchFn({
        data: { batchId: selectedBatch.id },
      })
      setDeleteDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete batch')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Array<ColumnDef<Batch>>>(
    () => [
      {
        accessorKey: 'species',
        header: 'Species',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.livestockType === 'poultry' ? (
              <Bird className="h-4 w-4 text-orange-600" />
            ) : (
              <Fish className="h-4 w-4 text-blue-600" />
            )}
            <span className="capitalize font-medium">{row.getValue('species')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          const isLowStock = row.original.currentQuantity <= row.original.initialQuantity * 0.1 && status === 'active'

          return (
            <div className="flex flex-col gap-1">
              <Badge
                variant={
                  status === 'active'
                    ? 'default'
                    : status === 'depleted'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {status}
              </Badge>
              {isLowStock && (
                <Badge variant="warning" className="text-[10px] px-1 py-0 h-4">
                  Low Stock
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'currentQuantity',
        header: 'Current Qty',
        cell: ({ row }) => row.original.currentQuantity.toLocaleString(),
      },
      {
        accessorKey: 'initialQuantity',
        header: 'Initial Qty',
        cell: ({ row }) => row.original.initialQuantity.toLocaleString(),
      },
      {
        accessorKey: 'acquisitionDate',
        header: 'Acquisition Date',
        cell: ({ row }) => new Date(row.original.acquisitionDate).toLocaleDateString(),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              title="View Details"
            >
              <Link to={`/batches/${row.original.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditBatch(row.original)}
              title="Edit Batch"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDeleteBatch(row.original)}
              title="Delete Batch"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Livestock Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage your livestock batches and inventory
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Batch
        </Button>
      </div>

      {summary && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Livestock
              </CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {summary.overall.totalQuantity.toLocaleString()}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.overall.activeBatches} active batches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Poultry
              </CardTitle>
              <Bird className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {summary.poultry.quantity.toLocaleString()}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.poultry.batches} batches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Fish
              </CardTitle>
              <Fish className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {summary.fish.quantity.toLocaleString()}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.fish.batches} batches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Investment
              </CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatNaira(summary.overall.totalInvestment)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.overall.depletedBatches} depleted batches
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable
        columns={columns}
        data={paginatedBatches.data}
        total={paginatedBatches.total}
        page={paginatedBatches.page}
        pageSize={paginatedBatches.pageSize}
        totalPages={paginatedBatches.totalPages}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        searchValue={searchParams.q}
        searchPlaceholder="Search batches..."
        isLoading={isLoading}
        filters={
          <>
            <Select
              value={searchParams.status || 'all'}
              onValueChange={(value) => {
                updateSearch({ status: value === 'all' ? undefined : value, page: 1 })
              }}
            >
              <SelectTrigger className="w-[150px] h-10">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="depleted">Depleted</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={searchParams.livestockType || 'all'}
              onValueChange={(value) => {
                updateSearch({ livestockType: value === 'all' ? undefined : value, page: 1 })
              }}
            >
              <SelectTrigger className="w-[150px] h-10">
                <SelectValue placeholder="All Types" />
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
              </SelectContent>
            </Select>
          </>
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
        emptyTitle="No batches found"
        emptyDescription="Get started by creating your first livestock batch."
      />

      {/* Create Batch Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
            <DialogDescription>
              Add a new livestock batch to your inventory
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="livestockType">Livestock Type</Label>
              <Select
                value={formData.livestockType}
                onValueChange={handleLivestockTypeChange}
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.livestockType.charAt(0).toUpperCase() +
                      formData.livestockType.slice(1)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poultry">Poultry</SelectItem>
                  <SelectItem value="fish">Fish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="species">Species</Label>
              <Select
                value={formData.species}
                onValueChange={(value) =>
                  value &&
                  setFormData((prev) => ({ ...prev, species: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.species || 'Select species'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {speciesOptions.map((species) => (
                    <SelectItem key={species} value={species}>
                      {species}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialQuantity">Initial Quantity</Label>
              <Input
                id="initialQuantity"
                type="number"
                min="1"
                value={formData.initialQuantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    initialQuantity: e.target.value,
                  }))
                }
                placeholder="Enter initial quantity"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerUnit">Cost per Unit (₦)</Label>
              <Input
                id="costPerUnit"
                type="number"
                min="0"
                step="0.01"
                value={formData.costPerUnit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    costPerUnit: e.target.value,
                  }))
                }
                placeholder="Enter cost per unit in Naira"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisitionDate">Acquisition Date</Label>
              <Input
                id="acquisitionDate"
                type="date"
                value={formData.acquisitionDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    acquisitionDate: e.target.value,
                  }))
                }
                required
              />
            </div>

            {formData.initialQuantity && formData.costPerUnit && (
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2">Cost Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span>
                      {parseInt(
                        formData.initialQuantity || '0',
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost per Unit:</span>
                    <span>
                      ₦{parseFloat(formData.costPerUnit || '0').toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total Cost:</span>
                    <span>
                      ₦
                      {(
                        parseInt(formData.initialQuantity || '0') *
                        parseFloat(formData.costPerUnit || '0')
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
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
                  isSubmitting ||
                  !formData.species ||
                  !formData.initialQuantity ||
                  !formData.costPerUnit
                }
              >
                {isSubmitting ? 'Creating...' : 'Create Batch'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>



      {/* Edit Batch Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>Update batch information</DialogDescription>
          </DialogHeader>
          {selectedBatch && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Species</Label>
                <Input value={selectedBatch.species} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-current-quantity">Current Quantity</Label>
                <Input
                  id="edit-current-quantity"
                  type="number"
                  min="0"
                  value={editFormData.currentQuantity}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      currentQuantity: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) => {
                    if (
                      value === 'active' ||
                      value === 'depleted' ||
                      value === 'sold'
                    ) {
                      setEditFormData((prev) => ({ ...prev, status: value }))
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="depleted">Depleted</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Batch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this batch? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium capitalize">
                  {selectedBatch.species}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedBatch.currentQuantity.toLocaleString()} units •{' '}
                  {selectedBatch.livestockType}
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm}>
                  Delete Batch
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
