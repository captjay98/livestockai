import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Bird,
  Edit,
  Eye,
  Fish,
  Package,
  Plus,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginatedResult } from '~/features/batches/server'
import {
  deleteBatchFn,
  getBatchesPaginated,
  getInventorySummary,
  updateBatchFn,
} from '~/features/batches/server'
import { requireAuth } from '~/features/auth/server-middleware'
import { useFormatCurrency, useFormatDate } from '~/features/settings'
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
import { PageHeader } from '~/components/page-header'
import { BatchDialog } from '~/components/dialogs/batch-dialog'

interface Batch {
  id: string
  farmId: string
  farmName?: string | null
  livestockType: string
  species: string
  initialQuantity: number
  currentQuantity: number
  acquisitionDate: Date
  costPerUnit: string
  totalCost: string
  status: string
  createdAt?: Date
  updatedAt?: Date
}

interface InventorySummary {
  poultry: { batches: number; quantity: number; investment: number }
  fish: { batches: number; quantity: number; investment: number }
  overall: {
    totalBatches?: number
    activeBatches: number
    depletedBatches: number
    totalQuantity: number
    totalInvestment: number
  }
}

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

export const Route = createFileRoute('/_auth/batches/')({
  component: BatchesPage,
  validateSearch: (search: Record<string, unknown>): BatchSearchParams => {
    const validStatuses = ['active', 'depleted', 'sold'] as const
    const validLivestockTypes = ['poultry', 'fish'] as const

    return {
      page: Number(search.page) || 1,
      pageSize: Number(search.pageSize) || 10,
      sortBy: (search.sortBy as string) || 'createdAt',
      sortOrder:
        typeof search.sortOrder === 'string' &&
        (search.sortOrder === 'asc' || search.sortOrder === 'desc')
          ? search.sortOrder
          : 'desc',
      q: typeof search.q === 'string' ? search.q : '',
      status:
        typeof search.status === 'string' &&
        (validStatuses as ReadonlyArray<string>).includes(search.status)
          ? (search.status as 'active' | 'depleted' | 'sold')
          : undefined,
      livestockType:
        typeof search.livestockType === 'string' &&
        (validLivestockTypes as ReadonlyArray<string>).includes(
          search.livestockType,
        )
          ? (search.livestockType as 'poultry' | 'fish')
          : undefined,
    }
  },
})

function BatchesPage() {
  const { t } = useTranslation(['batches', 'common'])
  const { selectedFarmId } = useFarm()
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const queryClient = useQueryClient()

  const [paginatedBatches, setPaginatedBatches] = useState<
    PaginatedResult<Batch>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Dialog states
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)

  const [editFormData, setEditFormData] = useState({
    currentQuantity: '',
    status: 'active' as 'active' | 'depleted' | 'sold',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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
      setPaginatedBatches(result.paginatedBatches)
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
      search: (prev: BatchSearchParams) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const handleEditBatch = (batch: Batch) => {
    setSelectedBatch(batch)
    setEditFormData({
      currentQuantity: batch.currentQuantity.toString(),
      status: batch.status as 'active' | 'depleted' | 'sold',
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
      toast.success(t('messages.updated', { defaultValue: 'Batch updated' }))
      loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('errors.update', {
              defaultValue: 'Failed to update batch',
            }),
      )
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
      toast.success(t('messages.deleted', { defaultValue: 'Batch deleted' }))
      queryClient.invalidateQueries({
        queryKey: ['farm-modules', selectedFarmId],
      })
      loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('errors.delete', {
              defaultValue: 'Failed to delete batch',
            }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Array<ColumnDef<Batch>>>(
    () => [
      {
        accessorKey: 'species',
        header: t('columns.species', { defaultValue: 'Species' }),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.livestockType === 'poultry' ? (
              <Bird className="h-4 w-4 text-orange-600" />
            ) : (
              <Fish className="h-4 w-4 text-blue-600" />
            )}
            <span className="capitalize font-medium">
              {row.getValue('species')}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('columns.status', { defaultValue: 'Status' }),
        cell: ({ row }) => {
          const status = row.original.status
          const isLowStock =
            row.original.currentQuantity <=
              row.original.initialQuantity * 0.1 && status === 'active'

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
                {t(`statuses.${status}`, { defaultValue: status })}
              </Badge>
              {isLowStock && (
                <Badge variant="warning" className="text-[10px] px-1 py-0 h-4">
                  {t('lowStock', { defaultValue: 'Low Stock' })}
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'currentQuantity',
        header: t('columns.currentQty', {
          defaultValue: 'Current Qty',
        }),
        cell: ({ row }) => row.original.currentQuantity.toLocaleString(),
      },
      {
        accessorKey: 'initialQuantity',
        header: t('columns.initialQty', {
          defaultValue: 'Initial Qty',
        }),
        cell: ({ row }) => row.original.initialQuantity.toLocaleString(),
      },
      {
        accessorKey: 'acquisitionDate',
        header: t('columns.acquisitionDate', {
          defaultValue: 'Acquisition Date',
        }),
        cell: ({ row }) => formatDate(row.original.acquisitionDate),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              title={t('actions.viewDetails', {
                defaultValue: 'View Details',
              })}
            >
              <Link to={`/batches/${row.original.id}` as any}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditBatch(row.original)}
              title={t('actions.editBatch', {
                defaultValue: 'Edit Batch',
              })}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDeleteBatch(row.original)}
              title={t('actions.deleteBatch', {
                defaultValue: 'Delete Batch',
              })}
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
    <div className="space-y-6">
      <PageHeader
        title={t('title', { defaultValue: 'Livestock Batches' })}
        description={t('description', {
          defaultValue:
            'Track groups of animals from acquisition to sale. Each batch represents a cohort you manage together.',
        })}
        icon={Package}
        actions={
          <Button onClick={() => setBatchDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('create', { defaultValue: 'Add Batch' })}
          </Button>
        }
      />

      {summary && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('totalLivestock', {
                  defaultValue: 'Total Livestock',
                })}
              </CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {summary.overall.totalQuantity.toLocaleString()}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.overall.activeBatches}{' '}
                {t('activeBatches', { defaultValue: 'active batches' })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('poultry', { defaultValue: 'Poultry' })}
              </CardTitle>
              <Bird className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {summary.poultry.quantity.toLocaleString()}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.poultry.batches}{' '}
                {t('common:batches', { defaultValue: 'batches' })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('fish', { defaultValue: 'Fish' })}
              </CardTitle>
              <Fish className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {summary.fish.quantity.toLocaleString()}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.fish.batches}{' '}
                {t('common:batches', { defaultValue: 'batches' })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('totalInvestment', {
                  defaultValue: 'Total Investment',
                })}
              </CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatCurrency(summary.overall.totalInvestment)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.overall.depletedBatches}{' '}
                {t('depletedBatches', {
                  defaultValue: 'depleted batches',
                })}
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
        searchPlaceholder={t('common:search', { defaultValue: 'Search...' })}
        isLoading={isLoading}
        filters={
          <>
            <Select
              value={searchParams.status || 'all'}
              onValueChange={(value: string) => {
                updateSearch({
                  status:
                    value === 'all'
                      ? undefined
                      : (value as 'active' | 'depleted' | 'sold'),
                  page: 1,
                })
              }}
            >
              <SelectTrigger className="w-[150px] h-10">
                <SelectValue>
                  {searchParams.status
                    ? t(`statuses.${searchParams.status}`, {
                        defaultValue:
                          searchParams.status.charAt(0).toUpperCase() +
                          searchParams.status.slice(1),
                      })
                    : t('filters.allStatus', {
                        defaultValue: 'All Status',
                      })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('allStatus', { defaultValue: 'All Status' })}
                </SelectItem>
                <SelectItem value="active">
                  {t('active', { defaultValue: 'Active' })}
                </SelectItem>
                <SelectItem value="depleted">
                  {t('depleted', { defaultValue: 'Depleted' })}
                </SelectItem>
                <SelectItem value="sold">
                  {t('sold', { defaultValue: 'Sold' })}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={searchParams.livestockType || 'all'}
              onValueChange={(value: string) => {
                updateSearch({
                  livestockType:
                    value === 'all' ? undefined : (value as 'poultry' | 'fish'),
                  page: 1,
                })
              }}
            >
              <SelectTrigger className="w-[150px] h-10">
                <SelectValue>
                  {searchParams.livestockType
                    ? t(`livestockTypes.${searchParams.livestockType}`, {
                        defaultValue:
                          searchParams.livestockType.charAt(0).toUpperCase() +
                          searchParams.livestockType.slice(1),
                      })
                    : t('filters.allTypes', {
                        defaultValue: 'All Types',
                      })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('filters.allTypes', { defaultValue: 'All Types' })}
                </SelectItem>
                <SelectItem value="poultry">
                  <div className="flex items-center gap-2">
                    <Bird className="h-4 w-4" />
                    {t('livestockTypes.poultry', {
                      defaultValue: 'Poultry',
                    })}
                  </div>
                </SelectItem>
                <SelectItem value="fish">
                  <div className="flex items-center gap-2">
                    <Fish className="h-4 w-4" />
                    {t('livestockTypes.fish', { defaultValue: 'Fish' })}
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
        emptyTitle={t('empty.title', {
          defaultValue: 'No batches found',
        })}
        emptyDescription={t('empty.description', {
          defaultValue: 'Get started by creating your first livestock batch.',
        })}
      />

      {/* Create Batch Dialog */}
      <BatchDialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen} />

      {/* Edit Batch Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('dialog.editTitle', { defaultValue: 'Edit Batch' })}
            </DialogTitle>
            <DialogDescription>
              {t('dialog.editDescription', {
                defaultValue: 'Update batch information',
              })}
            </DialogDescription>
          </DialogHeader>
          {selectedBatch && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('species', { defaultValue: 'Species' })}</Label>
                <Input value={selectedBatch.species} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-current-quantity">
                  {t('quantity', { defaultValue: 'Quantity' })}
                </Label>
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
                <Label htmlFor="edit-status">
                  {t('columns.status', { defaultValue: 'Status' })}
                </Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value: string | null) => {
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
                    <SelectItem value="active">
                      {t('statuses.active', { defaultValue: 'Active' })}
                    </SelectItem>
                    <SelectItem value="depleted">
                      {t('statuses.depleted', {
                        defaultValue: 'Depleted',
                      })}
                    </SelectItem>
                    <SelectItem value="sold">
                      {t('statuses.sold', { defaultValue: 'Sold' })}
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                  onClick={() => setEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  {t('common:cancel', { defaultValue: 'Cancel' })}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? t('common:saving', { defaultValue: 'Saving...' })
                    : t('common:save', { defaultValue: 'Save' })}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('dialog.deleteTitle', {
                defaultValue: 'Delete Batch',
              })}
            </DialogTitle>
            <DialogDescription>
              {t('dialog.deleteDescription', {
                defaultValue:
                  'Are you sure you want to delete this batch? This action cannot be undone.',
              })}
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
                  {t('common:cancel', { defaultValue: 'Cancel' })}
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm}>
                  {t('dialog.deleteConfirm', {
                    defaultValue: 'Delete',
                  })}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
