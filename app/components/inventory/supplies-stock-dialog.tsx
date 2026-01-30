import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import type { SupplyItem } from '~/features/inventory/supplies-repository'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

export function SuppliesStockDialog({
  open,
  onOpenChange,
  supply,
  mode,
  onSubmit,
  isSubmitting,
}: SuppliesStockDialogProps) {
  const { t } = useTranslation('inventory')

  const stockSchema = z.object({
    quantity: z.number().positive(t('supplies.validation.quantityPositive')),
  })

  type StockFormData = z.infer<typeof stockSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StockFormData>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      quantity: 0,
    },
  })

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  const handleFormSubmit = (data: StockFormData) => {
    onSubmit(data.quantity)
  }

  const currentQty = parseFloat(supply.quantityKg)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add'
              ? t('supplies.dialog.addStockTitle')
              : t('supplies.dialog.reduceStockTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="text-sm text-muted-foreground">
              {t('supplies.currentStock')}
            </div>
            <div className="text-2xl font-bold">
              {currentQty.toFixed(2)} {supply.unit}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {supply.itemName}
            </div>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="quantity">
                {mode === 'add'
                  ? t('supplies.quantityToAdd')
                  : t('supplies.quantityToReduce')}{' '}
                *
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                {...register('quantity', { valueAsNumber: true })}
                placeholder={t('supplies.placeholders.quantity', {
                  defaultValue: '0.00',
                })}
                autoFocus
              />
              {errors.quantity && (
                <p className="text-sm text-destructive mt-1">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common:cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('supplies.dialog.processing')
                  : mode === 'add'
                    ? t('supplies.addStock')
                    : t('supplies.reduceStock')}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface SuppliesStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supply: SupplyItem
  mode: 'add' | 'reduce'
  onSubmit: (quantity: number) => void
  isSubmitting: boolean
}
