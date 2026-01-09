import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getEggRecordsForFarm, getEggSummaryForFarm, createEggRecord } from '~/lib/eggs/server'
import { getBatchesForFarm } from '~/lib/batches/server'
import { requireAuth } from '~/lib/auth/middleware'
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
import { Plus, Egg, Package, TrendingUp, AlertTriangle, Eye, Edit, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useFarm } from '~/components/farm-context'

interface EggRecord {
  id: string
  batchId: string
  date: Date
  quantityCollected: number
  quantityBroken: number
  quantitySold: number
  species: string
  currentQuantity: number
}

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

interface EggData {
  records: EggRecord[]
  batches: Batch[]
  summary: {
    totalCollected: number
    totalBroken: number
    totalSold: number
    currentInventory: number
    recordCount: number
  } | null
}

const getEggDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [records, summary, allBatches] = await Promise.all([
        getEggRecordsForFarm(session.user.id, data.farmId),
        getEggSummaryForFarm(session.user.id, data.farmId),
        getBatchesForFarm(session.user.id, data.farmId),
      ])
      const batches = allBatches.filter(b => b.status === 'active' && b.livestockType === 'poultry')
      return { records, summary, batches }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

const createEggRecordAction = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    farmId: string
    batchId: string
    date: string
    quantityCollected: number
    quantityBroken: number
    quantitySold: number
  }) => data)
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
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/eggs')({
  component: EggsPage,
})

function EggsPage() {
  const { selectedFarmId } = useFarm()
  const [data, setData] = useState<EggData>({ records: [], batches: [], summary: null })
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    quantityCollected: '',
    quantityBroken: '0',
    quantitySold: '0',
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
      const result = await getEggDataForFarm({ data: { farmId: selectedFarmId } })
      setData(result)
    } catch (error) {
      console.error('Failed to load egg data:', error)
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
          quantityBroken: parseInt(formData.quantityBroken) || 0,
          quantitySold: parseInt(formData.quantitySold) || 0,
        }
      })
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record eggs')
    } finally {
      setIsSubmitting(false)
    }
  }

  const { records, batches, summary } = data
  const selectedBatch = batches.find(b => b.id === formData.batchId)
  const layingPercentage = selectedBatch && formData.quantityCollected
    ? ((parseInt(formData.quantityCollected) / selectedBatch.currentQuantity) * 100).toFixed(1)
    : null

  if (!selectedFarmId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Egg Production</h1>
            <p className="text-muted-foreground mt-1">Track daily egg collection and sales</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Egg className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farm selected</h3>
            <p className="text-muted-foreground">
              Select a farm from the sidebar to view egg production
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
            <h1 className="text-3xl font-bold">Egg Production</h1>
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
          <h1 className="text-3xl font-bold">Egg Production</h1>
          <p className="text-muted-foreground mt-1">Track daily egg collection and sales</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Eggs
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Eggs</DialogTitle>
              <DialogDescription>Log daily egg production</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batchId">Layer Batch</Label>
                <Select
                  value={formData.batchId}
                  onValueChange={(value) => value && setFormData(prev => ({ ...prev, batchId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue>{formData.batchId ? batches.find(b => b.id === formData.batchId)?.species : 'Select layer batch'}</SelectValue>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantityCollected">Eggs Collected</Label>
                <Input
                  id="quantityCollected"
                  type="number"
                  min="0"
                  value={formData.quantityCollected}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantityCollected: e.target.value }))}
                  placeholder="Enter number of eggs collected"
                  required
                />
                {layingPercentage && (
                  <p className="text-sm text-muted-foreground">
                    Laying percentage: {layingPercentage}%
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantityBroken">Eggs Broken</Label>
                  <Input
                    id="quantityBroken"
                    type="number"
                    min="0"
                    value={formData.quantityBroken}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantityBroken: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantitySold">Eggs Sold</Label>
                  <Input
                    id="quantitySold"
                    type="number"
                    min="0"
                    value={formData.quantitySold}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantitySold: e.target.value }))}
                    placeholder="0"
                  />
                </div>
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
                  disabled={isSubmitting || !formData.batchId || !formData.quantityCollected}
                >
                  {isSubmitting ? 'Recording...' : 'Record Eggs'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {summary && (
        <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Collected</CardTitle>
              <Egg className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{summary.totalCollected.toLocaleString()}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{summary.recordCount} records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Sold</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{summary.totalSold.toLocaleString()}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Eggs sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Broken/Lost</CardTitle>
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{summary.totalBroken.toLocaleString()}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.totalCollected > 0 
                  ? `${((summary.totalBroken / summary.totalCollected) * 100).toFixed(1)}% loss rate`
                  : '0% loss rate'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Inventory</CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{summary.currentInventory.toLocaleString()}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Eggs in stock</p>
            </CardContent>
          </Card>
        </div>
      )}

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Egg className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No egg records</h3>
            <p className="text-muted-foreground mb-4">Start tracking egg production</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Eggs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Production Records</CardTitle>
            <CardDescription>Daily egg collection records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {records.map((record) => {
                const layingPct = record.currentQuantity > 0 
                  ? ((record.quantityCollected / record.currentQuantity) * 100).toFixed(1)
                  : '0'
                return (
                  <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                    <div className="flex items-center gap-3">
                      <Egg className="h-8 w-8 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium capitalize truncate">{record.species}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {record.currentQuantity} birds • {layingPct}% laying
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="flex gap-3 sm:gap-6 text-xs sm:text-sm">
                        <div className="text-center">
                          <p className="font-medium text-green-600">+{record.quantityCollected}</p>
                          <p className="text-muted-foreground text-[10px]">Collected</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-blue-600">-{record.quantitySold}</p>
                          <p className="text-muted-foreground text-[10px]">Sold</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-red-600">-{record.quantityBroken}</p>
                          <p className="text-muted-foreground text-[10px]">Broken</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive min-h-[44px] min-w-[44px]">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
