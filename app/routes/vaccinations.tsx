import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getVaccinationsForFarm, getTreatmentsForFarm, getVaccinationAlerts, createVaccination, createTreatment } from '~/lib/vaccinations/server'
import { getBatchesForFarm } from '~/lib/batches/server'
import { requireAuth } from '~/lib/auth/middleware'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
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
import { Plus, Syringe, Pill, AlertTriangle, Calendar } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useFarm } from '~/components/farm-context'

interface Vaccination {
  id: string
  batchId: string
  vaccineName: string
  dateAdministered: Date
  dosage: string
  nextDueDate: Date | null
  species: string
}

interface Treatment {
  id: string
  batchId: string
  medicationName: string
  reason: string
  date: Date
  dosage: string
  withdrawalDays: number
  species: string
}

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

interface VaccinationData {
  vaccinations: Vaccination[]
  treatments: Treatment[]
  batches: Batch[]
  alerts: { upcoming: any[]; overdue: any[]; totalAlerts: number } | null
}

const getVaccinationDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [vaccinations, treatments, alerts, allBatches] = await Promise.all([
        getVaccinationsForFarm(session.user.id, data.farmId),
        getTreatmentsForFarm(session.user.id, data.farmId),
        getVaccinationAlerts(session.user.id, data.farmId),
        getBatchesForFarm(session.user.id, data.farmId),
      ])
      const batches = allBatches.filter(b => b.status === 'active')
      return { vaccinations, treatments, alerts, batches }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

const createVaccinationAction = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    farmId: string
    batchId: string
    vaccineName: string
    dateAdministered: string
    dosage: string
    nextDueDate?: string
  }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const id = await createVaccination(session.user.id, data.farmId, {
        batchId: data.batchId,
        vaccineName: data.vaccineName,
        dateAdministered: new Date(data.dateAdministered),
        dosage: data.dosage,
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
      })
      return { success: true, id }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

const createTreatmentAction = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    farmId: string
    batchId: string
    medicationName: string
    reason: string
    date: string
    dosage: string
    withdrawalDays: number
  }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const id = await createTreatment(session.user.id, data.farmId, {
        batchId: data.batchId,
        medicationName: data.medicationName,
        reason: data.reason,
        date: new Date(data.date),
        dosage: data.dosage,
        withdrawalDays: data.withdrawalDays,
      })
      return { success: true, id }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/vaccinations')({
  component: VaccinationsPage,
})

function VaccinationsPage() {
  const { selectedFarmId } = useFarm()
  const [data, setData] = useState<VaccinationData>({ vaccinations: [], treatments: [], batches: [], alerts: null })
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [recordType, setRecordType] = useState<'vaccination' | 'treatment'>('vaccination')
  const [formData, setFormData] = useState({
    batchId: '',
    name: '',
    date: new Date().toISOString().split('T')[0],
    dosage: '',
    nextDueDate: '',
    reason: '',
    withdrawalDays: '0',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    if (!selectedFarmId) {
      setData({ vaccinations: [], treatments: [], batches: [], alerts: null })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const result = await getVaccinationDataForFarm({ data: { farmId: selectedFarmId } })
      setData(result)
    } catch (error) {
      console.error('Failed to load vaccination data:', error)
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
      name: '',
      date: new Date().toISOString().split('T')[0],
      dosage: '',
      nextDueDate: '',
      reason: '',
      withdrawalDays: '0',
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) return
    
    setIsSubmitting(true)
    setError('')

    try {
      if (recordType === 'vaccination') {
        await createVaccinationAction({
          data: {
            farmId: selectedFarmId,
            batchId: formData.batchId,
            vaccineName: formData.name,
            dateAdministered: formData.date,
            dosage: formData.dosage,
            nextDueDate: formData.nextDueDate || undefined,
          }
        })
      } else {
        await createTreatmentAction({
          data: {
            farmId: selectedFarmId,
            batchId: formData.batchId,
            medicationName: formData.name,
            reason: formData.reason,
            date: formData.date,
            dosage: formData.dosage,
            withdrawalDays: parseInt(formData.withdrawalDays),
          }
        })
      }
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const { vaccinations, treatments, batches, alerts } = data

  if (!selectedFarmId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Health Management</h1>
            <p className="text-muted-foreground mt-1">Track vaccinations and treatments</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Syringe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farm selected</h3>
            <p className="text-muted-foreground">Select a farm from the sidebar to view health records</p>
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
            <h1 className="text-3xl font-bold">Health Management</h1>
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
          <h1 className="text-3xl font-bold">Health Management</h1>
          <p className="text-muted-foreground mt-1">Track vaccinations and treatments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Health Record</DialogTitle>
              <DialogDescription>Record vaccination or treatment</DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 mb-4">
              <Button
                type="button"
                variant={recordType === 'vaccination' ? 'default' : 'outline'}
                onClick={() => setRecordType('vaccination')}
                className="flex-1"
              >
                <Syringe className="h-4 w-4 mr-2" />
                Vaccination
              </Button>
              <Button
                type="button"
                variant={recordType === 'treatment' ? 'default' : 'outline'}
                onClick={() => setRecordType('treatment')}
                className="flex-1"
              >
                <Pill className="h-4 w-4 mr-2" />
                Treatment
              </Button>
            </div>
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
                <Label htmlFor="name">{recordType === 'vaccination' ? 'Vaccine Name' : 'Medication Name'}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={recordType === 'vaccination' ? 'e.g., Newcastle Disease Vaccine' : 'e.g., Oxytetracycline'}
                  required
                />
              </div>

              {recordType === 'treatment' && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Treatment</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g., Respiratory infection"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                  placeholder="e.g., 0.5ml per bird"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">{recordType === 'vaccination' ? 'Date Administered' : 'Treatment Date'}</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              {recordType === 'vaccination' && (
                <div className="space-y-2">
                  <Label htmlFor="nextDueDate">Next Due Date (Optional)</Label>
                  <Input
                    id="nextDueDate"
                    type="date"
                    value={formData.nextDueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, nextDueDate: e.target.value }))}
                  />
                </div>
              )}

              {recordType === 'treatment' && (
                <div className="space-y-2">
                  <Label htmlFor="withdrawalDays">Withdrawal Period (Days)</Label>
                  <Input
                    id="withdrawalDays"
                    type="number"
                    min="0"
                    value={formData.withdrawalDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, withdrawalDays: e.target.value }))}
                    placeholder="Days before safe for consumption"
                    required
                  />
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
                  disabled={isSubmitting || !formData.batchId || !formData.name || !formData.dosage}
                >
                  {isSubmitting ? 'Saving...' : 'Save Record'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {alerts && alerts.totalAlerts > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Vaccination Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.overdue.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-md border border-destructive/20">
                  <div>
                    <p className="font-medium text-destructive">{alert.vaccineName}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.species} - Due: {new Date(alert.nextDueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="destructive">Overdue</Badge>
                </div>
              ))}
              {alerts.upcoming.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-warning/10 rounded-md border border-warning/20">
                  <div>
                    <p className="font-medium text-warning">{alert.vaccineName}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.species} - Due: {new Date(alert.nextDueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="warning">Upcoming</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vaccinations</CardTitle>
            <Syringe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vaccinations.length}</div>
            <p className="text-xs text-muted-foreground">Total records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treatments</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treatments.length}</div>
            <p className="text-xs text-muted-foreground">Total records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts?.totalAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {alerts?.overdue.length || 0} overdue, {alerts?.upcoming.length || 0} upcoming
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vaccinations List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5" />
            Vaccination History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vaccinations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No vaccination records</p>
          ) : (
            <div className="space-y-4">
              {vaccinations.map((vax) => (
                <div key={vax.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Syringe className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{vax.vaccineName}</p>
                      <p className="text-sm text-muted-foreground">{vax.species} • {vax.dosage}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{new Date(vax.dateAdministered).toLocaleDateString()}</p>
                    {vax.nextDueDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Next: {new Date(vax.nextDueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treatments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Treatment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {treatments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No treatment records</p>
          ) : (
            <div className="space-y-4">
              {treatments.map((treatment) => (
                <div key={treatment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Pill className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{treatment.medicationName}</p>
                      <p className="text-sm text-muted-foreground">{treatment.species} • {treatment.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{new Date(treatment.date).toLocaleDateString()}</p>
                    <Badge variant="outline" className="text-xs">{treatment.withdrawalDays} day withdrawal</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
