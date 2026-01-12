import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { createWeightSample } from '~/lib/weight/server'
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
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'

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

const createWeightSampleAction = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      farmId: string
      batchId: string
      date: string
      sampleSize: number
      averageWeightKg: number
      minWeightKg?: number | null
      maxWeightKg?: number | null
      notes?: string | null
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const id = await createWeightSample(session.user.id, data.farmId, {
        batchId: data.batchId,
        date: new Date(data.date),
        sampleSize: data.sampleSize,
        averageWeightKg: data.averageWeightKg,
        minWeightKg: data.minWeightKg,
        maxWeightKg: data.maxWeightKg,
        notes: data.notes,
      })
      return { success: true, id }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface NewWeightSearchParams {
  farmId?: string
}

export const Route = createFileRoute('/_auth/weight/new')({
  component: NewWeightPage,
  validateSearch: (search: Record<string, unknown>): NewWeightSearchParams => ({
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

function NewWeightPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const batches = Route.useLoaderData()

  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    sampleSize: '',
    averageWeightKg: '',
    // Enhanced fields
    minWeightKg: '',
    maxWeightKg: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAdditional, setShowAdditional] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.farmId) return

    setIsSubmitting(true)
    setError('')

    try {
      await createWeightSampleAction({
        data: {
          farmId: search.farmId,
          batchId: formData.batchId,
          date: formData.date,
          sampleSize: parseInt(formData.sampleSize),
          averageWeightKg: parseFloat(formData.averageWeightKg),
          minWeightKg: formData.minWeightKg
            ? parseFloat(formData.minWeightKg)
            : null,
          maxWeightKg: formData.maxWeightKg
            ? parseFloat(formData.maxWeightKg)
            : null,
          notes: formData.notes || null,
        },
      })
      router.navigate({ to: '/weight', search: {} })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record weight')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedBatch = batches.find((b: any) => b.id === formData.batchId)

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Record Weight</h1>
          <p className="text-muted-foreground mt-1">
            Log weight sample for a batch
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weight Sample Details</CardTitle>
          <CardDescription>
            Enter the weight measurement information
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                      ? batches.find((b: any) => b.id === formData.batchId)?.species
                      : 'Select batch'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch: any) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.species} ({batch.currentQuantity}{' '}
                      {batch.livestockType})
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
              <Label htmlFor="sampleSize">Sample Size</Label>
              <Input
                id="sampleSize"
                type="number"
                min="1"
                max={selectedBatch?.currentQuantity || 1000}
                value={formData.sampleSize}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sampleSize: e.target.value,
                  }))
                }
                placeholder="Number of animals weighed"
                required
              />
              {selectedBatch && (
                <p className="text-sm text-muted-foreground">
                  Max: {selectedBatch.currentQuantity} (total in batch)
                </p>
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    averageWeightKg: e.target.value,
                  }))
                }
                placeholder="Average weight in kilograms"
                required
              />
            </div>

            {/* Additional Details Section */}
            <Collapsible open={showAdditional} onOpenChange={setShowAdditional}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="w-full justify-between p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                >
                  <span>Weight Range & Notes</span>
                  {showAdditional ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minWeightKg">Min Weight (kg)</Label>
                    <Input
                      id="minWeightKg"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.minWeightKg}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          minWeightKg: e.target.value,
                        }))
                      }
                      placeholder="Smallest in sample"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxWeightKg">Max Weight (kg)</Label>
                    <Input
                      id="maxWeightKg"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.maxWeightKg}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxWeightKg: e.target.value,
                        }))
                      }
                      placeholder="Largest in sample"
                    />
                  </div>
                </div>

                {formData.minWeightKg &&
                  formData.maxWeightKg &&
                  formData.averageWeightKg && (
                    <div className="text-sm text-muted-foreground">
                      Weight range: {formData.minWeightKg} -{' '}
                      {formData.maxWeightKg} kg
                      {(() => {
                        const min = parseFloat(formData.minWeightKg)
                        const max = parseFloat(formData.maxWeightKg)
                        const avg = parseFloat(formData.averageWeightKg)
                        if (min > avg || max < avg) {
                          return (
                            <span className="text-destructive ml-2">
                              (Average should be between min and max)
                            </span>
                          )
                        }
                        // Calculate CV% (Coefficient of Variation)
                        const range = max - min
                        const cv = (range / 2 / avg) * 100
                        return (
                          <span className="ml-2">• CV ≈ {cv.toFixed(1)}%</span>
                        )
                      })()}
                    </div>
                  )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Any observations about this weight sample..."
                    rows={3}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {formData.sampleSize &&
              formData.averageWeightKg &&
              selectedBatch && (
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2">Estimated Totals</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Sample Weight:</span>
                      <span>
                        {(
                          parseInt(formData.sampleSize) *
                          parseFloat(formData.averageWeightKg)
                        ).toFixed(2)}{' '}
                        kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Batch Weight:</span>
                      <span>
                        {(
                          selectedBatch.currentQuantity *
                          parseFloat(formData.averageWeightKg)
                        ).toFixed(2)}{' '}
                        kg
                      </span>
                    </div>
                  </div>
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
                  !formData.sampleSize ||
                  !formData.averageWeightKg
                }
              >
                {isSubmitting ? 'Recording...' : 'Record Weight'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
