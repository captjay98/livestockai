import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Bird,
  Edit,
  Egg,
  Package,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginatedResult } from '~/features/eggs/server'
import type { EggCollectionWithDetails } from '~/features/eggs/repository'
import { useFormatDate } from '~/features/settings'
import {
  createEggRecordFn,
  deleteEggRecordFn,
  getEggRecordsPaginated,
  getEggRecordsSummary,
  updateEggRecordFn,
} from '~/features/eggs/server'
import { getBatches } from '~/features/batches/server'

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

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

// Search params
interface EggSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

const getEggDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      farmId?: string | null
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      search?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const { requireAuth } = await import('~/features/auth/server-middleware')
      const session = await requireAuth()
      const farmId = data.farmId || undefined

      const [paginatedRecords, summary, allBatches] = await Promise.all([
        getEggRecordsPaginated(session.user.id, {
          farmId,
          page: data.page,
          pageSize: data.pageSize,
          sortBy: data.sortBy,
          sortOrder: data.sortOrder,
          search: data.search,
        }),
        getEggRecordsSummary(session.user.id, farmId),
        farmId ? getBatches(session.user.id, farmId) : Promise.resolve([]),
      ])

      const batches = allBatches.filter(
        (b) => b.status === 'active' && b.livestockType === 'poultry',
      )

      return {
        paginatedRecords,
        summary,
        batches,
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })

const createEggRecordAction = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      farmId: string
      batchId: string
      date: string
      quantityCollected: number
      quantityBroken: number
      quantitySold: number
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const { requireAuth } = await import('~/features/auth/server-middleware')
      await requireAuth()
      const result = await createEggRecordFn({
        data: {
          farmId: data.farmId,
          record: {
            batchId: data.batchId,
            date: new Date(data.date),
            quantityCollected: data.quantityCollected,
            quantityBroken: data.quantityBroken,
            quantitySold: data.quantitySold,
          },
        },
      })
      return { success: true, id: result }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })

export const Route = createFileRoute('/_auth/eggs/')({
  component: EggsPage,
  validateSearch: (search: Record<string, unknown>): EggSearchParams => ({
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    sortBy: (search.sortBy as string) || 'date',
    sortOrder:
      typeof search.sortOrder === 'string' &&
      (search.sortOrder === 'asc' || search.sortOrder === 'desc')
        ? search.sortOrder
        : 'desc',
    search: typeof search.search === 'string' ? search.search : '',
  }),
})

function EggsPage() {
  const { t } = useTranslation(['eggs', 'common', 'batches'])
  const { format: formatDate } = useFormatDate()
  const { selectedFarmId } = useFarm()
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const [paginatedRecords, setPaginatedRecords] = useState<
    PaginatedResult<Array<EggCollectionWithDetails>>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [summary, setSummary] = useState<{
    totalCollected: number
    totalBroken: number
    totalSold: number
    currentInventory: number
    recordCount: number
  } | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<EggCollectionWithDetails | null>(null)

  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    quantityCollected: '',
    quantityBroken: '0',
    quantitySold: '0',
  })

  const [editFormData, setEditFormData] = useState({
    date: '',
    quantityCollected: '',
    quantityBroken: '',
    quantitySold: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getEggDataForFarm({
        data: {
          farmId: selectedFarmId,
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.search,
        },
      })
      setPaginatedRecords(result.paginatedRecords)
      setBatches(result.batches)
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
    searchParams.search,
  ])

  const updateSearch = (updates: Partial<EggSearchParams>) => {
    navigate({
      search: (prev: EggSearchParams) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const resetForm = () => {
    setFormData({
      batchId: '',
      date: new Date().toISOString().split('T')[0],
      quantityCollected: '',
      quantityBroken: '0',
      quantitySold: '0',
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) return

    setIsSubmitting(true)
    setError('')

    try {
      await createEggRecordAction({
        data: {
          farmId: selectedFarmId,
          batchId: formData.batchId,
          date: formData.date,
          quantityCollected: parseInt(formData.quantityCollected),
          quantityBroken: parseInt(formData.quantityBroken),
          quantitySold: parseInt(formData.quantitySold),
        },
      })
      setDialogOpen(false)
      resetForm()
      toast.success(t('eggs:recorded', { defaultValue: 'Egg record added' }))
      loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('eggs:error.record', { defaultValue: 'Failed to create record' }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditRecord = (record: EggCollectionWithDetails) => {
    setSelectedRecord(record)
    setEditFormData({
      date: new Date(record.date).toISOString().split('T')[0],
      quantityCollected: String(record.quantityCollected),
      quantityBroken: String(record.quantityBroken),
      quantitySold: String(record.quantitySold),
    })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecord) return

    setIsSubmitting(true)
    try {
      await updateEggRecordFn({
        data: {
          recordId: selectedRecord.id,
          data: {
            date: new Date(editFormData.date),
            quantityCollected: parseInt(editFormData.quantityCollected),
            quantityBroken: parseInt(editFormData.quantityBroken),
            quantitySold: parseInt(editFormData.quantitySold),
          },
        },
      })
      setEditDialogOpen(false)
      toast.success(t('common:updated', { defaultValue: 'Egg record updated' }))
      loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('common:error.update', { defaultValue: 'Failed update' }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedRecord || !selectedFarmId) return
    setIsSubmitting(true)
    try {
      await deleteEggRecordFn({
        data: {
          farmId: selectedFarmId,
          recordId: selectedRecord.id,
        },
      })
      setDeleteDialogOpen(false)
      toast.success(t('common:deleted', { defaultValue: 'Egg record deleted' }))
      loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('common:error.delete', { defaultValue: 'Failed delete' }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Array<ColumnDef<EggCollectionWithDetails>>>(
    () => [
      {
        accessorKey: 'date',
        header: t('common:date', { defaultValue: 'Date' }),
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: 'batchSpecies',
        header: t('batches:batch', { defaultValue: 'Batch' }),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Bird className="h-4 w-4 text-orange-600" />
            <span className="font-medium">{row.original.batchSpecies}</span>
          </div>
        ),
      },
      {
        accessorKey: 'quantityCollected',
        header: t('eggs:collected', { defaultValue: 'Collected' }),
        cell: ({ row }) => (
          <span className="font-bold text-green-600">
            {row.original.quantityCollected}
          </span>
        ),
      },
      {
        accessorKey: 'quantityBroken',
        header: t('eggs:broken', { defaultValue: 'Broken' }),
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.quantityBroken > 0 ? 'destructive' : 'secondary'
            }
          >
            {row.original.quantityBroken}
          </Badge>
        ),
      },
      {
        accessorKey: 'quantitySold',
        header: t('eggs:sold', { defaultValue: 'Sold' }),
        cell: ({ row }) => row.original.quantitySold,
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditRecord(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                setSelectedRecord(row.original)
                setDeleteDialogOpen(true)
              }}
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {t('eggs:title', { defaultValue: 'Egg Production' })}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('eggs:description', {
              defaultValue: 'Track egg collection and sales',
            })}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('eggs:addRecord', { defaultValue: 'Add Record' })}
        </Button>
      </div>

      {summary && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-4 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('eggs:totalCollected', { defaultValue: 'Total Collected' })}
              </CardTitle>
              <Egg className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {summary.totalCollected.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('eggs:brokenLoss', { defaultValue: 'Broken/Loss' })}
              </CardTitle>
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-destructive">
                {summary.totalBroken.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('eggs:totalSold', { defaultValue: 'Total Sold' })}
              </CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {summary.totalSold.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('eggs:inInventory', { defaultValue: 'In Inventory' })}
              </CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {summary.currentInventory.toLocaleString()}
              </div>
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
        searchValue={searchParams.search}
        searchPlaceholder={t('eggs:searchPlaceholder', {
          defaultValue: 'Search by batch species...',
        })}
        isLoading={isLoading}
        onPaginationChange={(page, pageSize) => {
          updateSearch({ page, pageSize })
        }}
        onSortChange={(sortBy, sortOrder) => {
          updateSearch({ sortBy, sortOrder, page: 1 })
        }}
        onSearchChange={(search) => {
          updateSearch({ search, page: 1 })
        }}
        emptyIcon={<Egg className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('eggs:emptyTitle', {
          defaultValue: 'No production records',
        })}
        emptyDescription={t('eggs:emptyDescription', {
          defaultValue: 'Start tracking daily egg production.',
        })}
      />

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('eggs:addRecordTitle', {
                defaultValue: 'Record Egg Production',
              })}
            </DialogTitle>
            <DialogDescription>
              {t('eggs:addRecordDescription', {
                defaultValue: 'Enter daily egg collection details',
              })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch">
                {t('batches:batch', { defaultValue: 'Batch' })}
              </Label>
              <Select
                value={formData.batchId}
                onValueChange={(value: string | null) =>
                  setFormData((prev) => ({ ...prev, batchId: value || '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.batchId
                      ? batches.find((b) => b.id === formData.batchId)?.species
                      : t('batches:selectBatch', {
                          defaultValue: 'Select batch',
                        })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.species} (
                      {t('batches:birdCount', {
                        count: batch.currentQuantity,
                        defaultValue: '{{count}} birds',
                      })}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">
                {t('common:date', { defaultValue: 'Date' })}
              </Label>
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collected">
                  {t('eggs:collected', { defaultValue: 'Collected' })}
                </Label>
                <Input
                  id="collected"
                  type="number"
                  min="0"
                  value={formData.quantityCollected}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantityCollected: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="broken">
                  {t('eggs:broken', { defaultValue: 'Broken' })}
                </Label>
                <Input
                  id="broken"
                  type="number"
                  min="0"
                  value={formData.quantityBroken}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantityBroken: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sold">
                  {t('eggs:sold', { defaultValue: 'Sold' })}
                </Label>
                <Input
                  id="sold"
                  type="number"
                  min="0"
                  value={formData.quantitySold}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantitySold: e.target.value,
                    }))
                  }
                  required
                />
              </div>
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
                {t('common:cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.batchId ||
                  !formData.quantityCollected
                }
              >
                {isSubmitting
                  ? t('common:saving', { defaultValue: 'Saving...' })
                  : t('eggs:saveRecord', { defaultValue: 'Save Record' })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('eggs:editRecordTitle', { defaultValue: 'Edit Egg Record' })}
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('common:date', { defaultValue: 'Date' })}</Label>
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
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>
                    {t('eggs:collected', { defaultValue: 'Collected' })}
                  </Label>
                  <Input
                    type="number"
                    value={editFormData.quantityCollected}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        quantityCollected: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('eggs:broken', { defaultValue: 'Broken' })}</Label>
                  <Input
                    type="number"
                    value={editFormData.quantityBroken}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        quantityBroken: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('eggs:sold', { defaultValue: 'Sold' })}</Label>
                  <Input
                    type="number"
                    value={editFormData.quantitySold}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        quantitySold: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  {t('common:cancel', { defaultValue: 'Cancel' })}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {t('common:saveChanges', { defaultValue: 'Save Changes' })}
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
            <DialogTitle>
              {t('eggs.deleteRecordTitle', { defaultValue: 'Delete Record' })}
            </DialogTitle>
            <DialogDescription>
              {t('common.deleteConfirmation', {
                defaultValue: 'Are you sure?',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              {t('common.delete', { defaultValue: 'Delete' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
