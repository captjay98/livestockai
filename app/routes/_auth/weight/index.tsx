import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Plus, Scale, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginatedResult } from '~/features/weight/server'
import {
  createWeightSampleFn,
  getGrowthAlerts,
  getWeightRecordsPaginatedFn,
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
      setFormData({
        batchId: '',
        date: new Date().toISOString().split('T')[0],
        sampleSize: '',
        averageWeightKg: '',
      })
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save sample')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Array<ColumnDef<WeightSample>>>(
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
        accessorKey: 'averageWeightKg',
        header: 'Avg Weight',
        cell: ({ row }) => (
          <div className="font-bold flex items-center">
            <Scale className="h-3 w-3 mr-1 text-muted-foreground" />
            {parseFloat(row.original.averageWeightKg).toFixed(2)} kg
          </div>
        ),
      },
      {
        accessorKey: 'sampleSize',
        header: 'Sample Size',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.sampleSize} animals
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Weight Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Monitor growth and performance
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Sample
        </Button>
      </div>

      {alerts.length > 0 && (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <Card className="border-primary/20 bg-primary/10 md:col-span-2">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-primary flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Growth Alerts
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
        emptyIcon={<Scale className="h-12 w-12 text-muted-foreground" />}
        emptyTitle="No weight samples"
        emptyDescription="Track the weight of your livestock regularly."
      />

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Weight Sample</DialogTitle>
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
                      : 'Select batch'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.species} ({batch.currentQuantity} active)
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
                <Label>Avg Weight (kg)</Label>
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
                <Label>Sample Size</Label>
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
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting || !formData.batchId || !formData.averageWeightKg
                }
              >
                {isSubmitting ? 'Saving...' : 'Save Sample'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
