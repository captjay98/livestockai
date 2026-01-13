import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Receipt } from 'lucide-react'
import type { ExpenseCategory } from '~/features/expenses/server'
import { EXPENSE_CATEGORIES, createExpenseFn } from '~/features/expenses/server'
import { getSuppliersFn } from '~/features/suppliers/server'
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

interface Supplier {
  id: string
  name: string
  phone: string
}

interface ExpenseDialogProps {
  farmId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExpenseDialog({
  farmId,
  open,
  onOpenChange,
}: ExpenseDialogProps) {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Array<Supplier>>([])
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    supplierId: '',
    isRecurring: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load suppliers when dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (isOpen) {
      try {
        const suppliersData = await getSuppliersFn()
        setSuppliers(suppliersData)
      } catch (err) {
        console.error('Failed to load suppliers:', err)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await createExpenseFn({
        data: {
          expense: {
            farmId,
            category: formData.category as ExpenseCategory,
            amount: parseFloat(formData.amount),
            date: new Date(formData.date),
            description: formData.description,
            supplierId: formData.supplierId || null,
            isRecurring: formData.isRecurring,
          },
        },
      })
      handleOpenChange(false)
      setFormData({
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        supplierId: '',
        isRecurring: false,
      })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Record Expense
          </DialogTitle>
          <DialogDescription>Log a new expense transaction</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                value && setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {formData.category
                    ? EXPENSE_CATEGORIES.find(
                        (c) => c.value === formData.category,
                      )?.label
                    : 'Select category'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="e.g., 50 bags of starter feed"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="0.00"
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
          </div>

          {suppliers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier (Optional)</Label>
              <Select
                value={formData.supplierId || undefined}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, supplierId: value || '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.supplierId
                      ? suppliers.find((s) => s.id === formData.supplierId)
                          ?.name
                      : 'Select supplier'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                !formData.category ||
                !formData.amount ||
                !formData.description
              }
            >
              {isSubmitting ? 'Recording...' : 'Record Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
