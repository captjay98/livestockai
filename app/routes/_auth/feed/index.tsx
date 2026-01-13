import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  Bird,
  Edit,
  Fish,
  Package,
  Plus,
  Trash2,
  TrendingUp,
  Wheat,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginatedResult } from '~/features/feed/server'
import {
  createFeedRecord,
  deleteFeedRecordFn,
  getFeedInventory,
  getFeedRecordsPaginated,
  getFeedStats,
  updateFeedRecordFn,
} from '~/features/feed/server'
import { FEED_TYPES } from '~/features/feed/constants'
import { getBatchesFn } from '~/features/batches/server'
import { requireAuth } from '~/features/auth/server-middleware'
import { formatCurrency } from '~/features/settings/currency'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
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
} from '~/components/ui/dialog'
import { DataTable } from '~/components/ui/data-table'
import { useFarm } from '~/features/farms/context'

interface FeedRecord {
  id: string
  batchId: string
  feedType: string
  brandName: string | null
  bagSizeKg: number | null
  numberOfBags: number | null
  quantityKg: string
  cost: string
  date: Date
  species: string
  batchName: string | null
  livestockType: string
  farmId: string
  farmName?: string
  supplierId: string | null
  supplierName: string | null
  notes: string | null
}

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
  farmId: string
  farmName?: string | null
  createdAt?: Date
  updatedAt?: Date
}

interface FeedInventory {
  feedType: string
  quantityKg: string
  minThresholdKg: string
}

// Search params type
interface FeedSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
  feedType?: string
}

const getFeedDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      farmId?: string | null
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      search?: string
      feedType?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const farmId = data.farmId || undefined

      const [paginatedRecords, allBatches, inventory, summary] =
        await Promise.all([
          getFeedRecordsPaginated(session.user.id, {
            farmId,
            page: data.page,
            pageSize: data.pageSize,
            sortBy: data.sortBy,
            sortOrder: data.sortOrder,
            search: data.feedType ? data.feedType : data.search, // Basic search sharing
          }),
          getBatchesFn({ data: { farmId } }),
          getFeedInventory(session.user.id, farmId),
          getFeedStats(session.user.id, farmId),
        ])

      const batches = allBatches.filter((b) => b.status === 'active')

      return {
        paginatedRecords,
        batches,
        inventory,
        summary,
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })

const createFeedRecordAction = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      farmId: string
      batchId: string
      feedType: string
      quantityKg: number
      cost: number
      date: string
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const id = await createFeedRecord(session.user.id, data.farmId, {
        batchId: data.batchId,
        feedType: data.feedType as any,
        quantityKg: data.quantityKg,
        cost: data.cost,
        date: new Date(data.date),
      })
      return { success: true, id }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })

export const Route = createFileRoute('/_auth/feed/')({
  component: FeedPage,
  validateSearch: (search: Record<string, unknown>): FeedSearchParams => ({
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    sortBy: (search.sortBy as string) || 'date',
    sortOrder:
      typeof search.sortOrder === 'string' &&
      (search.sortOrder === 'asc' || search.sortOrder === 'desc')
        ? search.sortOrder
        : 'desc',
    q: typeof search.q === 'string' ? search.q : '',
    feedType: typeof search.feedType === 'string' ? search.feedType : undefined,
  }),
})

function FeedPage() {
  const { selectedFarmId } = useFarm()
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const [paginatedRecords, setPaginatedRecords] = useState<
    PaginatedResult<FeedRecord>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [inventory, setInventory] = useState<Array<FeedInventory>>([])
  const [summary, setSummary] = useState<{
    totalQuantityKg: number
    totalCost: number
    recordCount: number
  } | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [selectedRecord, setSelectedRecord] = useState<FeedRecord | null>(null)

  const [formData, setFormData] = useState({
    batchId: '',
    feedType: '',
    quantityKg: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
  })

  const [editFormData, setEditFormData] = useState({
    quantityKg: '',
    feedType: '',
    cost: '',
    date: '',
    batchId: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getFeedDataForFarm({
        data: {
          farmId: selectedFarmId,
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.q,
          feedType: searchParams.feedType,
        },
      })
      setPaginatedRecords(result.paginatedRecords as PaginatedResult<FeedRecord>)
      setBatches(result.batches)
      setInventory(result.inventory as Array<FeedInventory>)
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
    searchParams.feedType,
  ])

  const updateSearch = (updates: Partial<FeedSearchParams>) => {
    navigate({
      search: (prev: FeedSearchParams) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const resetForm = () => {
    setFormData({
      batchId: '',
      feedType: '',
      quantityKg: '',
      cost: '',
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
      await createFeedRecordAction({
        data: {
          farmId: selectedFarmId,
          batchId: formData.batchId,
          feedType: formData.feedType,
          quantityKg: parseFloat(formData.quantityKg),
          cost: parseFloat(formData.cost),
          date: formData.date,
        },
      })
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditRecord = (record: FeedRecord) => {
    setSelectedRecord(record)
    setEditFormData({
      quantityKg: record.quantityKg,
      feedType: record.feedType,
      cost: record.cost,
      date: new Date(record.date).toISOString().split('T')[0],
      batchId: record.batchId,
    })
    setEditDialogOpen(true)
  }

  const handleDeleteRecord = (record: FeedRecord) => {
    setSelectedRecord(record)
    setDeleteDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecord || !selectedFarmId) return

    setIsSubmitting(true)
    setError('')
    try {
      await updateFeedRecordFn({
        data: {
          farmId: selectedFarmId,
          recordId: selectedRecord.id,
          data: {
            batchId: editFormData.batchId,
            feedType: editFormData.feedType as any,
            quantityKg: parseFloat(editFormData.quantityKg),
            cost: parseFloat(editFormData.cost),
            date: new Date(editFormData.date),
          },
        },
      })
      setEditDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedRecord || !selectedFarmId) return

    setIsSubmitting(true)
    setError('')
    try {
      await deleteFeedRecordFn({
        data: {
          farmId: selectedFarmId,
          recordId: selectedRecord.id,
        },
      })
      setDeleteDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Array<ColumnDef<FeedRecord>>>(
    () => [
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
      },
      {
        accessorKey: 'species',
        header: 'Batch',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <div className="flex items-center gap-1 font-medium capitalize">
              {row.original.livestockType === 'poultry' ? (
                <Bird className="h-3 w-3 text-orange-600" />
              ) : (
                <Fish className="h-3 w-3 text-blue-600" />
              )}
              {row.original.batchName || row.original.species}
            </div>
            {row.original.batchName && (
              <span className="text-xs text-muted-foreground capitalize">
                {row.original.species}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'brandName',
        header: 'Brand / Type',
        cell: ({ row }) => {
          const feedTypeLabel = row.original.feedType
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
          return (
            <div className="flex flex-col">
              {row.original.brandName ? (
                <>
                  <span className="font-medium">{row.original.brandName}</span>
                  <span className="text-xs text-muted-foreground">
                    {feedTypeLabel}
                  </span>
                </>
              ) : (
                <Badge variant="secondary">{feedTypeLabel}</Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'quantityKg',
        header: 'Quantity',
        cell: ({ row }) => {
          const bags = row.original.numberOfBags
          const bagSize = row.original.bagSizeKg
          const qty = parseFloat(row.original.quantityKg)
          return (
            <div className="flex flex-col">
              <span className="font-medium">{qty.toLocaleString()} kg</span>
              {bags && bagSize && (
                <span className="text-xs text-muted-foreground">
                  {bags} × {bagSize}kg bags
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'supplierName',
        header: 'Supplier',
        cell: ({ row }) =>
          row.original.supplierName || (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'cost',
        header: 'Cost',
        cell: ({ row }) => formatCurrency(row.original.cost),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditRecord(row.original)}
              title="Edit Record"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDeleteRecord(row.original)}
              title="Delete Record"
            >
              <Trash2 className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold">Feed Management</h1>
          <p className="text-muted-foreground mt-1">
            Track feed consumption and costs
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Feed
        </Button>
      </div>

      {summary && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Consumed
              </CardTitle>
              <Wheat className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {summary.totalQuantityKg.toLocaleString()} kg
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.recordCount} records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Cost
              </CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatCurrency(summary.totalCost)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Across all batches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Feed Types
              </CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {inventory.length}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Types in inventory
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable
        columns={columns}
        data={paginatedRecords.data}
        total={paginatedRecords.total}
        page={paginatedRecords.page}
        pageSize={paginatedRecords.pageSize}
        totalPages={paginatedRecords.totalPages}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        searchValue={searchParams.q}
        searchPlaceholder="Search feed records..."
        isLoading={isLoading}
        filters={
          <Select
            value={searchParams.feedType || 'all'}
            onValueChange={(value) => {
              updateSearch({
                feedType: value === 'all' ? undefined : value || undefined,
                page: 1,
              })
            }}
          >
            <SelectTrigger className="w-[180px] h-10">
              <SelectValue>
                {searchParams.feedType
                  ? FEED_TYPES.find((t) => t.value === searchParams.feedType)
                      ?.label
                  : 'All Feed Types'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Feed Types</SelectItem>
              {FEED_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        emptyIcon={<Wheat className="h-12 w-12 text-muted-foreground" />}
        emptyTitle="No feed records"
        emptyDescription="Get started by adding a feed record."
      />

      {/* Create Feed Record Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Feed Record</DialogTitle>
            <DialogDescription>
              Record feed consumption for a batch
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Select
                value={formData.batchId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, batchId: value || '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.batchId
                      ? batches.find((b) => b.id === formData.batchId)?.species
                      : 'Select batch'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.species} ({batch.currentQuantity} units)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedType">Feed Type</Label>
              <Select
                value={formData.feedType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, feedType: value || '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.feedType
                      ? FEED_TYPES.find((t) => t.value === formData.feedType)
                          ?.label
                      : 'Select feed type'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FEED_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.feedType && (
                <p className="text-xs text-muted-foreground">
                  Available:{' '}
                  {parseFloat(
                    inventory.find((i) => i.feedType === formData.feedType)
                      ?.quantityKg || '0',
                  ).toLocaleString()}{' '}
                  kg
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (kg)</Label>
              <Input
                id="quantity"
                type="number"
                min="0.1"
                step="0.1"
                value={formData.quantityKg}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantityKg: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost (₦)</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, cost: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                required
              />
            </div>

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
                  !formData.batchId ||
                  !formData.feedType ||
                  !formData.quantityKg ||
                  !formData.cost
                }
              >
                {isSubmitting ? 'Saving...' : 'Save Record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Feed Record</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select value={editFormData.batchId} disabled>
                  <SelectTrigger>
                    <SelectValue>{selectedRecord.species}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={selectedRecord.batchId}>
                      {selectedRecord.species}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Feed Type</Label>
                <Select
                  value={editFormData.feedType}
                  onValueChange={(val) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      feedType: val || '',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      {editFormData.feedType
                        ? FEED_TYPES.find(
                            (t) => t.value === editFormData.feedType,
                          )?.label
                        : 'Select feed type'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {FEED_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity (kg)</Label>
                <Input
                  type="number"
                  value={editFormData.quantityKg}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      quantityKg: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Cost (₦)</Label>
                <Input
                  type="number"
                  value={editFormData.cost}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      cost: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
            <DialogDescription>Are you sure?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
