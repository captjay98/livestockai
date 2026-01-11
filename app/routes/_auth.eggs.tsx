import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  AlertTriangle,
  Bird,
  Edit,
  Egg,
  Eye,
  Package,
  Plus,
  Trash2,
  TrendingUp
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type {PaginatedResult} from '~/lib/eggs/server';
import {
  
  createEggRecord,
  deleteEggRecordFn,
  getEggRecordsPaginated,
  getEggRecordsSummary,
  updateEggRecordFn
} from '~/lib/eggs/server'
import { getBatches } from '~/lib/batches/server'
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

interface EggRecord {
  id: string
  batchId: string
  date: Date
  quantityCollected: number
  quantityBroken: number
  quantitySold: number
  species?: string
  batchSpecies?: string
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
interface EggSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
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
    }) => data
  )
  .handler(async ({ data }) => {
    try {
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
      const session = await requireAuth()
      const id = await createEggRecord(session.user.id, data.farmId, {
        batchId: data.batchId,
        date: new Date(data.date),
        quantityCollected: data.quantityCollected,
        quantityBroken: data.quantityBroken,
        quantitySold: data.quantitySold,
      })
      return { success: true, id }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })

export const Route = createFileRoute('/_auth/eggs')({
  component: EggsPage,
  validateSearch: (search: Record<string, unknown>): EggSearchParams => ({
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    sortBy: (search.sortBy as string) || 'date',
    sortOrder: typeof search.sortOrder === 'string' && (search.sortOrder === 'asc' || search.sortOrder === 'desc') ? search.sortOrder : 'desc',
    q: typeof search.q === 'string' ? search.q : '',
  }),
})

function EggsPage() {
  const { selectedFarmId } = useFarm()
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const [paginatedRecords, setPaginatedRecords] = useState<PaginatedResult<any>>({
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
  const [selectedRecord, setSelectedRecord] = useState<EggRecord | null>(null)

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
          search: searchParams.q,
        },
      })
      setPaginatedRecords(result.paginatedRecords as PaginatedResult<any>)
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
    searchParams.q
  ])

  const updateSearch = (updates: Partial<EggSearchParams>) => {
    navigate({
      search: (prev) => ({
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
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditRecord = (record: EggRecord) => {
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
          }
        }
      })
      setEditDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed update')
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
          recordId: selectedRecord.id
        }
      })
      setDeleteDialogOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed delete')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo<Array<ColumnDef<EggRecord>>>(
    () => [
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
      },
      {
        accessorKey: 'batchSpecies',
        header: 'Batch',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Bird className="h-4 w-4 text-orange-600" />
            <span className="font-medium">{row.original.batchSpecies}</span>
          </div>
        ),
      },
      {
        accessorKey: 'quantityCollected',
        header: 'Collected',
        cell: ({ row }) => (
          <span className="font-bold text-green-600">
            {row.original.quantityCollected}
          </span>
        ),
      },
      {
        accessorKey: 'quantityBroken',
        header: 'Broken',
        cell: ({ row }) => (
          <Badge variant={row.original.quantityBroken > 0 ? "destructive" : "secondary"}>
            {row.original.quantityBroken}
          </Badge>
        ),
      },
      {
        accessorKey: 'quantitySold',
        header: 'Sold',
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
              onClick={() => { setSelectedRecord(row.original); setDeleteDialogOpen(true); }}
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
          <h1 className="text-3xl font-bold">Egg Production</h1>
          <p className="text-muted-foreground mt-1">
            Track egg collection and sales
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Record
        </Button>
      </div>

      {summary && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-4 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Collected
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
                Broken/Loss
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
                Total Sold
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
                In Inventory
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
        searchValue={searchParams.q}
        searchPlaceholder="Search by batch species..."
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
        emptyIcon={<Egg className="h-12 w-12 text-muted-foreground" />}
        emptyTitle="No production records"
        emptyDescription="Start tracking daily egg production."
      />

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Egg Production</DialogTitle>
            <DialogDescription>
              Enter daily egg collection details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Select
                value={formData.batchId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, batchId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.species} ({batch.currentQuantity} birds)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collected">Collected</Label>
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
                <Label htmlFor="broken">Broken</Label>
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
                <Label htmlFor="sold">Sold</Label>
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
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.batchId ||
                  !formData.quantityCollected
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
            <DialogTitle>Edit Egg Record</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={editFormData.date} onChange={e => setEditFormData(prev => ({ ...prev, date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Collected</Label>
                  <Input type="number" value={editFormData.quantityCollected} onChange={e => setEditFormData(prev => ({ ...prev, quantityCollected: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Broken</Label>
                  <Input type="number" value={editFormData.quantityBroken} onChange={e => setEditFormData(prev => ({ ...prev, quantityBroken: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Sold</Label>
                  <Input type="number" value={editFormData.quantitySold} onChange={e => setEditFormData(prev => ({ ...prev, quantitySold: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
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
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
