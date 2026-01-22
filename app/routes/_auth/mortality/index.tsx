import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Edit,
  HeartPulse,
  Info,
  Plus,
  Skull,
  Trash2,
  TrendingDown,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { BatchAlert } from '~/features/monitoring/server'
import type {
  PaginatedResult,
  UpdateMortalityInput,
} from '~/features/mortality/server'
import {
  deleteMortalityRecordFn,
  getMortalityRecordsPaginatedFn,
  getMortalitySummary,
  recordMortalityFn,
  updateMortalityRecordFn,
} from '~/features/mortality/server'
import { useFormatDate } from '~/features/settings'
import { getAllBatchAlerts } from '~/features/monitoring/server'
import { getBatchesFn } from '~/features/batches/server'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { DataTable } from '~/components/ui/data-table'
import { useFarm } from '~/features/farms/context'
import { PageHeader } from '~/components/page-header'

interface MortalityRecord {
  id: string
  batchId: string
  quantity: number
  date: Date
  cause: string
  notes?: string
  species: string
  livestockType: string
  farmId: string
  farmName?: string
}

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

// Search params
interface MortalitySearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
  cause?: string
}

const MORTALITY_CAUSES = (t: any) => [
  {
    value: 'disease',
    label: t('mortality:causes.disease', { defaultValue: 'Disease' }),
  },
  {
    value: 'predator',
    label: t('mortality:causes.predator', { defaultValue: 'Predator Attack' }),
  },
  {
    value: 'weather',
    label: t('mortality:causes.weather', {
      defaultValue: 'Weather/Environment',
    }),
  },
  {
    value: 'unknown',
    label: t('mortality:causes.unknown', { defaultValue: 'Unknown' }),
  },
  {
    value: 'other',
    label: t('mortality:causes.other', { defaultValue: 'Other' }),
  },
]

const getMortalityDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      farmId?: string | null
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      search?: string
      cause?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const { requireAuth } = await import('~/features/auth/server-middleware')
      const session = await requireAuth()
      const farmId = data.farmId || undefined

      const [paginatedRecords, alerts, summary, allBatches] = await Promise.all(
        [
          getMortalityRecordsPaginatedFn({
            data: {
              farmId,
              page: data.page,
              pageSize: data.pageSize,
              sortBy: data.sortBy,
              sortOrder: data.sortOrder,
              search: data.search,
              // batchId: data.batchId, // batchId is not in the inputValidator for getMortalityDataForFarm
            },
          }),
          getAllBatchAlerts({ data: { farmId } }),
          getMortalitySummary(session.user.id, farmId),
          getBatchesFn({ data: { farmId } }),
        ],
      )

      const batches = allBatches.filter((b) => b.status === 'active')

      return {
        paginatedRecords,
        alerts,
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

const recordMortalityAction = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      farmId: string
      batchId: string
      quantity: number
      date: string
      cause: 'disease' | 'predator' | 'weather' | 'unknown' | 'other'
      notes?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const id = await recordMortalityFn({
        data: {
          farmId: data.farmId,
          data: {
            batchId: data.batchId,
            quantity: data.quantity,
            date: new Date(data.date),
            cause: data.cause,
            notes: data.notes,
          },
        },
      })
      return { success: true, id }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })

export const Route = createFileRoute('/_auth/mortality/')({
  component: MortalityPage,
  validateSearch: (search: Record<string, unknown>): MortalitySearchParams => ({
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    sortBy: (search.sortBy as string) || 'date',
    sortOrder:
      typeof search.sortOrder === 'string' &&
      (search.sortOrder === 'asc' || search.sortOrder === 'desc')
        ? search.sortOrder
        : 'desc',
    q: typeof search.q === 'string' ? search.q : '',
    cause: typeof search.cause === 'string' ? search.cause : undefined,
  }),
})

function MortalityPage() {
  const { t } = useTranslation(['mortality', 'common', 'batches'])
  const { format: formatDate } = useFormatDate()
  const { selectedFarmId } = useFarm()
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const [paginatedRecords, setPaginatedRecords] = useState<
    PaginatedResult<MortalityRecord>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [alerts, setAlerts] = useState<Array<BatchAlert>>([])
  const [summary, setSummary] = useState<{
    totalDeaths: number
    recordCount: number
    criticalAlerts: number
    totalAlerts: number
  } | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MortalityRecord | null>(
    null,
  )

  const [formData, setFormData] = useState({
    batchId: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    cause: 'unknown',
    notes: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getMortalityDataForFarm({
        data: {
          farmId: selectedFarmId,
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.q,
          cause: searchParams.cause,
        },
      })
      setPaginatedRecords(
        result.paginatedRecords as PaginatedResult<MortalityRecord>,
      )
      setBatches(result.batches)
      setAlerts(result.alerts)
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
    searchParams.cause,
  ])

  const updateSearch = (updates: Partial<MortalitySearchParams>) => {
    navigate({
      search: (prev: MortalitySearchParams) => ({
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
      await recordMortalityAction({
        data: {
          farmId: selectedFarmId,
          batchId: formData.batchId,
          quantity: parseInt(formData.quantity),
          date: formData.date,
          cause: formData.cause as any,
          notes: formData.notes,
        },
      })
      setDialogOpen(false)
      toast.success(
        t('mortality:recorded', { defaultValue: 'Mortality recorded' }),
      )
      setFormData({
        batchId: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        cause: 'unknown',
        notes: '',
      })
      loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('mortality:error.record', {
              defaultValue: 'Failed to record mortality',
            }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Array<ColumnDef<MortalityRecord>>>(
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
        accessorKey: 'quantity',
        header: t('common:quantity', { defaultValue: 'Quantity' }),
        cell: ({ row }) => (
          <span className="font-bold text-destructive">
            -{row.original.quantity}
          </span>
        ),
      },
      {
        accessorKey: 'cause',
        header: t('mortality:cause', { defaultValue: 'Cause' }),
        cell: ({ row }) => {
          const causes = MORTALITY_CAUSES(t)
          const cause =
            causes.find((c) => c.value === row.original.cause)?.label ||
            row.original.cause
          return <Badge variant="outline">{cause}</Badge>
        },
      },
      {
        accessorKey: 'notes',
        header: t('common:notes', { defaultValue: 'Notes' }),
        cell: ({ row }) => {
          if (!row.original.notes) return null
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{row.original.notes}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        },
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

  const handleEdit = (record: MortalityRecord) => {
    setSelectedRecord(record)
    setFormData({
      batchId: record.batchId,
      quantity: record.quantity.toString(),
      date: new Date(record.date).toISOString().split('T')[0],
      cause: record.cause,
      notes: record.notes || '',
    })
    setEditDialogOpen(true)
  }

  const handleDelete = (record: MortalityRecord) => {
    setSelectedRecord(record)
    setDeleteDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecord) return

    setIsSubmitting(true)
    setError('')
    try {
      await updateMortalityRecordFn({
        data: {
          recordId: selectedRecord.id,
          data: {
            quantity: parseInt(formData.quantity),
            cause: formData.cause as any,
            date: new Date(formData.date),
            notes: formData.notes || undefined,
          } as UpdateMortalityInput,
        },
      })
      setEditDialogOpen(false)
      toast.success(t('common:updated', { defaultValue: 'Record updated' }))
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
      await deleteMortalityRecordFn({ data: { recordId: selectedRecord.id } })
      setDeleteDialogOpen(false)
      toast.success(t('common:deleted', { defaultValue: 'Record deleted' }))
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
        title={t('mortality:title', { defaultValue: 'Mortality Records' })}
        description={t('mortality:description', {
          defaultValue:
            'Record deaths to monitor flock health and identify potential issues early.',
        })}
        icon={TrendingDown}
        actions={
          <Button onClick={() => setDialogOpen(true)} variant="destructive">
            <Plus className="h-4 w-4 mr-2" />
            {t('mortality:recordLoss', { defaultValue: 'Record Loss' })}
          </Button>
        }
      />

      {summary && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('mortality:totalDeaths', { defaultValue: 'Total Deaths' })}
              </CardTitle>
              <Skull className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-destructive">
                {summary.totalDeaths.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('mortality:healthAlerts', { defaultValue: 'Health Alerts' })}
              </CardTitle>
              <HeartPulse className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-orange-600">
                {summary.criticalAlerts}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  {t('common:critical', { defaultValue: 'Critical' })}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {t('mortality:totalAlerts', {
                  count: summary.totalAlerts,
                  defaultValue: '{{count}} total alerts',
                })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('common:records', { defaultValue: 'Records' })}
              </CardTitle>
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {summary.recordCount}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {t('mortality:recordedIncidents', {
                  defaultValue: 'Recorded incidents',
                })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`p-3 rounded-md border flex items-center justify-between ${
                alert.type === 'critical'
                  ? 'bg-destructive/10 border-destructive/20'
                  : 'bg-warning/10 border-warning/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`h-4 w-4 ${alert.type === 'critical' ? 'text-destructive' : 'text-warning'}`}
                />
                <span className="font-medium text-sm">
                  {alert.species}: {alert.message}
                </span>
              </div>
              <Link to={`/batches`} className="text-xs underline">
                {t('common:view', { defaultValue: 'View' })}
              </Link>
            </div>
          ))}
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
        searchPlaceholder={t('common:searchPlaceholder', {
          defaultValue: 'Search records...',
        })}
        isLoading={isLoading}
        filters={
          <Select
            value={searchParams.cause || 'all'}
            onValueChange={(value) => {
              updateSearch({
                cause: value === 'all' || !value ? undefined : value,
                page: 1,
              })
            }}
          >
            <SelectTrigger className="w-[180px] h-10">
              <SelectValue>
                {searchParams.cause ||
                  t('mortality:allCauses', { defaultValue: 'All Causes' })}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('mortality:allCauses', { defaultValue: 'All Causes' })}
              </SelectItem>
              {MORTALITY_CAUSES(t).map((cause) => (
                <SelectItem key={cause.value} value={cause.value}>
                  {cause.label}
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
        emptyIcon={<Skull className="h-12 w-12 text-muted-foreground" />}
        emptyTitle={t('mortality:emptyTitle', {
          defaultValue: 'No mortality records',
        })}
        emptyDescription={t('mortality:emptyDescription', {
          defaultValue: "Hopefully you don't need to add any soon.",
        })}
      />

      {/* Record Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('mortality:recordLossTitle', {
                defaultValue: 'Record Mortality',
              })}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch">
                {t('batches:batch', { defaultValue: 'Batch' })}
              </Label>
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
                      : t('batches:selectBatch', {
                          defaultValue: 'Select batch',
                        })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.species} (
                      {t('batches:remaining', {
                        count: batch.currentQuantity,
                        defaultValue: '{{count}} remaining',
                      })}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cause">
                {t('mortality:cause', { defaultValue: 'Cause' })}
              </Label>
              <Select
                value={formData.cause}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, cause: value || '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.cause
                      ? MORTALITY_CAUSES(t).find(
                          (c) => c.value === formData.cause,
                        )?.label
                      : t('mortality:selectCause', {
                          defaultValue: 'Select cause',
                        })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MORTALITY_CAUSES(t).map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                {t('common:quantity', { defaultValue: 'Quantity' })}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
                required
              />
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

            <div className="space-y-2">
              <Label htmlFor="notes">
                {t('common:notes', { defaultValue: 'Notes' })}
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder={t('mortality:notesPlaceholder', {
                  defaultValue: 'Describe symptoms or incident...',
                })}
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
                {t('common:cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  isSubmitting || !formData.batchId || !formData.quantity
                }
              >
                {isSubmitting
                  ? t('common.saving', { defaultValue: 'Saving...' })
                  : t('mortality.recordLossButton', {
                      defaultValue: 'Record Loss',
                    })}
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
              {t('mortality.editRecord', {
                defaultValue: 'Edit Mortality Record',
              })}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('batches.batch', { defaultValue: 'Batch' })}</Label>
              <Input value={selectedRecord?.species || ''} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cause">
                {t('mortality.cause', { defaultValue: 'Cause' })}
              </Label>
              <Select
                value={formData.cause}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, cause: value || '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {MORTALITY_CAUSES(t).find((c) => c.value === formData.cause)
                      ?.label ||
                      t('mortality.selectCause', {
                        defaultValue: 'Select cause',
                      })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MORTALITY_CAUSES(t).map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-quantity">
                {t('common.quantity', { defaultValue: 'Quantity' })}
              </Label>
              <Input
                id="edit-quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">
                {t('common.notes', { defaultValue: 'Notes' })}
              </Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
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
                onClick={() => setEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.quantity}
              >
                {isSubmitting
                  ? t('common.saving', { defaultValue: 'Saving...' })
                  : t('common.saveChanges', { defaultValue: 'Save Changes' })}
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
              {t('mortality.deleteTitle', {
                defaultValue: 'Delete Mortality Record',
              })}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('mortality.deleteDescription', {
              count: selectedRecord?.quantity,
              defaultValue:
                'Are you sure? This will restore {{count}} to the batch quantity.',
            })}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('common.deleting', { defaultValue: 'Deleting...' })
                : t('common.delete', { defaultValue: 'Delete' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
