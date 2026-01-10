import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import {
  WATER_QUALITY_THRESHOLDS,
  createWaterQualityRecord,
} from '~/lib/water-quality/server'
import { getBatches as getBatchesServer } from '~/lib/batches/server'
import { requireAuth } from '~/lib/auth/server-middleware'
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

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

const getBatches = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const batches = await getBatchesServer(session.user.id, data.farmId)
      // Only return active fish batches
      return batches.filter(
        (b) => b.status === 'active' && b.livestockType === 'fish',
      )
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

const createWaterQualityAction = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      farmId: string
      batchId: string
      date: string
      ph: number
      temperatureCelsius: number
      dissolvedOxygenMgL: number
      ammoniaMgL: number
    }) => data,
  )
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

interface NewWaterQualitySearchParams {
  farmId?: string
}

export const Route = createFileRoute('/_auth/water-quality/new')({
  component: NewWaterQualityPage,
  validateSearch: (
    search: Record<string, unknown>,
  ): NewWaterQualitySearchParams => ({
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

function NewWaterQualityPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const batches = Route.useLoaderData()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.farmId) return

    setIsSubmitting(true)
    setError('')

    try {
      await createWaterQualityAction({
        data: {
          farmId: search.farmId,
          batchId: formData.batchId,
          date: formData.date,
          ph: parseFloat(formData.ph),
          temperatureCelsius: parseFloat(formData.temperatureCelsius),
          dissolvedOxygenMgL: parseFloat(formData.dissolvedOxygenMgL),
          ammoniaMgL: parseFloat(formData.ammoniaMgL),
        },
      })
      router.navigate({
        to: '/water-quality',
        search: { farmId: search.farmId },
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to record water quality',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const t = WATER_QUALITY_THRESHOLDS

  const getWarning = (field: string, value: string): string | null => {
    if (!value) return null
    const num = parseFloat(value)

    switch (field) {
      case 'ph':
        if (num < t.ph.min) return `Below safe range (min: ${t.ph.min})`
        if (num > t.ph.max) return `Above safe range (max: ${t.ph.max})`
        break
      case 'temperatureCelsius':
        if (num < t.temperature.min)
          return `Below safe range (min: ${t.temperature.min}°C)`
        if (num > t.temperature.max)
          return `Above safe range (max: ${t.temperature.max}°C)`
        break
      case 'dissolvedOxygenMgL':
        if (num < t.dissolvedOxygen.min)
          return `Below safe range (min: ${t.dissolvedOxygen.min} mg/L)`
        break
      case 'ammoniaMgL':
        if (num > t.ammonia.max)
          return `Above safe range (max: ${t.ammonia.max} mg/L)`
        break
    }
    return null
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Record Water Quality</h1>
          <p className="text-muted-foreground mt-1">
            Log pond water parameters
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Water Quality Reading</CardTitle>
          <CardDescription>
            Enter the water quality measurements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="batchId">Fish Pond/Batch</Label>
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
                      : 'Select fish batch'}
                  </SelectValue>
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
                <p className="text-sm text-muted-foreground">
                  No active fish batches found
                </p>
              )}
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
              <Label htmlFor="ph">
                pH Level (Safe: {t.ph.min} - {t.ph.max})
              </Label>
              <Input
                id="ph"
                type="number"
                min="0"
                max="14"
                step="0.1"
                value={formData.ph}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, ph: e.target.value }))
                }
                placeholder="e.g., 7.5"
                required
              />
              {getWarning('ph', formData.ph) && (
                <p className="text-sm text-warning">
                  {getWarning('ph', formData.ph)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperatureCelsius">
                Temperature °C (Safe: {t.temperature.min} - {t.temperature.max})
              </Label>
              <Input
                id="temperatureCelsius"
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={formData.temperatureCelsius}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    temperatureCelsius: e.target.value,
                  }))
                }
                placeholder="e.g., 27.5"
                required
              />
              {getWarning(
                'temperatureCelsius',
                formData.temperatureCelsius,
              ) && (
                  <p className="text-sm text-warning">
                    {getWarning(
                      'temperatureCelsius',
                      formData.temperatureCelsius,
                    )}
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dissolvedOxygenMgL">
                Dissolved Oxygen mg/L (Safe: &gt; {t.dissolvedOxygen.min})
              </Label>
              <Input
                id="dissolvedOxygenMgL"
                type="number"
                min="0"
                step="0.1"
                value={formData.dissolvedOxygenMgL}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dissolvedOxygenMgL: e.target.value,
                  }))
                }
                placeholder="e.g., 6.5"
                required
              />
              {getWarning(
                'dissolvedOxygenMgL',
                formData.dissolvedOxygenMgL,
              ) && (
                  <p className="text-sm text-warning">
                    {getWarning(
                      'dissolvedOxygenMgL',
                      formData.dissolvedOxygenMgL,
                    )}
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ammoniaMgL">
                Ammonia mg/L (Safe: &lt; {t.ammonia.max})
              </Label>
              <Input
                id="ammoniaMgL"
                type="number"
                min="0"
                step="0.001"
                value={formData.ammoniaMgL}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ammoniaMgL: e.target.value,
                  }))
                }
                placeholder="e.g., 0.01"
                required
              />
              {getWarning('ammoniaMgL', formData.ammoniaMgL) && (
                <p className="text-sm text-warning">
                  {getWarning('ammoniaMgL', formData.ammoniaMgL)}
                </p>
              )}
            </div>

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
                  !formData.ph ||
                  !formData.temperatureCelsius ||
                  !formData.dissolvedOxygenMgL ||
                  !formData.ammoniaMgL
                }
              >
                {isSubmitting ? 'Recording...' : 'Record Reading'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
