import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Edit, Plus, Scale, Trash2, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginatedResult } from '~/features/weight/server'
import { useFormatDate, useFormatWeight } from '~/features/settings'
import {
  createWeightSampleFn,
  deleteWeightSampleFn,
  getGrowthAlerts,
  getWeightRecordsPaginatedFn,
  updateWeightSampleFn,
} from '~/features/weight/server'
import { getBatches } from '~/features/batches/server'
import { requireAuth } from '~/features/auth/server-middleware'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { DataTable } from '~/components/ui/data-table'
import { useFarm } from '~/features/farms/context'
import { PageHeader } from '~/components/page-header'

interface WeightSample {
  id: string
  batchId: string
  date: Date
  sampleSize: number
  averageWeightKg: string
  species: string
  livestockType: string
  farmName?: string
}

interface GrowthAlert {
  batchId: string
  species: string
  message: string
  severity: 'warning' | 'critical'
  adg: number
  expectedAdg: number
}

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

interface WeightSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
}

const getWeightDataForFarm = createServerFn({ method: 'GET' })
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
      const session = await requireAuth()
      const farmId = data.farmId || undefined

      const [paginatedRecords, alerts, allBatches] = await Promise.all([
        getWeightRecordsPaginatedFn({
          data: {
            farmId,
            page: data.page,
            pageSize: data.pageSize,
            sortBy: data.sortBy,
            sortOrder: data.sortOrder,
            search: data.search,
          },
        }),
        getGrowthAlerts(session.user.id, farmId),
        getBatches(session.user.id, farmId),
      ])

      const batches = allBatches.filter((b) => b.status === 'active')

      return {
        paginatedRecords,
        alerts,
        batches,
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })

export const Route = createFileRoute('/_auth/weight/')({
  component: WeightPage,
  validateSearch: (search: Record<string, unknown>): WeightSearchParams => ({
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    sortBy: (search.sortBy as string) || 'date',
    sortOrder:
      typeof search.sortOrder === 'string' &&
      (search.sortOrder === 'asc' || search.sortOrder === 'desc')
        ? search.sortOrder
        : 'desc',
    q: typeof search.q === 'string' ? search.q : '',
  }),
})

function WeightPage() {
  const { t } = useTranslation(['weight', 'common', 'batches'])
  const { format: formatDate } = useFormatDate()
  const { format: formatWeight } = useFormatWeight()
  const { selectedFarmId } = useFarm()
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const [paginatedRecords, setPaginatedRecords] = useState<
    PaginatedResult<WeightSample>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [alerts, setAlerts] = useState<Array<GrowthAlert>>([])

  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<WeightSample | null>(
    null,
  )

  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    sampleSize: '',
    averageWeightKg: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getWeightDataForFarm({
        data: {
          farmId: selectedFarmId,
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.q,
        },
      })
      setPaginatedRecords(result.paginatedRecords)
      setBatches(result.batches)
      setAlerts(result.alerts as Array<GrowthAlert>)
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
  ])

  const updateSearch = (updates: Partial<WeightSearchParams>) => {
    navigate({
      search: (prev: WeightSearchParams) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) return

    setIsSubmitting(true)
    setError('')

    try {
      await createWeightSampleFn({
        data: {
          farmId: selectedFarmId,
          data: {
            batchId: formData.batchId,
            date: new Date(formData.date),
            sampleSize: parseInt(formData.sampleSize),
            averageWeightKg: parseFloat(formData.averageWeightKg),
          },
        },
      })
      setDialogOpen(false)
      toast.success(
        t('weight:recorded', { defaultValue: 'Weight sample recorded' }),
      )
      setFormData({
        batchId: '',
        date: new Date().toISOString().split('T')[0],
        sampleSize: '',
        averageWeightKg: '',
      })
      loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('weight:error.record', { defaultValue: 'Failed to save sample' }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Array<ColumnDef<WeightSample>>>(
    () => [
      {
        accessorKey: 'date',
        header: t('common:date', { defaultValue: 'Date' }),
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: 'species',
        header: t('batches:batch', { defaultValue: 'Batch' }),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.species}</span>
        ),
      },
      {
        accessorKey: 'averageWeightKg',
        header: t('weight:avgWeight', { defaultValue: 'Avg Weight' }),
        cell: ({ row }) => (
          <div className="font-bold flex items-center">
            <Scale className="h-3 w-3 mr-1 text-muted-foreground" />
            {formatWeight(parseFloat(row.original.averageWeightKg))}
          </div>
        ),
      },
      {
        accessorKey: 'sampleSize',
        header: t('weight:sampleSize', { defaultValue: 'Sample Size' }),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {t('weight:animalsCount', {
              count: row.original.sampleSize,
              defaultValue: '{{count}} animals',
            })}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(row.original)}
              title={t('common:edit', { defaultValue: 'Edit' })}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(row.original)}
              title={t('common:delete', { defaultValue: 'Delete' })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const handleEdit = (record: WeightSample) => {
    setSelectedRecord(record)
    setFormData({
      batchId: record.batchId,
      date: new Date(record.date).toISOString().split('T')[0],
      sampleSize: record.sampleSize.toString(),
      averageWeightKg: record.averageWeightKg,
    })
    setEditDialogOpen(true)
  }

  const handleDelete = (record: WeightSample) => {
    setSelectedRecord(record)
    setDeleteDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecord) return

    setIsSubmitting(true)
    setError('')
    try {
      await updateWeightSampleFn({
        data: {
          recordId: selectedRecord.id,
          data: {
            sampleSize: parseInt(formData.sampleSize),
            averageWeightKg: parseFloat(formData.averageWeightKg),
            date: new Date(formData.date),
          },
        },
      })
      setEditDialogOpen(false)
      toast.success(t('common:updated', { defaultValue: 'Sample updated' }))
      loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('common:error.update', { defaultValue: 'Failed to update' }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedRecord) return

    setIsSubmitting(true)
    try {
      await deleteWeightSampleFn({ data: { recordId: selectedRecord.id } })
      setDeleteDialogOpen(false)
      toast.success(t('common:deleted', { defaultValue: 'Sample deleted' }))
      loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('common:error.delete', { defaultValue: 'Failed to delete' }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('weight:title', { defaultValue: 'Weight Samples' })}
        description={t('weight:description', {
          defaultValue:
            'Track growth by recording periodic weight samples. Compare against industry standards.',
        })}
        icon={Scale}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('weight:addSample', { defaultValue: 'Add Sample' })}
          </Button>
        }
      />

      {alerts.length > 0 && (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <Card className="border-primary/20 bg-primary/10 md:col-span-2">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-primary flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('weight:growthAlerts', { defaultValue: 'Growth Alerts' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 text-sm space-y-2">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-card p-2 rounded border border-primary/20"
                >
                  <span className="font-medium">{alert.species}</span>
                  <span className="text-muted-foreground">{alert.message}</span>
                </div>
              ))}
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
        searchPlaceholder={t('batches:searchPlaceholder', {
          defaultValue: 'Search batches...',
        })}
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
        emptyIcon={<Scale className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('weight:emptyTitle', {
          defaultValue: 'No weight samples',
        })}
        emptyDescription={t('weight:emptyDescription', {
          defaultValue: 'Track the weight of your livestock regularly.',
        })}
      />

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('weight:addSampleTitle', {
                defaultValue: 'Record Weight Sample',
              })}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('batches:batch', { defaultValue: 'Batch' })}</Label>
              <Select
                value={formData.batchId}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, batchId: val || '' }))
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
                      {t('batches:activeCount', {
                        count: batch.currentQuantity,
                        defaultValue: '{{count}} active',
                      })}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('common:date', { defaultValue: 'Date' })}</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t('weight:avgWeight', { defaultValue: 'Avg Weight' })} (kg)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.averageWeightKg}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      averageWeightKg: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('weight:sampleSize', { defaultValue: 'Sample Size' })}
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.sampleSize}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sampleSize: e.target.value,
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
                  isSubmitting || !formData.batchId || !formData.averageWeightKg
                }
              >
                {isSubmitting
                  ? t('common:saving', { defaultValue: 'Saving...' })
                  : t('weight:saveSample', { defaultValue: 'Save Sample' })}
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
              {t('weight:editSampleTitle', {
                defaultValue: 'Edit Weight Sample',
              })}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('batches:batch', { defaultValue: 'Batch' })}</Label>
              <Input value={selectedRecord?.species || ''} disabled />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t('weight:avgWeight', { defaultValue: 'Avg Weight' })} (kg)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.averageWeightKg}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      averageWeightKg: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('weight:sampleSize', { defaultValue: 'Sample Size' })}
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.sampleSize}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sampleSize: e.target.value,
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
                onClick={() => setEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                {t('common:cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.averageWeightKg}
              >
                {isSubmitting
                  ? t('common:saving', { defaultValue: 'Saving...' })
                  : t('common:saveChanges', { defaultValue: 'Save Changes' })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('weight:deleteSampleTitle', {
                defaultValue: 'Delete Weight Sample',
              })}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('weight:deleteConfirmation', {
              defaultValue:
                'Are you sure you want to delete this weight sample?',
            })}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t('common:cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('common:deleting', { defaultValue: 'Deleting...' })
                : t('common:delete', { defaultValue: 'Delete' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
