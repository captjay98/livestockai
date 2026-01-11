import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { FEED_TYPES, createFeedRecord } from '~/lib/feed/server'
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
      return batches.filter((b) => b.status === 'active')
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
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
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface NewFeedSearchParams {
  farmId?: string
}

export const Route = createFileRoute('/_auth/feed/new')({
  component: NewFeedPage,
  validateSearch: (search: Record<string, unknown>): NewFeedSearchParams => ({
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

function NewFeedPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const batches = Route.useLoaderData()

  const [formData, setFormData] = useState({
    batchId: '',
    feedType: '',
    quantityKg: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.farmId) return

    setIsSubmitting(true)
    setError('')

    try {
      await createFeedRecordAction({
        data: {
          farmId: search.farmId,
          batchId: formData.batchId,
          feedType: formData.feedType,
          quantityKg: parseFloat(formData.quantityKg),
          cost: parseFloat(formData.cost),
          date: formData.date,
        },
      })
      router.navigate({ to: '/feed', search: { farmId: search.farmId } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record feed')
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
          <h1 className="text-3xl font-bold">Record Feed</h1>
          <p className="text-muted-foreground mt-1">
            Log feed consumption for a batch
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feed Details</CardTitle>
          <CardDescription>
            Enter the feed consumption information
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
              <Label htmlFor="feedType">Feed Type</Label>
              <Select
                value={formData.feedType}
                onValueChange={(value) =>
                  value && setFormData((prev) => ({ ...prev, feedType: value }))
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
                  !formData.feedType ||
                  !formData.quantityKg ||
                  !formData.cost
                }
              >
                {isSubmitting ? 'Recording...' : 'Record Feed'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
