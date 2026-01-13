import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { User } from 'lucide-react'
import { createCustomerFn } from '~/features/customers/server'
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

const CUSTOMER_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'wholesaler', label: 'Wholesaler' },
]

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerDialog({ open, onOpenChange }: CustomerDialogProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    customerType: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await createCustomerFn({
        data: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          location: formData.location || null,
          customerType: formData.customerType
            ? (formData.customerType as
                | 'individual'
                | 'restaurant'
                | 'retailer'
                | 'wholesaler')
            : null,
        },
      })
      onOpenChange(false)
      setFormData({ name: '', phone: '', email: '', location: '', customerType: '' })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add Customer
          </DialogTitle>
          <DialogDescription>Add a new customer to your contacts</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Customer name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="customer@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="City or address"
            />
          </div>

          <div className="space-y-2">
            <Label>Customer Type</Label>
            <Select
              value={formData.customerType || undefined}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, customerType: value || '' }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {formData.customerType
                    ? CUSTOMER_TYPES.find((t) => t.value === formData.customerType)?.label
                    : 'Select type'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_TYPES.map((type) => (
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name || !formData.phone}>
              {isSubmitting ? 'Creating...' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
