import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getFeedRecordsForFarm, createFeedRecord, FEED_TYPES } from '~/lib/feed/server'
import { getBatchesForFarm } from '~/lib/batches/server'
import { requireAuth } from '~/lib/auth/middleware'
import { formatNaira } from '~/lib/currency'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '~/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Plus, Wheat, TrendingUp, Package } from 'lucide-react'
import { useState, useEffect } from 'react'
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
}

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

interface FeedData {
  records: FeedRecord[]
  batches: Batch[]
  summary: {
    totalQuantityKg: number
    totalCost: number
    recordCount: number
  } | null
}

const getFeedDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [records, allBatches] = await Promise.all([
        getFeedRecordsForFarm(session.user.id, data.farmId),
        getBatchesForFarm(session.user.id, data.farmId),
      ])
      
      const batches = allBatches.filter(b => b.status === 'active')
      const totalQuantityKg = records.reduce((sum, r) => sum + parseFloat(r.quantityKg), 0)
      const totalCost = records.reduce((sum, r) => sum + parseFloat(r.cost), 0)
      
      return { 
        records, 
        batches,
        summary: { totalQuantityKg, totalCost, recordCount: records.length },
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

const createFeedRecordAction = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    farmId: string
    batchId: string
    feedType: string
    quantityKg: number
    cost: number
    date: string
  }) => data)
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
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/feed')({
  component: FeedPage,
})

function FeedPage() {
  const { selectedFarmId } = useFarm()
  const [data, setData] = useState<FeedData>({ records: [], batches: [], summary: null })
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    batchId: '',
    feedType: '',
    quantityKg: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    if (!selectedFarmId) {
      setData({ records: [], batches: [], summary: null })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const result = await getFeedDataForFarm({ data: { farmId: selectedFarmId } })
      setData(result)
    } catch (error) {
      console.error('Failed to load feed data:', error)
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
        }
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

  const { records, batches, summary } = data

  if (!selectedFarmId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Feed Management</h1>
            <p className="text-muted-foreground mt-1">Track feed consumption and costs</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Wheat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farm selected</h3>
            <p className="text-muted-foreground">
              Select a farm from the sidebar to view feed records
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          <p className="text-muted-foreground mt-1">Track feed consumption and costs</p>
        </div>
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
              <DialogDescription>Log feed consumption for a batch</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batchId">Batch</Label>
                <Select
                  value={formData.batchId}
                  onValueChange={(value) => value && setFormData(prev => ({ ...prev, batchId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue>{formData.batchId ? batches.find(b => b.id === formData.batchId)?.species : 'Select batch'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.species} ({batch.currentQuantity} {batch.livestockType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedType">Feed Type</Label>
                <Select
                  value={formData.feedType}
                  onValueChange={(value) => value && setFormData(prev => ({ ...prev, feedType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue>{formData.feedType ? FEED_TYPES.find(t => t.value === formData.feedType)?.label : 'Select feed type'}</SelectValue>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, quantityKg: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.batchId || !formData.feedType || !formData.quantityKg || !formData.cost}
                >
                  {isSubmitting ? 'Recording...' : 'Record Feed'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {summary && (
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feed Used</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalQuantityKg.toLocaleString()} kg</div>
              <p className="text-xs text-muted-foreground">{summary.recordCount} records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feed Cost</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(summary.totalCost)}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cost per kg</CardTitle>
              <Wheat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalQuantityKg > 0 
                  ? formatNaira(summary.totalCost / summary.totalQuantityKg)
                  : '₦0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Per kilogram</p>
            </CardContent>
          </Card>
        </div>
      )}

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wheat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No feed records</h3>
            <p className="text-muted-foreground mb-4">Start tracking feed consumption</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Feed
            </Button>
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
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Wheat className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium capitalize">{record.species}</p>
                      <p className="text-sm text-muted-foreground">
                        {FEED_TYPES.find(t => t.value === record.feedType)?.label || record.feedType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{parseFloat(record.quantityKg).toLocaleString()} kg</p>
                    <p className="text-sm text-muted-foreground">{formatNaira(record.cost)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      {new Date(record.date).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
