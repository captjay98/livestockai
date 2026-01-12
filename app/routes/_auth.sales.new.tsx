import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import type { PaymentMethod, PaymentStatus, UnitType } from '~/lib/sales/server'
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  UNIT_TYPES,
  createSale,
} from '~/lib/sales/server'
import { getBatchesFn } from '~/lib/batches/server'
import { getCustomersFn } from '~/lib/customers/server'
import { requireAuth } from '~/lib/auth/server-middleware'
import { formatCurrency } from '~/lib/currency'
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

interface Customer {
  id: string
  name: string
  phone: string
}

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
}

const getFormData = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      await requireAuth()
      const [batches, customers] = await Promise.all([
        getBatchesFn({ data: { farmId: data.farmId } }),
        getCustomersFn(),
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
      notes?: string
      // Enhanced fields
      unitType?: string
      ageWeeks?: number
      averageWeightKg?: number
      paymentStatus?: string
      paymentMethod?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const result = await createSale(session.user.id, {
        farmId: data.farmId,
            batchId: data.batchId || null,
            customerId: data.customerId || null,
            livestockType: data.livestockType as 'poultry' | 'fish' | 'eggs',
            quantity: data.quantity,
            unitPrice: data.unitPrice,
            date: new Date(data.date),
            notes: data.notes || null,
            // Enhanced fields
            unitType: data.unitType ? (data.unitType as UnitType) : null,
            ageWeeks: data.ageWeeks || null,
            averageWeightKg: data.averageWeightKg || null,
            paymentStatus: data.paymentStatus
              ? (data.paymentStatus as PaymentStatus)
              : 'paid',
            paymentMethod: data.paymentMethod
              ? (data.paymentMethod as PaymentMethod)
              : null,
        })
      return { success: true, id: result }
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
      return await getFormData({ data: { farmId: deps.farmId } })
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
    notes: '',
    // Enhanced fields
    unitType: '' as UnitType | '',
    ageWeeks: '',
    averageWeightKg: '',
    paymentStatus: 'paid' as PaymentStatus,
    paymentMethod: '' as PaymentMethod | '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

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
          notes: formData.notes || undefined,
          // Enhanced fields
          unitType: formData.unitType || undefined,
          ageWeeks: formData.ageWeeks ? parseInt(formData.ageWeeks) : undefined,
          averageWeightKg: formData.averageWeightKg
            ? parseFloat(formData.averageWeightKg)
            : undefined,
          paymentStatus: formData.paymentStatus,
          paymentMethod: formData.paymentMethod || undefined,
        }
      })
      toast.success('Sale recorded successfully!')
      router.navigate({ to: '/sales', search: {} })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to record sale'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedBatch = batches.find((b: Batch) => b.id === formData.batchId)
  const filteredBatches = batches.filter(
    (b: Batch) =>
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
                onValueChange={(value: string | null) =>
                  value &&
                  setFormData((prev) => ({
                    ...prev,
                    livestockType: value as 'poultry' | 'fish' | 'eggs',
                    batchId: '',
                  }))
                }
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
                    onValueChange={(value: string | null) =>
                      setFormData((prev) => ({ ...prev, batchId: value || '' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {formData.batchId
                          ? filteredBatches.find(
                              (b: Batch) => b.id === formData.batchId,
                            )?.species
                          : 'Select batch to deduct from'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBatches.map((batch: any) => (
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
                onValueChange={(value: string | null) =>
                  setFormData((prev) => ({ ...prev, customerId: value || '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.customerId
                      ? customers.find((c: Customer) => c.id === formData.customerId)
                          ?.name
                      : 'Select customer'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer: any) => (
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

            {/* Payment Status - Always visible */}
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(value: string | null) =>
                  value &&
                  setFormData((prev) => ({
                    ...prev,
                    paymentStatus: value as PaymentStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {PAYMENT_STATUSES.find(s => s.value === formData.paymentStatus)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Options Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {showAdvanced ? 'Hide' : 'Show'} additional details
            </button>

            {/* Advanced Fields */}
            {showAdvanced && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unit Type</Label>
                    <Select
                      value={formData.unitType || undefined}
                      onValueChange={(value: string | null) =>
                        setFormData((prev) => ({
                          ...prev,
                          unitType: value as UnitType,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {formData.unitType
                            ? UNIT_TYPES.find(u => u.value === formData.unitType)?.label
                            : 'Select unit type'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_TYPES.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={formData.paymentMethod || undefined}
                      onValueChange={(value: string | null) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: value as PaymentMethod,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {formData.paymentMethod
                            ? PAYMENT_METHODS.find(m => m.value === formData.paymentMethod)?.label
                            : 'Select method'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age at Sale (weeks)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.ageWeeks}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          ageWeeks: e.target.value,
                        }))
                      }
                      placeholder="e.g., 8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Avg Weight (kg)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.averageWeightKg}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          averageWeightKg: e.target.value,
                        }))
                      }
                      placeholder="e.g., 2.5"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Additional notes about this sale"
                  />
                </div>
              </div>
            )}

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
                    <span>{formatCurrency(parseFloat(formData.unitPrice))}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(totalAmount)}</span>
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
