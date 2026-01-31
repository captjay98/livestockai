import { toast } from 'sonner'
import React, { useEffect, useState } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { logger } from '~/lib/logger'
import { useInvoiceMutations } from '~/features/invoices/mutations'
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
  const { createInvoice } = useInvoiceMutations()
  const { format: formatCurrency } = useFormatCurrency()
  const { defaultPaymentTermsDays } = useBusinessSettings()
  const [customers, setCustomers] = useState<Array<Customer>>([])
  const [customerId, setCustomerId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [items, setItems] = useState<Array<LineItem>>([
    { description: '', quantity: '', unitPrice: '' },
  ])
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    createInvoice.mutate(
      {
        invoice: {
          customerId,
          farmId,
          items: items.map((i) => ({
            description: i.description,
            quantity: parseInt(i.quantity),
            unitPrice: parseFloat(i.unitPrice),
          })),
          dueDate: dueDate ? new Date(dueDate) : null,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          setCustomerId('')
          setDueDate('')
          setItems([{ description: '', quantity: '', unitPrice: '' }])
        },
        onError: (err) =>
          setError(err instanceof Error ? err.message : t('error.create')),
      },
    )
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
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
              {t('common:customer', { defaultValue: 'Customer' })} *
            </Label>
            <Select
              value={customerId}
              onValueChange={(v) => v && setCustomerId(v)}
            >
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
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
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
              {t('dueDate', { defaultValue: 'Due Date' })}
            </Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                {t('lineItems', { defaultValue: 'Line Items' })} *
              </Label>
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
                    className="flex-1 h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                    style={{ color: 'var(--text-landing-primary)' }}
                    required
                  />
                  <Input
                    type="number"
                    placeholder={t('common:qty', {
                      defaultValue: 'Qty',
                    })}
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                    className="w-16 h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                    style={{ color: 'var(--text-landing-primary)' }}
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
                    className="w-24 h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                    style={{ color: 'var(--text-landing-primary)' }}
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
              disabled={createInvoice.isPending}
            >
              {t('common:cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              type="submit"
              disabled={createInvoice.isPending || !isValid}
            >
              {createInvoice.isPending
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
