import { toast } from 'sonner'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'
import type { PaymentMethod, PaymentStatus } from '~/features/sales/server'
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  createSaleFn,
} from '~/features/sales/server'
import { useFormatCurrency } from '~/features/settings'
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

// Server function to get batches and customers for the farm
const getSaleFormDataFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    const { db } = await import('~/lib/db')
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()

    const [batches, customers] = await Promise.all([
      db
        .selectFrom('batches')
        .select(['id', 'species', 'livestockType', 'currentQuantity'])
        .where('farmId', '=', data.farmId)
        .where('status', '=', 'active')
        .where('currentQuantity', '>', 0)
        .execute(),
      db.selectFrom('customers').select(['id', 'name', 'phone']).execute(),
    ])
    return { batches, customers }
  })

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
}

interface Customer {
  id: string
  name: string
  phone: string
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
  const { t } = useTranslation(['sales', 'batches', 'customers', 'common'])
  const router = useRouter()
  const { format: formatCurrency, symbol: currencySymbol } = useFormatCurrency()
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [customers, setCustomers] = useState<Array<Customer>>([])
  const [formData, setFormData] = useState({
    livestockType: '' as 'poultry' | 'fish' | 'eggs' | '',
    batchId: '',
    customerId: '',
    quantity: '',
    unitPrice: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    paymentStatus: 'paid' as PaymentStatus,
    paymentMethod: '' as PaymentMethod | '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Load batches and customers when dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (isOpen) {
      try {
        const data = await getSaleFormDataFn({ data: { farmId } })
        setBatches(data.batches)
        setCustomers(data.customers)
      } catch (err) {
        console.error('Failed to load data:', err)
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
            customerId: formData.customerId || null,
            quantity: parseInt(formData.quantity),
            unitPrice: parseFloat(formData.unitPrice),
            date: new Date(formData.date),
            notes: formData.notes || null,
            paymentStatus: formData.paymentStatus,
            paymentMethod: formData.paymentMethod || null,
          },
        },
      })
      toast.success(t('messages.recorded', { defaultValue: 'Sale recorded' }))
      handleOpenChange(false)
      setFormData({
        livestockType: '',
        batchId: '',
        customerId: '',
        quantity: '',
        unitPrice: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        paymentStatus: 'paid',
        paymentMethod: '',
      })
      router.invalidate()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('error.record', { defaultValue: 'Failed to record sale' }),
      )
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
            {t('recordSale', { defaultValue: 'Record Sale' })}
          </DialogTitle>
          <DialogDescription>
            {t('recordDescription', {
              defaultValue: 'Record a new sale transaction',
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="livestockType">
              {t('sellingWhat', {
                defaultValue: 'What are you selling?',
              })}
            </Label>
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
                        (type) => type.value === formData.livestockType,
                      )?.label
                    : t('common:selectType', { defaultValue: 'Select type' })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LIVESTOCK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {t(`common:livestock.${type.value}`, {
                      defaultValue: type.label,
                    })}
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
                  {t('batches:batchOptional', {
                    defaultValue: 'Batch (Optional - deducts from stock)',
                  })}
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
                        ? `${selectedBatch?.species} (${t('batches:availableCount', { count: selectedBatch?.currentQuantity, defaultValue: '{{count}} available' })})`
                        : t('batches:selectBatchOptional', {
                            defaultValue: 'Select batch (optional)',
                          })}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBatches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.species} (
                        {t('batches.availableCount', {
                          count: batch.currentQuantity,
                          defaultValue: '{{count}} available',
                        })}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                {t('common:quantity', { defaultValue: 'Quantity' })}
              </Label>
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
              <Label htmlFor="unitPrice">
                {t('pricePerUnit', {
                  symbol: currencySymbol,
                  defaultValue: 'Price/Unit ({{symbol}})',
                })}
              </Label>
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
            <Label htmlFor="date">
              {t('saleDate', { defaultValue: 'Sale Date' })}
            </Label>
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

          {customers.length > 0 && (
            <div className="space-y-2">
              <Label>
                {t('customers:customerOptional', {
                  defaultValue: 'Customer (Optional)',
                })}
              </Label>
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
                      : t('customers:selectCustomer', {
                          defaultValue: 'Select customer',
                        })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>
              {t('paymentStatus', { defaultValue: 'Payment Status' })}
            </Label>
            <Select
              value={formData.paymentStatus}
              onValueChange={(value) =>
                value &&
                setFormData((prev) => ({
                  ...prev,
                  paymentStatus: value as PaymentStatus,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {t(`status.${formData.paymentStatus}`, {
                    defaultValue: PAYMENT_STATUSES.find(
                      (s) => s.value === formData.paymentStatus,
                    )?.label,
                  })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {t(`status.${s.value}`, { defaultValue: s.label })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {showAdvanced
              ? t('common:hide', { defaultValue: 'Hide' })
              : t('common:show', { defaultValue: 'Show' })}{' '}
            {t('additionalDetails', {
              defaultValue: 'additional details',
            })}
          </button>

          {showAdvanced && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label>
                  {t('paymentMethod', { defaultValue: 'Payment Method' })}
                </Label>
                <Select
                  value={formData.paymentMethod || undefined}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentMethod: value as PaymentMethod,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      {formData.paymentMethod
                        ? t(`method.${formData.paymentMethod}`, {
                            defaultValue: PAYMENT_METHODS.find(
                              (m) => m.value === formData.paymentMethod,
                            )?.label,
                          })
                        : t('selectMethod', {
                            defaultValue: 'Select method',
                          })}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {t(`method.${m.value}`, {
                          defaultValue: m.label,
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('common:notes', { defaultValue: 'Notes' })}</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder={t('notesPlaceholder', {
                    defaultValue: 'Delivery details, etc.',
                  })}
                  rows={2}
                />
              </div>
            </div>
          )}

          {formData.quantity && formData.unitPrice && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                {t('common:total', { defaultValue: 'Total' })}:{' '}
                <span className="text-lg">
                  {formatCurrency(
                    parseInt(formData.quantity) *
                      parseFloat(formData.unitPrice),
                  )}
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
              {t('common:cancel', { defaultValue: 'Cancel' })}
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
              {isSubmitting
                ? t('common:recording', { defaultValue: 'Recording...' })
                : t('recordSale', { defaultValue: 'Record Sale' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
