import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ShoppingCart } from 'lucide-react'
import { createSaleFn } from '~/features/sales/server'
import { Button } from '~/components/ui/button'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

// Server function to get batches for the farm
const getBatchesForSaleFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    const { db } = await import('~/lib/db')
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()

    return db
      .selectFrom('batches')
      .select(['id', 'species', 'livestockType', 'currentQuantity'])
      .where('farmId', '=', data.farmId)
      .where('status', '=', 'active')
      .where('currentQuantity', '>', 0)
      .execute()
  })

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
}

interface SaleDialogProps {
  farmId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const LIVESTOCK_TYPES = [
  { value: 'poultry', label: 'Poultry' },
  { value: 'fish', label: 'Fish' },
  { value: 'eggs', label: 'Eggs' },
]

export function SaleDialog({ farmId, open, onOpenChange }: SaleDialogProps) {
  const router = useRouter()
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [formData, setFormData] = useState({
    livestockType: '' as 'poultry' | 'fish' | 'eggs' | '',
    batchId: '',
    quantity: '',
    unitPrice: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load batches when dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (isOpen) {
      try {
        const batchesData = await getBatchesForSaleFn({ data: { farmId } })
        setBatches(batchesData)
      } catch (err) {
        console.error('Failed to load batches:', err)
      }
    }
  }

  // Reset batch when livestock type changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, batchId: '' }))
  }, [formData.livestockType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.livestockType) return
    setIsSubmitting(true)
    setError('')

    try {
      await createSaleFn({
        data: {
          sale: {
            farmId,
            livestockType: formData.livestockType,
            batchId: formData.batchId || null,
            quantity: parseInt(formData.quantity),
            unitPrice: parseFloat(formData.unitPrice),
            date: new Date(formData.date),
            notes: formData.notes || null,
          },
        },
      })
      handleOpenChange(false)
      setFormData({
        livestockType: '',
        batchId: '',
        quantity: '',
        unitPrice: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredBatches =
    formData.livestockType && formData.livestockType !== 'eggs'
      ? batches.filter((b) => b.livestockType === formData.livestockType)
      : []

  const selectedBatch = batches.find((b) => b.id === formData.batchId)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Record Sale
          </DialogTitle>
          <DialogDescription>Record a new sale transaction</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="livestockType">What are you selling?</Label>
            <Select
              value={formData.livestockType}
              onValueChange={(value) =>
                value &&
                setFormData((prev) => ({
                  ...prev,
                  livestockType: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {formData.livestockType
                    ? LIVESTOCK_TYPES.find(
                        (t) => t.value === formData.livestockType,
                      )?.label
                    : 'Select type'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LIVESTOCK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.livestockType &&
            formData.livestockType !== 'eggs' &&
            filteredBatches.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="batchId">
                  Batch (Optional - deducts from stock)
                </Label>
                <Select
                  value={formData.batchId || undefined}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, batchId: value || '' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      {formData.batchId
                        ? `${selectedBatch?.species} (${selectedBatch?.currentQuantity} available)`
                        : 'Select batch (optional)'}
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedBatch?.currentQuantity || undefined}
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
                placeholder="10"
                required
              />
              {selectedBatch && (
                <p className="text-xs text-muted-foreground">
                  Max: {selectedBatch.currentQuantity}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Price/Unit (₦)</Label>
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
                placeholder="1500"
                required
              />
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Customer name, delivery details, etc."
              rows={2}
            />
          </div>

          {formData.quantity && formData.unitPrice && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Total:{' '}
                <span className="text-lg">
                  ₦
                  {(
                    parseInt(formData.quantity) * parseFloat(formData.unitPrice)
                  ).toLocaleString()}
                </span>
              </p>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.livestockType ||
                !formData.quantity ||
                !formData.unitPrice
              }
            >
              {isSubmitting ? 'Recording...' : 'Record Sale'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
