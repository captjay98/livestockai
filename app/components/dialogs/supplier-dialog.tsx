import { toast } from 'sonner'
import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Truck } from 'lucide-react'
import { createSupplierFn } from '~/features/suppliers/server'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
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

const SUPPLIER_TYPES = [
  { value: 'hatchery', label: 'Hatchery' },
  { value: 'feed_mill', label: 'Feed Mill' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'fingerlings', label: 'Fingerlings' },
  { value: 'other', label: 'Other' },
]

interface SupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupplierDialog({ open, onOpenChange }: SupplierDialogProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    products: '',
    supplierType: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await createSupplierFn({
        data: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          location: formData.location || null,
          products: formData.products
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean),
          supplierType: formData.supplierType
            ? (formData.supplierType as
                | 'hatchery'
                | 'feed_mill'
                | 'pharmacy'
                | 'equipment'
                | 'fingerlings'
                | 'other')
            : null,
        },
      })
      toast.success('Supplier created')
      onOpenChange(false)
      setFormData({
        name: '',
        phone: '',
        email: '',
        location: '',
        products: '',
        supplierType: '',
      })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create supplier')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Add Supplier
          </DialogTitle>
          <DialogDescription>
            Add a new supplier to your contacts
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Supplier name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="08012345678"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="supplier@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="City or address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="products">Products (comma-separated)</Label>
            <Input
              id="products"
              value={formData.products}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, products: e.target.value }))
              }
              placeholder="Feed, Vaccines, Equipment"
            />
          </div>

          <div className="space-y-2">
            <Label>Supplier Type</Label>
            <Select
              value={formData.supplierType || undefined}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, supplierType: value || '' }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {formData.supplierType
                    ? SUPPLIER_TYPES.find(
                        (t) => t.value === formData.supplierType,
                      )?.label
                    : 'Select type'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SUPPLIER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.phone}
            >
              {isSubmitting ? 'Creating...' : 'Add Supplier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
