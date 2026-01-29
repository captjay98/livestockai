import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bird,
  Fish,
  Hammer,
  Megaphone,
  Package,
  Pill,
  Settings,
  Truck,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { EXPENSE_CATEGORIES } from '~/features/expenses/server'

interface Batch {
  id: string
  species: string
  currentQuantity: number
}

interface Supplier {
  id: string
  name: string
}

interface Expense {
  id: string
  category: string
  amount: string
  date: Date
  description: string
  batchId?: string | null
  supplierId?: string | null
  isRecurring: boolean
}

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<void>
  batches: Array<Batch>
  suppliers: Array<Supplier>
  currencySymbol: string
  isSubmitting: boolean
  initialData?: Expense | null
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  feed: <Package className="h-4 w-4" />,
  medicine: <Pill className="h-4 w-4" />,
  equipment: <Wrench className="h-4 w-4" />,
  utilities: <Zap className="h-4 w-4" />,
  labor: <Users className="h-4 w-4" />,
  transport: <Truck className="h-4 w-4" />,
  livestock: <Bird className="h-4 w-4" />,
  livestock_chicken: <Bird className="h-4 w-4" />,
  livestock_fish: <Fish className="h-4 w-4" />,
  maintenance: <Hammer className="h-4 w-4" />,
  marketing: <Megaphone className="h-4 w-4" />,
  other: <Settings className="h-4 w-4" />,
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  batches,
  suppliers,
  currencySymbol,
  isSubmitting,
  initialData,
}: ExpenseFormDialogProps) {
  const { t } = useTranslation(['expenses', 'common'])
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    batchId: '',
    supplierId: '',
    isRecurring: false,
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category,
        amount: initialData.amount,
        date: new Date(initialData.date).toISOString().split('T')[0],
        description: initialData.description,
        batchId: initialData.batchId || '',
        supplierId: initialData.supplierId || '',
        isRecurring: initialData.isRecurring,
      })
    } else {
      setFormData({
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        batchId: '',
        supplierId: '',
        isRecurring: false,
      })
    }
    setError('')
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? t('dialog.editTitle') : t('dialog.recordTitle')}
          </DialogTitle>
          <DialogDescription>
            {initialData ? t('dialog.editDesc') : t('dialog.recordDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">{t('labels.category')}</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                value &&
                setFormData((prev) => ({
                  ...prev,
                  category: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('placeholders.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      {CATEGORY_ICONS[cat.value] || (
                        <Settings className="h-4 w-4" />
                      )}
                      {t('categories.' + cat.value, {
                        defaultValue: cat.label,
                      })}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!initialData && (
            <>
              {batches.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="batchId">
                    {t('labels.batch')} ({t('common.optional')})
                  </Label>
                  <Select
                    value={formData.batchId || 'none'}
                    onValueChange={(value) =>
                      value &&
                      setFormData((prev) => ({
                        ...prev,
                        batchId: value === 'none' ? '' : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('placeholders.selectBatch')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {t('placeholders.selectBatch')}
                      </SelectItem>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.species} ({batch.currentQuantity} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {suppliers.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="supplierId">
                    {t('labels.supplier')} ({t('common.optional')})
                  </Label>
                  <Select
                    value={formData.supplierId || 'none'}
                    onValueChange={(value) =>
                      value &&
                      setFormData((prev) => ({
                        ...prev,
                        supplierId: value === 'none' ? '' : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('placeholders.selectSupplier')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {t('placeholders.selectSupplier')}
                      </SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                {t('labels.amount')} ({currencySymbol})
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">{t('labels.date')}</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('labels.description')}</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder={t('placeholders.description')}
              required
            />
          </div>

          {!initialData && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isRecurring: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              <Label htmlFor="isRecurring" className="text-sm">
                {t('labels.isRecurring')}
              </Label>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.amount || !formData.category}
            >
              {isSubmitting
                ? t('common.saving')
                : initialData
                  ? t('common.save')
                  : t('record')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
