import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getWaterQualityForFarm, getWaterQualityAlerts, createWaterQualityRecord, WATER_QUALITY_THRESHOLDS } from '~/lib/water-quality/server'
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
import { Plus, Droplets, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'
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
}

interface WaterQualityAlert {
  batchId: string
  species: string
  issues: string[]
  severity: 'warning' | 'critical'
}

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

interface WaterQualityData {
  records: WaterQualityRecord[]
  alerts: WaterQualityAlert[]
  batches: Batch[]
}

const getWaterQualityDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [records, alerts, allBatches] = await Promise.all([
        getWaterQualityForFarm(session.user.id, data.farmId),
        getWaterQualityAlerts(session.user.id, data.farmId),
        getBatchesForFarm(session.user.id, data.farmId),
      ])
      const batches = allBatches.filter(b => b.status === 'active' && b.livestockType === 'fish')
      return { records, alerts, batches }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

const createWaterQualityAction = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    farmId: string
    batchId: string
    date: string
    ph: number
    temperatureCelsius: number
    dissolvedOxygenMgL: number
    ammoniaMgL: number
  }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const id = await createWaterQualityRecord(session.user.id, data.farmId, {
        batchId: data.batchId,
        date: new Date(data.date),
        ph: data.ph,
        temperatureCelsius: data.temperatureCelsius,
        dissolvedOxygenMgL: data.dissolvedOxygenMgL,
        ammoniaMgL: data.ammoniaMgL,
      })
      return { success: true, id }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/water-quality')({
  component: WaterQualityPage,
})

function WaterQualityPage() {
  const { selectedFarmId } = useFarm()
  const [data, setData] = useState<WaterQualityData>({ records: [], alerts: [], batches: [] })
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

  const t = WATER_QUALITY_THRESHOLDS

  const loadData = async () => {
    if (!selectedFarmId) {
      setData({ records: [], alerts: [], batches: [] })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const result = await getWaterQualityDataForFarm({ data: { farmId: selectedFarmId } })
      setData(result)
    } catch (error) {
      console.error('Failed to load water quality data:', error)
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
      ph: '',
      temperatureCelsius: '',
      dissolvedOxygenMgL: '',
      ammoniaMgL: '',
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) return
    
    setIsSubmitting(true)
    setError('')

    try {
      await createWaterQualityAction({
        data: {
          farmId: selectedFarmId,
          batchId: formData.batchId,
          date: formData.date,
          ph: parseFloat(formData.ph),
          temperatureCelsius: parseFloat(formData.temperatureCelsius),
          dissolvedOxygenMgL: parseFloat(formData.dissolvedOxygenMgL),
          ammoniaMgL: parseFloat(formData.ammoniaMgL),
        }
      })
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record water quality')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getWarning = (field: string, value: string): string | null => {
    if (!value) return null
    const num = parseFloat(value)
    
    switch (field) {
      case 'ph':
        if (num < t.ph.min) return `Below safe range (min: ${t.ph.min})`
        if (num > t.ph.max) return `Above safe range (max: ${t.ph.max})`
        break
      case 'temperatureCelsius':
        if (num < t.temperature.min) return `Below safe range (min: ${t.temperature.min}°C)`
        if (num > t.temperature.max) return `Above safe range (max: ${t.temperature.max}°C)`
        break
      case 'dissolvedOxygenMgL':
        if (num < t.dissolvedOxygen.min) return `Below safe range (min: ${t.dissolvedOxygen.min} mg/L)`
        break
      case 'ammoniaMgL':
        if (num > t.ammonia.max) return `Above safe range (max: ${t.ammonia.max} mg/L)`
        break
    }
    return null
  }

  const { records, alerts, batches } = data

  if (!selectedFarmId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Water Quality</h1>
            <p className="text-muted-foreground mt-1">Monitor pond water parameters</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Droplets className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farm selected</h3>
            <p className="text-muted-foreground">Select a farm from the sidebar to view water quality</p>
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
            <h1 className="text-3xl font-bold">Water Quality</h1>
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
          <h1 className="text-3xl font-bold">Water Quality</h1>
          <p className="text-muted-foreground mt-1">Monitor pond water parameters</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Reading
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Water Quality</DialogTitle>
              <DialogDescription>Log pond water parameters</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batchId">Fish Pond/Batch</Label>
                <Select
                  value={formData.batchId}
                  onValueChange={(value) => value && setFormData(prev => ({ ...prev, batchId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue>{formData.batchId ? batches.find(b => b.id === formData.batchId)?.species : 'Select fish batch'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.species} ({batch.currentQuantity} fish)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {batches.length === 0 && (
                  <p className="text-sm text-muted-foreground">No active fish batches found</p>
                )}
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
                <Label htmlFor="ph">pH Level (Safe: {t.ph.min} - {t.ph.max})</Label>
                <Input
                  id="ph"
                  type="number"
                  min="0"
                  max="14"
                  step="0.1"
                  value={formData.ph}
                  onChange={(e) => setFormData(prev => ({ ...prev, ph: e.target.value }))}
                  placeholder="e.g., 7.5"
                  required
                />
                {getWarning('ph', formData.ph) && (
                  <p className="text-sm text-warning">{getWarning('ph', formData.ph)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperatureCelsius">Temperature °C (Safe: {t.temperature.min} - {t.temperature.max})</Label>
                <Input
                  id="temperatureCelsius"
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={formData.temperatureCelsius}
                  onChange={(e) => setFormData(prev => ({ ...prev, temperatureCelsius: e.target.value }))}
                  placeholder="e.g., 27.5"
                  required
                />
                {getWarning('temperatureCelsius', formData.temperatureCelsius) && (
                  <p className="text-sm text-warning">{getWarning('temperatureCelsius', formData.temperatureCelsius)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dissolvedOxygenMgL">Dissolved Oxygen mg/L (Safe: &gt; {t.dissolvedOxygen.min})</Label>
                <Input
                  id="dissolvedOxygenMgL"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.dissolvedOxygenMgL}
                  onChange={(e) => setFormData(prev => ({ ...prev, dissolvedOxygenMgL: e.target.value }))}
                  placeholder="e.g., 6.5"
                  required
                />
                {getWarning('dissolvedOxygenMgL', formData.dissolvedOxygenMgL) && (
                  <p className="text-sm text-warning">{getWarning('dissolvedOxygenMgL', formData.dissolvedOxygenMgL)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ammoniaMgL">Ammonia mg/L (Safe: &lt; {t.ammonia.max})</Label>
                <Input
                  id="ammoniaMgL"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.ammoniaMgL}
                  onChange={(e) => setFormData(prev => ({ ...prev, ammoniaMgL: e.target.value }))}
                  placeholder="e.g., 0.01"
                  required
                />
                {getWarning('ammoniaMgL', formData.ammoniaMgL) && (
                  <p className="text-sm text-warning">{getWarning('ammoniaMgL', formData.ammoniaMgL)}</p>
                )}
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
                  disabled={isSubmitting || !formData.batchId || !formData.ph || !formData.temperatureCelsius || !formData.dissolvedOxygenMgL || !formData.ammoniaMgL}
                >
                  {isSubmitting ? 'Recording...' : 'Record Reading'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Water Quality Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.batchId} 
                  className={`p-3 rounded-md border ${
                    alert.severity === 'critical' 
                      ? 'bg-destructive/10 border-destructive/20' 
                      : 'bg-warning/10 border-warning/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className={`font-medium ${alert.severity === 'critical' ? 'text-destructive' : 'text-warning'}`}>
                      {alert.species}
                    </p>
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'warning'}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {alert.issues.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safe Ranges Reference */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Safe Ranges</CardTitle>
          <CardDescription>Optimal water quality parameters for fish</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">pH Level</p>
              <p className="text-lg">{t.ph.min} - {t.ph.max}</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Temperature</p>
              <p className="text-lg">{t.temperature.min}°C - {t.temperature.max}°C</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Dissolved Oxygen</p>
              <p className="text-lg">&gt; {t.dissolvedOxygen.min} mg/L</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Ammonia</p>
              <p className="text-lg">&lt; {t.ammonia.max} mg/L</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records */}
      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Droplets className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No water quality records</h3>
            <p className="text-muted-foreground mb-4">Start monitoring your pond water</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Reading
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Water Quality Records</CardTitle>
            <CardDescription>Recent water quality measurements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {records.map((record) => {
                const ph = parseFloat(record.ph)
                const temp = parseFloat(record.temperatureCelsius)
                const oxygen = parseFloat(record.dissolvedOxygenMgL)
                const ammonia = parseFloat(record.ammoniaMgL)
                
                const hasIssue = 
                  ph < t.ph.min || ph > t.ph.max ||
                  temp < t.temperature.min || temp > t.temperature.max ||
                  oxygen < t.dissolvedOxygen.min ||
                  ammonia > t.ammonia.max

                return (
                  <div key={record.id} className={`p-4 border rounded-lg ${hasIssue ? 'border-warning' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium capitalize">{record.species}</span>
                      </div>
                      <Badge variant="outline">{new Date(record.date).toLocaleDateString()}</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">pH</p>
                        <p className={`font-medium ${ph < t.ph.min || ph > t.ph.max ? 'text-warning' : ''}`}>{ph.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Temp</p>
                        <p className={`font-medium ${temp < t.temperature.min || temp > t.temperature.max ? 'text-warning' : ''}`}>{temp.toFixed(1)}°C</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">DO</p>
                        <p className={`font-medium ${oxygen < t.dissolvedOxygen.min ? 'text-warning' : ''}`}>{oxygen.toFixed(1)} mg/L</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ammonia</p>
                        <p className={`font-medium ${ammonia > t.ammonia.max ? 'text-warning' : ''}`}>{ammonia.toFixed(3)} mg/L</p>
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
