import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  Edit,
  Eye,
  Package,
  Plus,
  Trash2,
  TrendingUp,
  Wheat,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  createFeedRecord,
  getFeedInventory,
  getFeedRecords,
  updateFeedRecordFn,
  deleteFeedRecordFn,
} from '~/lib/feed/server'
import { FEED_TYPES } from '~/lib/feed/constants'
import { getBatches } from '~/lib/batches/server'
import { requireAuth } from '~/lib/auth/server-middleware'
import { formatNaira } from '~/lib/currency'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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
import { useFarm } from '~/components/farm-context'

interface FeedRecord {
  id: string
  batchId: string
  feedType: string
  quantityKg: string
  cost: string
  date: Date
  species: string
  livestockType: string
  farmId: string
  farmName: string
}

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
  farmId: string
  farmName?: string
}

interface FeedInventory {
  feedType: string
  quantityKg: string
  minThresholdKg: string
}

interface FeedData {
  records: Array<FeedRecord>
  batches: Array<Batch>
  inventory: Array<FeedInventory>
  summary: {
    totalQuantityKg: number
    totalCost: number
    recordCount: number
  } | null
}

const getFeedDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId?: string | null }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const farmId = data?.farmId || undefined
      const [records, allBatches, inventory] = await Promise.all([
        getFeedRecords(session.user.id, farmId),
        getBatches(session.user.id, farmId),
        getFeedInventory(session.user.id, farmId),
      ])

      const batches = allBatches.filter((b) => b.status === 'active')
      const totalQuantityKg = records.reduce(
        (sum, r) => sum + parseFloat(r.quantityKg),
        0,
      )
      const totalCost = records.reduce((sum, r) => sum + parseFloat(r.cost), 0)

      return {
        records: records.map(r => ({
          ...r,
          farmId: r.farmId || '',
          farmName: r.farmName || ''
        })),
        batches,
        inventory,
        summary: { totalQuantityKg, totalCost, recordCount: records.length },
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

export const Route = createFileRoute('/feed')({
  component: FeedPage,
})

function FeedPage() {
  const { selectedFarmId } = useFarm()
  const [data, setData] = useState<FeedData>({
    records: [],
    batches: [],
    inventory: [],
    summary: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Edit/Delete State
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
    batchId: '',
    feedType: '',
    quantityKg: '',
    cost: '',
    date: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getFeedDataForFarm({
        data: { farmId: selectedFarmId },
      })
      setData(result)
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedFarmId])

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
      setError(err instanceof Error ? err.message : 'Failed to record feed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditRecord = (record: FeedRecord) => {
    setSelectedRecord(record)
    setEditFormData({
      batchId: record.batchId,
      feedType: record.feedType,
      quantityKg: record.quantityKg.toString(),
      cost: record.cost.toString(),
      date: new Date(record.date).toISOString().split('T')[0],
    })
    setEditDialogOpen(true)
  }

  const handleDeleteRecord = (record: FeedRecord) => {
    setSelectedRecord(record)
    setDeleteDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecord) return

    // Allow editing even without selectedFarmId (using record.farmId)
    const targetFarmId = selectedRecord.farmId || selectedFarmId
    if (!targetFarmId) {
      setError('Farm ID is missing')
      return
    }

    setIsSubmitting(true)
    try {
      await updateFeedRecordFn({
        data: {
          farmId: targetFarmId,
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
      console.error('Failed to update record:', err)
      setError('Failed to update record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSubmit = async () => {
    if (!selectedRecord) return
    const targetFarmId = selectedRecord.farmId || selectedFarmId
    if (!targetFarmId) {
      setError('Farm ID is missing')
      return
    }

    setIsSubmitting(true)
    try {
      await deleteFeedRecordFn({
        data: {
          farmId: targetFarmId,
          recordId: selectedRecord.id,
        },
      })
      setDeleteDialogOpen(false)
      loadData()
    } catch (err) {
      console.error('Failed to delete record:', err)
      setError('Failed to delete record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const { records, batches, inventory, summary } = data

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Feed Management</h1>
            <p className="text-muted-foreground mt-1">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Feed Management</h1>
          <p className="text-muted-foreground mt-1">
            Track feed consumption and costs
          </p>
        </div>

        {/* Only enable creating records if a specific farm is selected */}
        {selectedFarmId ? (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Feed
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record Feed</DialogTitle>
                <DialogDescription>
                  Log feed consumption for a batch
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="batchId">Batch</Label>
                  <Select
                    value={formData.batchId}
                    onValueChange={(value) =>
                      value &&
                      setFormData((prev) => ({ ...prev, batchId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {formData.batchId
                          ? batches.find((b) => b.id === formData.batchId)
                            ?.species
                          : 'Select batch'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {batches.filter(b => b.farmId === selectedFarmId).map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.species} ({batch.currentQuantity} birds)
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
                      value &&
                      setFormData((prev) => ({ ...prev, feedType: value }))
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantityKg">Quantity (kg)</Label>
                  <Input
                    id="quantityKg"
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
                    placeholder="Enter quantity in kilograms"
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
                    placeholder="Enter cost in Naira"
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
                    {isSubmitting ? 'Recording...' : 'Record Feed'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {inventory.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Stock Levels</h2>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {inventory.map((item) => {
              const qty = parseFloat(item.quantityKg)
              const threshold = parseFloat(item.minThresholdKg)
              const isLow = qty <= threshold
              const label =
                FEED_TYPES.find((t) => t.value === item.feedType)?.label ||
                item.feedType

              return (
                <Card
                  key={item.feedType}
                  className={
                    isLow ? 'border-destructive/50 bg-destructive/5' : ''
                  }
                >
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-xs uppercase text-muted-foreground">
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-xl font-bold ${isLow ? 'text-destructive' : ''}`}
                      >
                        {qty.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">kg</span>
                    </div>
                    {isLow && (
                      <p className="text-[10px] text-destructive font-medium mt-1 uppercase">
                        Low Stock
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {summary && (
        <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Feed Used
              </CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {summary.totalQuantityKg.toLocaleString()} kg
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.recordCount} records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Feed Cost
              </CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {formatNaira(summary.totalCost)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Avg Cost per kg
              </CardTitle>
              <Wheat className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {summary.totalQuantityKg > 0
                  ? formatNaira(summary.totalCost / summary.totalQuantityKg)
                  : '₦0.00'}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Per kilogram
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wheat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No feed records</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking feed consumption
            </p>
            {selectedFarmId && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Feed
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Feed Records</CardTitle>
            <CardDescription>Recent feed consumption records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3"
                >
                  <div className="flex items-center gap-4">
                    <Wheat className="h-8 w-8 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium capitalize truncate">
                        {record.species}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {FEED_TYPES.find((t) => t.value === record.feedType)
                          ?.label || record.feedType}
                      </p>
                      {!selectedFarmId && record.farmName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {record.farmName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-right">
                      <p className="font-medium">
                        {parseFloat(record.quantityKg).toLocaleString()} kg
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatNaira(record.cost)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]"
                        onClick={() => handleEditRecord(record)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive min-h-[44px] min-w-[44px]"
                        onClick={() => handleDeleteRecord(record)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Feed Record</DialogTitle>
            <DialogDescription>Update feed consumption details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-batchId">Batch</Label>
              {/* 
                  Note: Editing batch ID might be complex due to inventory check on the new batch's farm.
                  For simplicity, we might allow it if it's on the same farm, or if we trust the user.
                  However, standard practice implies inventory is deducted from a specific farm's stock.
                  Ideally, we should filter batches by the record's farmId.
               */}
              <Select
                value={editFormData.batchId}
                onValueChange={(value) =>
                  value &&
                  setEditFormData((prev) => ({ ...prev, batchId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {editFormData.batchId
                      ? batches.find((b) => b.id === editFormData.batchId)
                        ?.species
                      : 'Select batch'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/* Show batches from the record's farm, or all valid batches if we can distinguish. 
                       Since selectedFarmId might be null, we should use selectedRecord.farmId filtering if needed. 
                       But batches array contains all active batches for the current view.
                       If view is "All Farms", batches has strictly all active batches from all farms.
                   */}
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.species} ({batch.currentQuantity} birds)
                      {(!selectedFarmId) && ` - ${batch.farmName || 'Unknown Farm'}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-feedType">Feed Type</Label>
              <Select
                value={editFormData.feedType}
                onValueChange={(value) =>
                  value &&
                  setEditFormData((prev) => ({ ...prev, feedType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {editFormData.feedType
                      ? FEED_TYPES.find((t) => t.value === editFormData.feedType)
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-quantityKg">Quantity (kg)</Label>
              <Input
                id="edit-quantityKg"
                type="number"
                min="0.1"
                step="0.1"
                value={editFormData.quantityKg}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    quantityKg: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cost">Cost (₦)</Label>
              <Input
                id="edit-cost"
                type="number"
                min="0"
                step="0.01"
                value={editFormData.cost}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, cost: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editFormData.date}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this feed record? The inventory will be restored.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
