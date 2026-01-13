import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { ArrowLeft, Pill, Syringe } from 'lucide-react'
import {
  createTreatment,
  createVaccination,
} from '~/features/vaccinations/server'
import { getBatches as getBatchesServer } from '~/features/batches/server'
import { requireAuth } from '~/features/auth/server-middleware'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

const getBatches = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const batches = await getBatchesServer(session.user.id, data.farmId)
      return batches.filter((b) => b.status === 'active')
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

const createVaccinationAction = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      farmId: string
      batchId: string
      vaccineName: string
      dateAdministered: string
      dosage: string
      nextDueDate?: string
    }) => data,
  )
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
  .inputValidator(
    (data: {
      farmId: string
      batchId: string
      medicationName: string
      reason: string
      date: string
      dosage: string
      withdrawalDays: number
    }) => data,
  )
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

interface NewVaccinationSearchParams {
  farmId?: string
}

export const Route = createFileRoute('/_auth/vaccinations/new')({
  component: NewVaccinationPage,
  validateSearch: (
    search: Record<string, unknown>,
  ): NewVaccinationSearchParams => ({
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }),
  loaderDeps: ({ search }) => ({ farmId: search.farmId }),
  loader: async ({ deps }) => {
    if (deps.farmId) {
      return getBatches({ data: { farmId: deps.farmId } })
    }
    return []
  },
})

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

function NewVaccinationPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const batches = // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  Route.useLoaderData() as Array<Batch>

  const [recordType, setRecordType] = useState<'vaccination' | 'treatment'>(
    'vaccination',
  )
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.farmId) return

    setIsSubmitting(true)
    setError('')

    try {
      if (recordType === 'vaccination') {
        await createVaccinationAction({
          data: {
            farmId: search.farmId,
            batchId: formData.batchId,
            vaccineName: formData.name,
            dateAdministered: formData.date,
            dosage: formData.dosage,
            nextDueDate: formData.nextDueDate || undefined,
          },
        })
      } else {
        await createTreatmentAction({
          data: {
            farmId: search.farmId,
            batchId: formData.batchId,
            medicationName: formData.name,
            reason: formData.reason,
            date: formData.date,
            dosage: formData.dosage,
            withdrawalDays: parseInt(formData.withdrawalDays),
          },
        })
      }
      router.navigate({
        to: '/vaccinations',
        search: {},
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create record')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add Health Record</h1>
          <p className="text-muted-foreground mt-1">
            Record vaccination or treatment
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Type</CardTitle>
          <CardDescription>Select the type of health record</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="batchId">Batch</Label>
              <Select
                value={formData.batchId}
                onValueChange={(value) =>
                  value && setFormData((prev) => ({ ...prev, batchId: value }))
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
                      {batch.species} ({batch.currentQuantity}{' '}
                      {batch.livestockType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                {recordType === 'vaccination'
                  ? 'Vaccine Name'
                  : 'Medication Name'}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={
                  recordType === 'vaccination'
                    ? 'e.g., Newcastle Disease Vaccine'
                    : 'e.g., Oxytetracycline'
                }
                required
              />
            </div>

            {recordType === 'treatment' && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Treatment</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, reason: e.target.value }))
                  }
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dosage: e.target.value }))
                }
                placeholder="e.g., 0.5ml per bird"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">
                {recordType === 'vaccination'
                  ? 'Date Administered'
                  : 'Treatment Date'}
              </Label>
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

            {recordType === 'vaccination' && (
              <div className="space-y-2">
                <Label htmlFor="nextDueDate">Next Due Date (Optional)</Label>
                <Input
                  id="nextDueDate"
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nextDueDate: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      withdrawalDays: e.target.value,
                    }))
                  }
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

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.history.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.batchId ||
                  !formData.name ||
                  !formData.dosage
                }
              >
                {isSubmitting ? 'Saving...' : 'Save Record'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
