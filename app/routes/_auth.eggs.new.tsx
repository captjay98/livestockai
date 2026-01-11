import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { createEggRecord } from '~/lib/eggs/server'
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
      // Only return active poultry batches (layers)
      return batches.filter(
        (b) => b.status === 'active' && b.livestockType === 'poultry',
      )
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

const createEggRecordAction = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      farmId: string
      batchId: string
      date: string
      quantityCollected: number
      quantityBroken: number
      quantitySold: number
    }) => data,
  )
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

interface NewEggSearchParams {
  farmId?: string
}

export const Route = createFileRoute('/_auth/eggs/new')({
  component: NewEggPage,
  validateSearch: (search: Record<string, unknown>): NewEggSearchParams => ({
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

function NewEggPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const batches = Route.useLoaderData()

  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    quantityCollected: '',
    quantityBroken: '0',
    quantitySold: '0',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.farmId) return

    setIsSubmitting(true)
    setError('')

    try {
      await createEggRecordAction({
        data: {
          farmId: search.farmId,
          batchId: formData.batchId,
          date: formData.date,
          quantityCollected: parseInt(formData.quantityCollected),
          quantityBroken: parseInt(formData.quantityBroken) || 0,
          quantitySold: parseInt(formData.quantitySold) || 0,
        },
      })
      router.navigate({ to: '/eggs', search: { farmId: search.farmId } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record eggs')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedBatch = batches.find((b) => b.id === formData.batchId)
  const layingPercentage =
    selectedBatch && formData.quantityCollected
      ? (
          (parseInt(formData.quantityCollected) /
            selectedBatch.currentQuantity) *
          100
        ).toFixed(1)
      : null

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Record Eggs</h1>
          <p className="text-muted-foreground mt-1">Log daily egg production</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Egg Production Details</CardTitle>
          <CardDescription>
            Enter the egg collection information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="batchId">Layer Batch</Label>
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
                      : 'Select layer batch'}
                  </SelectValue>
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantityCollected: e.target.value,
                  }))
                }
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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantityBroken: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantitySold: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </div>
            </div>

            {formData.quantityCollected && (
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2">Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Collected:</span>
                    <span className="text-green-600">
                      +{parseInt(formData.quantityCollected || '0')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Broken:</span>
                    <span className="text-red-600">
                      -{parseInt(formData.quantityBroken || '0')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sold:</span>
                    <span className="text-blue-600">
                      -{parseInt(formData.quantitySold || '0')}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Net to Inventory:</span>
                    <span>
                      {parseInt(formData.quantityCollected || '0') -
                        parseInt(formData.quantityBroken || '0') -
                        parseInt(formData.quantitySold || '0')}
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
                  !formData.quantityCollected
                }
              >
                {isSubmitting ? 'Recording...' : 'Record Eggs'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
