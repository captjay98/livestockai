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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { useFarm } from '~/features/farms/context'
import {
  SUPPLY_CATEGORIES,
  SUPPLY_UNITS,
} from '~/features/inventory/supplies-server'

interface SuppliesInventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  isSubmitting: boolean
  initialData?: SupplyItem
}

export function SuppliesInventoryDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: SuppliesInventoryDialogProps) {
  const { t } = useTranslation('inventory')
  const { selectedFarmId } = useFarm()

  const supplySchema = z.object({
    itemName: z.string().min(1, t('supplies.validation.nameRequired')).max(200),
    category: z.enum(
      SUPPLY_CATEGORIES as unknown as [string, ...Array<string>],
    ),
    quantityKg: z
      .number()
      .nonnegative(t('supplies.validation.quantityNonNegative')),
    unit: z.enum(SUPPLY_UNITS as unknown as [string, ...Array<string>]),
    minThresholdKg: z
      .number()
      .nonnegative(t('supplies.validation.thresholdNonNegative')),
    costPerUnit: z
      .number()
      .nonnegative(t('supplies.validation.costNonNegative'))
      .optional(),
    expiryDate: z.string().optional(),
    notes: z.string().max(500).optional(),
  })

  type SupplyFormData = z.infer<typeof supplySchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SupplyFormData>({
    resolver: zodResolver(supplySchema) as any,
    defaultValues: initialData
      ? {
          itemName: initialData.itemName,
          category: initialData.category as any,
          quantityKg: parseFloat(initialData.quantityKg),
          unit: initialData.unit as any,
          minThresholdKg: parseFloat(initialData.minThresholdKg),
          costPerUnit: initialData.costPerUnit
            ? parseFloat(initialData.costPerUnit)
            : undefined,
          expiryDate: initialData.expiryDate
            ? new Date(initialData.expiryDate).toISOString().split('T')[0]
            : undefined,
          notes: initialData.notes || undefined,
        }
      : undefined,
  })

  const category = watch('category')
  const unit = watch('unit')

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  const handleFormSubmit = (data: SupplyFormData) => {
    const submitData = {
      ...data,
      farmId: selectedFarmId,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    }
    onSubmit(submitData)
    if (!initialData) {
      onOpenChange(false)
    }
  }

  const getCategoryLabel = (cat: string) => {
    return t(`supplies.categories.${cat}`, { defaultValue: cat })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? t('supplies.dialog.editTitle')
              : t('supplies.dialog.addTitle')}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit as any)}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="itemName">{t('supplies.itemName')} *</Label>
            <Input
              id="itemName"
              {...register('itemName')}
              placeholder={t('supplies.placeholders.itemName')}
            />
            {errors.itemName && (
              <p className="text-sm text-destructive mt-1">
                {errors.itemName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="category">{t('supplies.category')} *</Label>
            <Select
              value={category}
              onValueChange={(value) => setValue('category', value as any)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t('supplies.placeholders.selectCategory')}
                />
              </SelectTrigger>
              <SelectContent>
                {SUPPLY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive mt-1">
                {errors.category.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantityKg">{t('supplies.quantity')} *</Label>
              <Input
                id="quantityKg"
                type="number"
                step="0.01"
                {...register('quantityKg', { valueAsNumber: true })}
                placeholder={t('supplies.placeholders.quantity')}
              />
              {errors.quantityKg && (
                <p className="text-sm text-destructive mt-1">
                  {errors.quantityKg.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="unit">{t('supplies.unit')} *</Label>
              <Select
                value={unit}
                onValueChange={(value) => setValue('unit', value as any)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('supplies.placeholders.selectUnit')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLY_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {t(`supplies.units.${u}`, { defaultValue: u })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-destructive mt-1">
                  {errors.unit.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minThresholdKg">
                {t('supplies.minThreshold')} *
              </Label>
              <Input
                id="minThresholdKg"
                type="number"
                step="0.01"
                {...register('minThresholdKg', { valueAsNumber: true })}
                placeholder={t('supplies.placeholders.quantity')}
              />
              {errors.minThresholdKg && (
                <p className="text-sm text-destructive mt-1">
                  {errors.minThresholdKg.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="costPerUnit">{t('supplies.cost')}</Label>
              <Input
                id="costPerUnit"
                type="number"
                step="0.01"
                {...register('costPerUnit', { valueAsNumber: true })}
                placeholder={t('supplies.placeholders.quantity')}
              />
              {errors.costPerUnit && (
                <p className="text-sm text-destructive mt-1">
                  {errors.costPerUnit.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="expiryDate">{t('supplies.expiry')}</Label>
            <Input id="expiryDate" type="date" {...register('expiryDate')} />
            {errors.expiryDate && (
              <p className="text-sm text-destructive mt-1">
                {errors.expiryDate.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">{t('supplies.notes')}</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder={t('supplies.placeholders.notes')}
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-destructive mt-1">
                {errors.notes.message}
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
                ? t('supplies.dialog.saving')
                : initialData
                  ? t('common:update')
                  : t('common:create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
