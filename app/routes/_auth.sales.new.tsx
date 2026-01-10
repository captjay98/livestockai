import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { createSale } from '~/lib/sales/server'
import { getBatches } from '~/lib/batches/server'
import { getCustomers } from '~/lib/customers/server'
import { requireAuth } from '~/lib/auth/server-middleware'
import { formatNaira } from '~/lib/currency'
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

interface Customer {
  id: string
  name: string
  phone: string
}

const getFormData = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [batches, customers] = await Promise.all([
        getBatches(session.user.id, data.farmId),
        getCustomers(),
      ])
      return {
        batches: batches.filter((b) => b.status === 'active'),
        customers,
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

const createSaleAction = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      farmId: string
      batchId?: string
      customerId?: string
      livestockType: string
      quantity: number
      unitPrice: number
      date: string
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const id = await createSale(session.user.id, {
        farmId: data.farmId,
        batchId: data.batchId || null,
        customerId: data.customerId || null,
        livestockType: data.livestockType as any,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
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

interface NewSaleSearchParams {
  farmId?: string
}

export const Route = createFileRoute('/_auth/sales/new')({
  component: NewSalePage,
  validateSearch: (search: Record<string, unknown>): NewSaleSearchParams => ({
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }),
  loaderDeps: ({ search }) => ({ farmId: search.farmId }),
  loader: async ({ deps }) => {
    if (deps.farmId) {
      return getFormData({ data: { farmId: deps.farmId } })
    }
    return { batches: [], customers: [] }
  },
})

function NewSalePage() {
  const router = useRouter()
  const search = Route.useSearch()
  const { batches, customers } = Route.useLoaderData()

  const [formData, setFormData] = useState({
    livestockType: 'poultry' as 'poultry' | 'fish' | 'eggs',
    batchId: '',
    customerId: '',
    quantity: '',
    unitPrice: '',
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
      await createSaleAction({
        data: {
          farmId: search.farmId,
          batchId: formData.batchId || undefined,
          customerId: formData.customerId || undefined,
          livestockType: formData.livestockType,
          quantity: parseInt(formData.quantity),
          unitPrice: parseFloat(formData.unitPrice),
          date: formData.date,
        },
      })
      router.navigate({ to: '/sales', search: { farmId: search.farmId } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedBatch = batches.find((b) => b.id === formData.batchId)
  const filteredBatches = batches.filter(
    (b) =>
      formData.livestockType === 'eggs' ||
      b.livestockType === formData.livestockType,
  )
  const totalAmount =
    formData.quantity && formData.unitPrice
      ? parseInt(formData.quantity) * parseFloat(formData.unitPrice)
      : 0

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Record Sale</h1>
          <p className="text-muted-foreground mt-1">
            Log a new sale transaction
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sale Details</CardTitle>
          <CardDescription>Enter the sale information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="livestockType">Product Type</Label>
              <Select
                value={formData.livestockType}
                onValueChange={(value) =>
                  value &&
                  setFormData((prev) => ({
                    ...prev,
                    livestockType: value as any,
                    batchId: '',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poultry">Poultry</SelectItem>
                  <SelectItem value="fish">Fish</SelectItem>
                  <SelectItem value="eggs">Eggs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.livestockType !== 'eggs' &&
              filteredBatches.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="batchId">Batch (Optional)</Label>
                  <Select
                    value={formData.batchId || undefined}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, batchId: value || '' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {formData.batchId
                          ? filteredBatches.find(
                            (b) => b.id === formData.batchId,
                          )?.species
                          : 'Select batch to deduct from'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBatches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.species} ({batch.currentQuantity} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            <div className="space-y-2">
              <Label htmlFor="customerId">Customer (Optional)</Label>
              <Select
                value={formData.customerId || undefined}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, customerId: value || '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.customerId
                      ? customers.find((c) => c.id === formData.customerId)
                        ?.name
                      : 'Select customer'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phone})
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
                max={selectedBatch?.currentQuantity}
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
                placeholder="Number of units sold"
                required
              />
              {selectedBatch && (
                <p className="text-sm text-muted-foreground">
                  Max: {selectedBatch.currentQuantity} available
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price (₦)</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    unitPrice: e.target.value,
                  }))
                }
                placeholder="Price per unit in Naira"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Sale Date</Label>
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

            {totalAmount > 0 && (
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2">Sale Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span>
                      {parseInt(formData.quantity || '0').toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unit Price:</span>
                    <span>{formatNaira(formData.unitPrice)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total Amount:</span>
                    <span>{formatNaira(totalAmount)}</span>
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
                  isSubmitting || !formData.quantity || !formData.unitPrice
                }
              >
                {isSubmitting ? 'Recording...' : 'Record Sale'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
