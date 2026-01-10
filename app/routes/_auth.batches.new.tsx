import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { createBatch } from '~/lib/batches/server'
import { getSpeciesOptions } from '~/lib/batches/constants'
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

interface CreateBatchInput {
  farmId: string
  livestockType: 'poultry' | 'fish'
  species: string
  initialQuantity: number
  acquisitionDate: string
  costPerUnit: number
}

const createBatchAction = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateBatchInput) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()

      const batchId = await createBatch(session.user.id, {
        farmId: data.farmId,
        livestockType: data.livestockType,
        species: data.species,
        initialQuantity: data.initialQuantity,
        acquisitionDate: new Date(data.acquisitionDate),
        costPerUnit: data.costPerUnit,
      })

      return { success: true, batchId }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface NewBatchSearchParams {
  farmId?: string
}

export const Route = createFileRoute('/_auth/batches/new')({
  component: NewBatchPage,
  validateSearch: (search: Record<string, unknown>): NewBatchSearchParams => ({
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }),
})

function NewBatchPage() {
  const router = useRouter()
  const search = Route.useSearch()

  const [formData, setFormData] = useState({
    farmId: search.farmId || '',
    livestockType: 'poultry' as 'poultry' | 'fish',
    species: '',
    initialQuantity: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    costPerUnit: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const speciesOptions = getSpeciesOptions(formData.livestockType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const result = await createBatchAction({
        data: {
          farmId: formData.farmId,
          livestockType: formData.livestockType,
          species: formData.species,
          initialQuantity: parseInt(formData.initialQuantity),
          acquisitionDate: formData.acquisitionDate,
          costPerUnit: parseFloat(formData.costPerUnit),
        },
      })

      router.navigate({
        to: '/batches',
        search: { farmId: formData.farmId },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLivestockTypeChange = (type: string | null) => {
    if (type && (type === 'poultry' || type === 'fish')) {
      setFormData((prev) => ({
        ...prev,
        livestockType: type,
        species: '',
      }))
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
          <h1 className="text-3xl font-bold">Create New Batch</h1>
          <p className="text-muted-foreground mt-1">
            Add a new livestock batch to your inventory
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch Details</CardTitle>
          <CardDescription>
            Enter the information for your new livestock batch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="livestockType">Livestock Type</Label>
              <Select
                value={formData.livestockType}
                onValueChange={handleLivestockTypeChange}
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.livestockType.charAt(0).toUpperCase() +
                      formData.livestockType.slice(1)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poultry">Poultry</SelectItem>
                  <SelectItem value="fish">Fish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="species">Species</Label>
              <Select
                value={formData.species}
                onValueChange={(value) =>
                  value && setFormData((prev) => ({ ...prev, species: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.species || 'Select species'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {speciesOptions.map((species) => (
                    <SelectItem key={species} value={species}>
                      {species}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialQuantity">Initial Quantity</Label>
              <Input
                id="initialQuantity"
                type="number"
                min="1"
                value={formData.initialQuantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({
                    ...prev,
                    initialQuantity: e.target.value,
                  }))
                }
                placeholder="Enter initial quantity"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerUnit">Cost per Unit (₦)</Label>
              <Input
                id="costPerUnit"
                type="number"
                min="0"
                step="0.01"
                value={formData.costPerUnit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({
                    ...prev,
                    costPerUnit: e.target.value,
                  }))
                }
                placeholder="Enter cost per unit in Naira"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisitionDate">Acquisition Date</Label>
              <Input
                id="acquisitionDate"
                type="date"
                value={formData.acquisitionDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({
                    ...prev,
                    acquisitionDate: e.target.value,
                  }))
                }
                required
              />
            </div>

            {/* Cost Summary */}
            {formData.initialQuantity && formData.costPerUnit && (
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2">Cost Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span>
                      {parseInt(
                        formData.initialQuantity || '0',
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost per Unit:</span>
                    <span>
                      ₦{parseFloat(formData.costPerUnit || '0').toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total Cost:</span>
                    <span>
                      ₦
                      {(
                        parseInt(formData.initialQuantity || '0') *
                        parseFloat(formData.costPerUnit || '0')
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
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
                  !formData.species ||
                  !formData.initialQuantity ||
                  !formData.costPerUnit
                }
              >
                {isSubmitting ? 'Creating...' : 'Create Batch'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
