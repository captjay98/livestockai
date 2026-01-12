import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  AlertTriangle,
  Droplets,
  Plus,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginatedResult } from '~/lib/water-quality/server'
import {
  createWaterQualityRecordFn,
  getWaterQualityAlerts,
  getWaterQualityRecordsPaginatedFn,
} from '~/lib/water-quality/server'
import { WATER_QUALITY_THRESHOLDS } from '~/lib/water-quality/constants'
import { getBatches } from '~/lib/batches/server'
import { requireAuth } from '~/lib/auth/server-middleware'
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
import { useFarm } from '~/components/farm-context'

interface WaterQualityRecord {
  id: string
  batchId: string
  date: Date
  ph: string
  temperatureCelsius: string
  dissolvedOxygenMgL: string
  ammoniaMgL: string
  species: string
  farmName?: string
}

interface WaterQualityAlert {
  batchId: string
  species: string
  issues: Array<string>
  severity: 'warning' | 'critical'
}

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

interface WaterQualitySearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
}

const getWaterQualityDataForFarm = createServerFn({ method: 'GET' })
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
        getWaterQualityRecordsPaginatedFn({
          data: {
            farmId,
            page: data.page,
            pageSize: data.pageSize,
            sortBy: data.sortBy,
            sortOrder: data.sortOrder,
            search: data.search,
          },
        }),
        getWaterQualityAlerts(session.user.id, farmId),
        getBatches(session.user.id, farmId),
      ])

      const batches = allBatches.filter(
        (b) => b.status === 'active' && b.livestockType === 'fish',
      )

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

export const Route = createFileRoute('/_auth/water-quality')({
  component: WaterQualityPage,
  validateSearch: (
    search: Record<string, unknown>,
  ): WaterQualitySearchParams => ({
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

function WaterQualityPage() {
  const { selectedFarmId } = useFarm()
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const [paginatedRecords, setPaginatedRecords] = useState<
    PaginatedResult<any>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [alerts, setAlerts] = useState<Array<WaterQualityAlert>>([])

  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    ph: '',
    temperatureCelsius: '',
    dissolvedOxygenMgL: '',
    ammoniaMgL: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getWaterQualityDataForFarm({
        data: {
          farmId: selectedFarmId,
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          search: searchParams.q,
        },
      })
      setPaginatedRecords(result.paginatedRecords as PaginatedResult<any>)
      setBatches(result.batches)
      setAlerts(result.alerts as Array<WaterQualityAlert>)
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

  const updateSearch = (updates: Partial<WaterQualitySearchParams>) => {
    navigate({
      search: (prev: any) => ({
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
      await createWaterQualityRecordFn({
        data: {
          farmId: selectedFarmId,
          data: {
            batchId: formData.batchId,
            date: new Date(formData.date),
            ph: parseFloat(formData.ph),
            temperatureCelsius: parseFloat(formData.temperatureCelsius),
            dissolvedOxygenMgL: parseFloat(formData.dissolvedOxygenMgL),
            ammoniaMgL: parseFloat(formData.ammoniaMgL),
          },
        },
      })
      setDialogOpen(false)
      setFormData({
        batchId: '',
        date: new Date().toISOString().split('T')[0],
        ph: '',
        temperatureCelsius: '',
        dissolvedOxygenMgL: '',
        ammoniaMgL: '',
      })
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Array<ColumnDef<WaterQualityRecord>>>(
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
          <span className="font-medium">{row.original.species}</span>
        ),
      },
      {
        accessorKey: 'ph',
        header: 'pH',
        cell: ({ row }) => {
          const ph = parseFloat(row.original.ph)
          const isBad =
            ph < WATER_QUALITY_THRESHOLDS.ph.min ||
            ph > WATER_QUALITY_THRESHOLDS.ph.max
          return (
            <span className={isBad ? 'text-destructive font-bold' : ''}>
              {ph.toFixed(1)}
            </span>
          )
        },
      },
      {
        accessorKey: 'temperatureCelsius',
        header: 'Temp (°C)',
        cell: ({ row }) => {
          const temp = parseFloat(row.original.temperatureCelsius)
          const isBad =
            temp < WATER_QUALITY_THRESHOLDS.temperature.min ||
            temp > WATER_QUALITY_THRESHOLDS.temperature.max
          return (
            <span className={isBad ? 'text-destructive font-bold' : ''}>
              {temp.toFixed(1)}°C
            </span>
          )
        },
      },
      {
        accessorKey: 'dissolvedOxygenMgL',
        header: 'DO (mg/L)',
        cell: ({ row }) => {
          const val = parseFloat(row.original.dissolvedOxygenMgL)
          const isBad = val < WATER_QUALITY_THRESHOLDS.dissolvedOxygen.min
          return (
            <span className={isBad ? 'text-destructive font-bold' : ''}>
              {val.toFixed(1)}
            </span>
          )
        },
      },
      {
        accessorKey: 'ammoniaMgL',
        header: 'Ammonia',
        cell: ({ row }) => {
          const val = parseFloat(row.original.ammoniaMgL)
          const isBad = val > WATER_QUALITY_THRESHOLDS.ammonia.max
          return (
            <span className={isBad ? 'text-destructive font-bold' : ''}>
              {val.toFixed(2)}
            </span>
          )
        },
      },
    ],
    [],
  )

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Water Quality</h1>
          <p className="text-muted-foreground mt-1">
            Track parameters for aquaculture
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Record
        </Button>
      </div>

      {alerts.length > 0 && (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <Card className="border-destructive/20 bg-destructive/10 md:col-span-2">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-destructive flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Quality Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 text-sm space-y-2">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1 bg-card p-2 rounded border border-destructive/20"
                >
                  <span className="font-medium">
                    {alert.species}
                  </span>
                  <ul className="list-disc list-inside text-xs text-muted-foreground">
                    {alert.issues.map((issue, idx) => (
                      <li key={idx} className="text-destructive">
                        {issue}
                      </li>
                    ))}
                  </ul>
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
        searchPlaceholder="Search batches..."
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
        emptyIcon={<Droplets className="h-12 w-12 text-muted-foreground" />}
        emptyTitle="No water quality records"
        emptyDescription="Monitor your water parameters regularly."
      />

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Water Quality</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Batch</Label>
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
                      : 'Select fish batch'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.species} ({batch.currentQuantity} fish)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
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
                <Label>pH</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  value={formData.ph}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, ph: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Temperature (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.temperatureCelsius}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      temperatureCelsius: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Dissolved Oxygen (mg/L)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.dissolvedOxygenMgL}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dissolvedOxygenMgL: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Ammonia (mg/L)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.ammoniaMgL}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ammoniaMgL: e.target.value,
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
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.batchId || !formData.ph}
              >
                {isSubmitting ? 'Saving...' : 'Save Record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
