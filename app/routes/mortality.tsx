import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { AlertTriangle, Plus, TrendingDown, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getMortalityAlerts, recordMortality } from '~/lib/mortality/server'
import { getBatches } from '~/lib/batches/server'
import { requireAuth } from '~/lib/auth/server-middleware'
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

interface Alert {
  type: 'high_mortality' | 'low_stock'
  batchId: string
  batchSpecies: string
  severity: 'critical' | 'warning'
  message: string
  quantity: number
  rate: number
}

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

interface MortalityData {
  alerts: Array<Alert>
  batches: Array<Batch>
}

const MORTALITY_CAUSES = [
  { value: 'disease', label: 'Disease' },
  { value: 'predator', label: 'Predator Attack' },
  { value: 'weather', label: 'Weather/Environment' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'other', label: 'Other' },
]

const getMortalityForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId?: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [alerts, allBatches] = await Promise.all([
        getMortalityAlerts(session.user.id, data.farmId),
        getBatches(session.user.id, data.farmId),
      ])
      const batches = allBatches.filter((b) => b.status === 'active')
      return { alerts, batches }
    } catch (err) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

const recordMortalityAction = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
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
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/mortality')({
  component: MortalityPage,
})

function MortalityPage() {
  const { selectedFarmId } = useFarm()
  const [data, setData] = useState<MortalityData>({ alerts: [], batches: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    batchId: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    cause: '' as 'disease' | 'predator' | 'weather' | 'unknown' | 'other' | '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getMortalityForFarm({
        data: { farmId: selectedFarmId || undefined },
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
      quantity: '',
      date: new Date().toISOString().split('T')[0],
      cause: '',
      notes: '',
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId || !formData.cause) return

    setIsSubmitting(true)
    setError('')

    try {
      await recordMortalityAction({
        data: {
          batchId: formData.batchId,
          quantity: parseInt(formData.quantity),
          date: formData.date,
          cause: formData.cause,
          notes: formData.notes || undefined,
        },
      })
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to record mortality',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const { alerts, batches } = data
  const selectedBatch = batches.find((b) => b.id === formData.batchId)

  if (batches.length === 0 && alerts.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Mortality Tracking</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and record livestock mortality
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Mortality
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No data available</h3>
            <p className="text-muted-foreground">
              There are no active batches or mortality alerts to display.
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
            <h1 className="text-3xl font-bold">Mortality Tracking</h1>
            <p className="text-muted-foreground mt-1">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  const criticalAlerts = alerts.filter(
    (alert: Alert) => alert.severity === 'critical',
  )
  const warningAlerts = alerts.filter(
    (alert: Alert) => alert.severity === 'warning',
  )

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mortality Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and record livestock mortality
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Mortality
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Mortality</DialogTitle>
              <DialogDescription>
                Log livestock mortality for a batch
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
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.species} ({batch.currentQuantity}{' '}
                        {batch.livestockType})
                        {(batch as any).farmName &&
                          ` - ${(batch as any).farmName}`}
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
                  max={selectedBatch?.currentQuantity || 1000}
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  placeholder="Number of deaths"
                  required
                />
                {selectedBatch && (
                  <p className="text-sm text-muted-foreground">
                    Max: {selectedBatch.currentQuantity} (current in batch)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cause">Cause</Label>
                <Select
                  value={formData.cause}
                  onValueChange={(value) =>
                    value &&
                    setFormData((prev) => ({ ...prev, cause: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      {formData.cause
                        ? MORTALITY_CAUSES.find(
                          (c) => c.value === formData.cause,
                        )?.label
                        : 'Select cause'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MORTALITY_CAUSES.map((cause) => (
                      <SelectItem key={cause.value} value={cause.value}>
                        {cause.label}
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

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Additional details"
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
                    !formData.quantity ||
                    !formData.cause
                  }
                >
                  {isSubmitting ? 'Recording...' : 'Record Mortality'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Summary */}
      <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
            <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Critical Alerts
            </CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold text-destructive">
              {criticalAlerts.length}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
            <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Warning Alerts
            </CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold text-warning">
              {warningAlerts.length}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Monitor closely
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
            <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Alerts
            </CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{alerts.length}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Active monitoring alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No alerts</h3>
            <p className="text-muted-foreground mb-4">
              All batches are within normal mortality ranges
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Mortality
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Alerts</h2>

          {criticalAlerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Critical Alerts
              </h3>
              {criticalAlerts.map((alert: Alert, index: number) => (
                <Card key={`critical-${index}`} className="border-destructive">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg capitalize">
                          {alert.batchSpecies}
                        </CardTitle>
                        <CardDescription className="text-destructive">
                          {alert.message}
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">Critical</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {alert.type === 'high_mortality'
                          ? 'Recent Deaths'
                          : 'Remaining Stock'}
                        : {alert.quantity.toLocaleString()}
                      </div>
                      <Button size="sm" onClick={() => setDialogOpen(true)}>
                        Record Mortality
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {warningAlerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-warning flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Warning Alerts
              </h3>
              {warningAlerts.map((alert: Alert, index: number) => (
                <Card key={`warning-${index}`} className="border-warning">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg capitalize">
                          {alert.batchSpecies}
                        </CardTitle>
                        <CardDescription className="text-warning">
                          {alert.message}
                        </CardDescription>
                      </div>
                      <Badge variant="warning">Warning</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {alert.type === 'high_mortality'
                          ? 'Recent Deaths'
                          : 'Remaining Stock'}
                        : {alert.quantity.toLocaleString()}
                      </div>
                      <Button size="sm" onClick={() => setDialogOpen(true)}>
                        Record Mortality
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common mortality tracking tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4"
              onClick={() => setDialogOpen(true)}
            >
              <div className="text-center">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2" />
                <div className="font-medium text-sm">Record Mortality</div>
                <div className="text-[10px] text-muted-foreground hidden sm:block">
                  Add new mortality record
                </div>
              </div>
            </Button>

            <Link to="/batches">
              <Button variant="outline" className="h-auto p-3 sm:p-4 w-full">
                <div className="text-center">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2" />
                  <div className="font-medium text-sm">View Batches</div>
                  <div className="text-[10px] text-muted-foreground hidden sm:block">
                    Monitor active batches
                  </div>
                </div>
              </Button>
            </Link>

            <Link to="/reports">
              <Button
                variant="outline"
                className="h-auto p-3 sm:p-4 w-full col-span-2 sm:col-span-1"
              >
                <div className="text-center">
                  <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2" />
                  <div className="font-medium text-sm">Mortality Report</div>
                  <div className="text-[10px] text-muted-foreground hidden sm:block">
                    Generate detailed reports
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
