import { toast } from 'sonner'
import React, { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { logger } from '~/lib/logger'
import { createInvoiceFn } from '~/features/invoices/server'
import { getCustomersFn } from '~/features/customers/server'
import { useBusinessSettings, useFormatCurrency } from '~/features/settings'
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

interface Customer {
  id: string
  name: string
  phone: string
}

interface LineItem {
  description: string
  quantity: string
  unitPrice: string
}

interface InvoiceDialogProps {
  farmId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvoiceDialog({
  farmId,
  open,
  onOpenChange,
}: InvoiceDialogProps) {
  const { t } = useTranslation(['invoices', 'common'])
  const router = useRouter()
  const { format: formatCurrency } = useFormatCurrency()
  const { defaultPaymentTermsDays } = useBusinessSettings()
  const [customers, setCustomers] = useState<Array<Customer>>([])
  const [customerId, setCustomerId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [items, setItems] = useState<Array<LineItem>>([
    { description: '', quantity: '', unitPrice: '' },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && !dueDate) {
      const today = new Date()
      today.setDate(today.getDate() + defaultPaymentTermsDays)
      setDueDate(today.toISOString().split('T')[0])
    }
  }, [open, defaultPaymentTermsDays])

  const handleOpenChange = async (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (isOpen) {
      try {
        const data = await getCustomersFn({ data: { farmId } })
        setCustomers(
          data.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
          })),
        )
      } catch (err) {
        logger.error('Failed to load customers:', err)
        toast.error(
          t('common:errors.operationFailed', {
            defaultValue: 'Operation failed',
          }),
        )
      }
    }
  }

  const addItem = () =>
    setItems([...items, { description: '', quantity: '', unitPrice: '' }])

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof LineItem, value: string) => {
    const updated = [...items]
    updated[index][field] = value
    setItems(updated)
  }

  const total = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unitPrice) || 0
    return sum + qty * price
  }, 0)

  const isValid =
    customerId && items.every((i) => i.description && i.quantity && i.unitPrice)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await createInvoiceFn({
        data: {
          customerId,
          farmId,
          items: items.map((i) => ({
            description: i.description,
            quantity: parseInt(i.quantity),
            unitPrice: parseFloat(i.unitPrice),
          })),
          dueDate: dueDate ? new Date(dueDate) : null,
        },
      })
      toast.success(t('messages.created', { defaultValue: 'Invoice created' }))
      onOpenChange(false)
      setCustomerId('')
      setDueDate('')
      setItems([{ description: '', quantity: '', unitPrice: '' }])
      router.invalidate()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('error.create', {
              defaultValue: 'Failed to create invoice',
            }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('createInvoice', { defaultValue: 'Create Invoice' })}
          </DialogTitle>
          <DialogDescription>
            {t('createDescription', {
              defaultValue: 'Create a new invoice for a customer',
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>
              {t('common:customer', { defaultValue: 'Customer' })} *
            </Label>
            <Select
              value={customerId}
              onValueChange={(v) => v && setCustomerId(v)}
            >
              <SelectTrigger>
                <SelectValue>
                  {customerId
                    ? customers.find((c) => c.id === customerId)?.name
                    : t('selectCustomer', {
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

          <div className="space-y-2">
            <Label>{t('dueDate', { defaultValue: 'Due Date' })}</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('lineItems', { defaultValue: 'Line Items' })} *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="h-3 w-3 mr-1" />{' '}
                {t('common:add', { defaultValue: 'Add' })}
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Input
                    placeholder={t('description', {
                      defaultValue: 'Description',
                    })}
                    value={item.description}
                    onChange={(e) =>
                      updateItem(i, 'description', e.target.value)
                    }
                    className="flex-1"
                    required
                  />
                  <Input
                    type="number"
                    placeholder={t('common:qty', {
                      defaultValue: 'Qty',
                    })}
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                    className="w-16"
                    min="1"
                    required
                  />
                  <Input
                    type="number"
                    placeholder={t('common:price', {
                      defaultValue: 'Price',
                    })}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                    className="w-24"
                    min="0"
                    step="0.01"
                    required
                  />
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(i)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg flex justify-between">
            <span className="font-medium">
              {t('common:total', { defaultValue: 'Total' })}:
            </span>
            <span className="font-bold">{formatCurrency(total)}</span>
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
              disabled={isSubmitting}
            >
              {t('common:cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting
                ? t('common:creating', {
                    defaultValue: 'Creating...',
                  })
                : t('createInvoice', {
                    defaultValue: 'Create Invoice',
                  })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
