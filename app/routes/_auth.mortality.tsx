import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  AlertTriangle,
  HeartPulse,
  Info,
  Plus,
  Skull,
  TrendingDown,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginatedResult } from '~/lib/mortality/server'
import type { BatchAlert } from '~/lib/monitoring/alerts'
import {
  getMortalityRecordsPaginated,
  getMortalitySummary,
  recordMortality,
} from '~/lib/mortality/server'
import { getAllBatchAlerts } from '~/lib/monitoring/alerts'
import { getBatchesFn } from '~/lib/batches/server'
import { requireAuth } from '~/lib/auth/server-middleware'
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
import { useFarm } from '~/components/farm-context'

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

const MORTALITY_CAUSES = [
  { value: 'disease', label: 'Disease' },
  { value: 'predator', label: 'Predator Attack' },
  { value: 'weather', label: 'Weather/Environment' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'other', label: 'Other' },
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
      const session = await requireAuth()
      const farmId = data.farmId || undefined

      const [paginatedRecords, alerts, summary, allBatches] = await Promise.all(
        [
          getMortalityRecordsPaginated(session.user.id, {
            farmId,
            page: data.page,
            pageSize: data.pageSize,
            sortBy: data.sortBy,
            sortOrder: data.sortOrder,
            search: data.search,
          }),
          getAllBatchAlerts(session.user.id, farmId),
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
      const session = await requireAuth()
      const id = await recordMortality(session.user.id, {
        batchId: data.batchId,
        quantity: data.quantity,
        date: new Date(data.date),
        cause: data.cause,
        notes: data.notes,
      })
      return { success: true, id }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })

export const Route = createFileRoute('/_auth/mortality')({
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
  const [alerts, setAlerts] = useState<Array<BatchAlert>>([])
  const [summary, setSummary] = useState<{
    totalDeaths: number
    recordCount: number
    criticalAlerts: number
    totalAlerts: number
  } | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

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
      setPaginatedRecords(result.paginatedRecords as PaginatedResult<any>)
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
        err instanceof Error ? err.message : 'Failed to record mortality',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Array<ColumnDef<MortalityRecord>>>(
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
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => (
          <span className="font-bold text-destructive">
            -{row.original.quantity}
          </span>
        ),
      },
      {
        accessorKey: 'cause',
        header: 'Cause',
        cell: ({ row }) => {
          const cause =
            MORTALITY_CAUSES.find((c) => c.value === row.original.cause)
              ?.label || row.original.cause
          return <Badge variant="outline">{cause}</Badge>
        },
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
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
    ],
    [],
  )

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mortality Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Monitor livestock health and losses
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} variant="destructive">
          <Plus className="h-4 w-4 mr-2" />
          Record Loss
        </Button>
      </div>

      {summary && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Deaths
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
                Health Alerts
              </CardTitle>
              <HeartPulse className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-orange-600">
                {summary.criticalAlerts}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  Critical
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.totalAlerts} total alerts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Records
              </CardTitle>
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {summary.recordCount}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Recorded incidents
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
              className={`p-3 rounded-md border flex items-center justify-between ${alert.type === 'critical'
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
                View
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
        searchPlaceholder="Search records..."
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
                {searchParams.cause || 'All Causes'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Causes</SelectItem>
              {MORTALITY_CAUSES.map((cause) => (
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
        emptyTitle="No mortality records"
        emptyDescription="Hopefully you don't need to add any soon."
      />

      {/* Record Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Mortality</DialogTitle>
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
                      {batch.species} ({batch.currentQuantity} remaining)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cause">Cause</Label>
              <Select
                value={formData.cause}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, cause: value || '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.cause
                      ? MORTALITY_CAUSES.find((c) => c.value === formData.cause)
                          ?.label
                      : 'Select cause'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MORTALITY_CAUSES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Describe symptoms or incident..."
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
                variant="destructive"
                disabled={
                  isSubmitting || !formData.batchId || !formData.quantity
                }
              >
                {isSubmitting ? 'Saving...' : 'Record Loss'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
