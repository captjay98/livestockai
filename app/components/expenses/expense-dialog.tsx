import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt } from 'lucide-react'
import { toast } from 'sonner'
import type { ExpenseCategory } from '~/features/expenses/server'
import { logger } from '~/lib/logger'
import { EXPENSE_CATEGORIES } from '~/features/expenses/server'
import { useExpenseMutations } from '~/features/expenses/mutations'
import { getSuppliersFn } from '~/features/suppliers/server'
import { useFormatCurrency } from '~/features/settings'
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
  const { t } = useTranslation(['expenses', 'common', 'suppliers'])
  const { createExpense } = useExpenseMutations()
  const { symbol: currencySymbol } = useFormatCurrency()
  const [suppliers, setSuppliers] = useState<Array<Supplier>>([])
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    supplierId: '',
    isRecurring: false,
  })
  const [error, setError] = useState('')

  // Load suppliers when dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (isOpen) {
      try {
        const suppliersData = await getSuppliersFn({
          data: { farmId: undefined },
        })
        setSuppliers(suppliersData)
      } catch (err) {
        logger.error('Failed to load suppliers:', err)
        toast.error(
          t('common:errors.operationFailed', {
            defaultValue: 'Operation failed',
          }),
        )
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    createExpense.mutate(
      {
        expense: {
          farmId,
          category: formData.category as ExpenseCategory,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date),
          description: formData.description,
          supplierId: formData.supplierId || undefined,
        },
      },
      {
        onSuccess: () => {
          handleOpenChange(false)
          setFormData({
            category: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            supplierId: '',
            isRecurring: false,
          })
        },
        onError: (err) =>
          setError(
            err instanceof Error
              ? err.message
              : t('messages.recordError', {
                  defaultValue: 'Failed to record expense',
                }),
          ),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t('recordExpense', { defaultValue: 'Record Expense' })}
          </DialogTitle>
          <DialogDescription>
            {t('recordDescription', {
              defaultValue: 'Log a new expense transaction',
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="category"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('labels.category', { defaultValue: 'Category' })}
            </Label>
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
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                <SelectValue>
                  {formData.category
                    ? EXPENSE_CATEGORIES.find(
                        (c) => c.value === formData.category,
                      )?.label
                    : t('placeholders.selectCategory', {
                        defaultValue: 'Select category',
                      })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {t(`categories.${cat.value}`, {
                      defaultValue: cat.label,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('common:description', {
                defaultValue: 'Description',
              })}
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder={t('placeholders.description', {
                defaultValue: 'e.g., 50 bags of starter feed',
              })}
              required
              className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label
                htmlFor="amount"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
              >
                {t('common:amount', {
                  symbol: currencySymbol,
                  defaultValue: 'Amount ({{symbol}})',
                })}
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
                placeholder={t('placeholders.amount', {
                  defaultValue: '0.00',
                })}
                required
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="date"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
              >
                {t('common:date', { defaultValue: 'Date' })}
              </Label>
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
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              />
            </div>
          </div>

          {suppliers.length > 0 && (
            <div className="space-y-2">
              <Label
                htmlFor="supplierId"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
              >
                {t('suppliers:supplierOptional', {
                  defaultValue: 'Supplier (Optional)',
                })}
              </Label>
              <Select
                value={formData.supplierId || undefined}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    supplierId: value || '',
                  }))
                }
              >
                <SelectTrigger
                  className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                  style={{ color: 'var(--text-landing-primary)' }}
                >
                  <SelectValue>
                    {formData.supplierId
                      ? suppliers.find((s) => s.id === formData.supplierId)
                          ?.name
                      : t('suppliers:selectSupplier', {
                          defaultValue: 'Select supplier',
                        })}
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
              className="h-4 w-4 rounded border-input"
            />
            {t('labels.isRecurring', {
              defaultValue: 'This is a recurring expense',
            })}
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
              onClick={() => handleOpenChange(false)}
              disabled={createExpense.isPending}
            >
              {t('common:cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              type="submit"
              disabled={
                createExpense.isPending ||
                !formData.category ||
                !formData.amount ||
                !formData.description
              }
            >
              {createExpense.isPending
                ? t('dialog.recording', {
                    defaultValue: 'Recording...',
                  })
                : t('recordExpense', {
                    defaultValue: 'Record Expense',
                  })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
