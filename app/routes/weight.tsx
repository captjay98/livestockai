import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getWeightSamplesForFarm, getGrowthAlerts, createWeightSample } from '~/lib/weight/server'
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
import { Plus, Scale, TrendingUp, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useFarm } from '~/components/farm-context'

interface WeightSample {
  id: string
  batchId: string
  date: Date
  sampleSize: number
  averageWeightKg: string
  species: string
  livestockType: string
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

interface WeightData {
  samples: WeightSample[]
  alerts: GrowthAlert[]
  batches: Batch[]
}

const getWeightDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [samples, alerts, allBatches] = await Promise.all([
        getWeightSamplesForFarm(session.user.id, data.farmId),
        getGrowthAlerts(session.user.id, data.farmId),
        getBatchesForFarm(session.user.id, data.farmId),
      ])
      const batches = allBatches.filter(b => b.status === 'active')
      return { samples, alerts, batches }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

const createWeightSampleAction = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    farmId: string
    batchId: string
    date: string
    sampleSize: number
    averageWeightKg: number
  }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const id = await createWeightSample(session.user.id, data.farmId, {
        batchId: data.batchId,
        date: new Date(data.date),
        sampleSize: data.sampleSize,
        averageWeightKg: data.averageWeightKg,
      })
      return { success: true, id }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/weight')({
  component: WeightPage,
})

function WeightPage() {
  const { selectedFarmId } = useFarm()
  const [data, setData] = useState<WeightData>({ samples: [], alerts: [], batches: [] })
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
    if (!selectedFarmId) {
      setData({ samples: [], alerts: [], batches: [] })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const result = await getWeightDataForFarm({ data: { farmId: selectedFarmId } })
      setData(result)
    } catch (error) {
      console.error('Failed to load weight data:', error)
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
      sampleSize: '',
      averageWeightKg: '',
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) return
    
    setIsSubmitting(true)
    setError('')

    try {
      await createWeightSampleAction({
        data: {
          farmId: selectedFarmId,
          batchId: formData.batchId,
          date: formData.date,
          sampleSize: parseInt(formData.sampleSize),
          averageWeightKg: parseFloat(formData.averageWeightKg),
        }
      })
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record weight')
    } finally {
      setIsSubmitting(false)
    }
  }

  const { samples, alerts, batches } = data
  const selectedBatch = batches.find(b => b.id === formData.batchId)

  if (!selectedFarmId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Weight Tracking</h1>
            <p className="text-muted-foreground mt-1">Monitor livestock growth and weight</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farm selected</h3>
            <p className="text-muted-foreground">Select a farm from the sidebar to view weight records</p>
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
            <h1 className="text-3xl font-bold">Weight Tracking</h1>
            <p className="text-muted-foreground mt-1">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical')
  const warningAlerts = alerts.filter(a => a.severity === 'warning')

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Weight Tracking</h1>
          <p className="text-muted-foreground mt-1">Monitor livestock growth and weight</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Weight
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Weight</DialogTitle>
              <DialogDescription>Log weight sample for a batch</DialogDescription>
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
                <Label htmlFor="sampleSize">Sample Size</Label>
                <Input
                  id="sampleSize"
                  type="number"
                  min="1"
                  max={selectedBatch?.currentQuantity || 1000}
                  value={formData.sampleSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, sampleSize: e.target.value }))}
                  placeholder="Number of animals weighed"
                  required
                />
                {selectedBatch && (
                  <p className="text-sm text-muted-foreground">Max: {selectedBatch.currentQuantity} (total in batch)</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="averageWeightKg">Average Weight (kg)</Label>
                <Input
                  id="averageWeightKg"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.averageWeightKg}
                  onChange={(e) => setFormData(prev => ({ ...prev, averageWeightKg: e.target.value }))}
                  placeholder="Average weight in kilograms"
                  required
                />
              </div>

              {formData.sampleSize && formData.averageWeightKg && selectedBatch && (
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2">Estimated Totals</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Sample Weight:</span>
                      <span>{(parseInt(formData.sampleSize) * parseFloat(formData.averageWeightKg)).toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Batch Weight:</span>
                      <span>{(selectedBatch.currentQuantity * parseFloat(formData.averageWeightKg)).toFixed(2)} kg</span>
                    </div>
                  </div>
                </div>
              )}

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
                  disabled={isSubmitting || !formData.batchId || !formData.sampleSize || !formData.averageWeightKg}
                >
                  {isSubmitting ? 'Recording...' : 'Record Weight'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Growth Alerts */}
      {alerts.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Growth Alerts
            </CardTitle>
            <CardDescription>Batches with below-expected growth rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map((alert) => (
                <div key={alert.batchId} className="flex items-center justify-between p-3 bg-destructive/10 rounded-md border border-destructive/20">
                  <div>
                    <p className="font-medium text-destructive capitalize">{alert.species}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <Badge variant="destructive">Critical</Badge>
                </div>
              ))}
              {warningAlerts.map((alert) => (
                <div key={alert.batchId} className="flex items-center justify-between p-3 bg-warning/10 rounded-md border border-warning/20">
                  <div>
                    <p className="font-medium text-warning capitalize">{alert.species}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <Badge variant="warning">Warning</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{samples.length}</div>
            <p className="text-xs text-muted-foreground">Weight records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">{criticalAlerts.length} critical, {warningAlerts.length} warning</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Weight</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {samples.length > 0 ? `${parseFloat(samples[0].averageWeightKg).toFixed(2)} kg` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">{samples.length > 0 ? samples[0].species : 'No samples'}</p>
          </CardContent>
        </Card>
      </div>

      {samples.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No weight records</h3>
            <p className="text-muted-foreground mb-4">Start tracking livestock weight</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Weight
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Weight Samples</CardTitle>
            <CardDescription>Recent weight measurements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {samples.map((sample) => (
                <div key={sample.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Scale className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium capitalize">{sample.species}</p>
                      <p className="text-sm text-muted-foreground">Sample size: {sample.sampleSize} {sample.livestockType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-lg">{parseFloat(sample.averageWeightKg).toFixed(2)} kg</p>
                    <p className="text-sm text-muted-foreground">Average weight</p>
                  </div>
                  <Badge variant="outline">{new Date(sample.date).toLocaleDateString()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
