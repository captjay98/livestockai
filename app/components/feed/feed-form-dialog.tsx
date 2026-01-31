import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { FEED_TYPES } from '~/features/feed/constants'
import { useFormatCurrency } from '~/features/settings'

interface Batch {
  id: string
  species: string
  currentQuantity: number
}

interface FeedInventory {
  feedType: string
  quantityKg: string
}

interface FeedFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    batchId: string
    feedType: string
    quantityKg: string
    cost: string
    date: string
  }) => Promise<void>
  batches: Array<Batch>
  inventory: Array<FeedInventory>
  initialData?: {
    batchId?: string
    feedType?: string
    quantityKg?: number
    cost?: number
    date?: Date | string
  }
  isSubmitting: boolean
  title: string
  description?: string
}

export function FeedFormDialog({
  open,
  onOpenChange,
  onSubmit,
  batches,
  inventory,
  initialData,
  isSubmitting,
  title,
  description,
}: FeedFormDialogProps) {
  const { t } = useTranslation(['feed', 'common'])
  const { symbol: currencySymbol } = useFormatCurrency()
  const [formData, setFormData] = useState({
    batchId: '',
    feedType: '',
    quantityKg: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        batchId: initialData.batchId || '',
        feedType: initialData.feedType || '',
        quantityKg: initialData.quantityKg?.toString() || '',
        cost: initialData.cost?.toString() || '',
        date: initialData.date
          ? new Date(initialData.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      })
    } else {
      setFormData({
        batchId: '',
        feedType: '',
        quantityKg: '',
        cost: '',
        date: new Date().toISOString().split('T')[0],
      })
    }
  }, [initialData, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const selectedFeedInventory = inventory.find(
    (i) => i.feedType === formData.feedType,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="batch"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('feed:labels.batch', { defaultValue: 'Batch' })}
            </Label>
            <Select
              value={formData.batchId}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  batchId: value || '',
                }))
              }
            >
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                <SelectValue>
                  {formData.batchId
                    ? batches.find((b) => b.id === formData.batchId)?.species
                    : t('feed:placeholders.selectBatch', {
                        defaultValue: 'Select batch',
                      })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.species} ({batch.currentQuantity} units)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="feedType"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('feed:labels.feedType', {
                defaultValue: 'Feed Type',
              })}
            </Label>
            <Select
              value={formData.feedType}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  feedType: value || '',
                }))
              }
            >
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                <SelectValue>
                  {formData.feedType
                    ? FEED_TYPES.find(
                        (tInfo) => tInfo.value === formData.feedType,
                      )?.label
                    : t('feed:placeholders.selectType', {
                        defaultValue: 'Select type',
                      })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FEED_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.feedType && (
              <p className="text-xs text-muted-foreground">
                {t('feed:labels.available', {
                  defaultValue: 'Available',
                })}
                :{' '}
                {parseFloat(
                  selectedFeedInventory?.quantityKg || '0',
                ).toLocaleString()}{' '}
                {t('common:units.kg', { defaultValue: 'kg' })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="quantity"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('feed:labels.quantity', {
                defaultValue: 'Quantity',
              })}{' '}
              (kg)
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0.1"
              step="0.1"
              value={formData.quantityKg}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  quantityKg: e.target.value,
                }))
              }
              required
              className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="cost"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('feed:labels.cost', { defaultValue: 'Cost' })} (
              {currencySymbol})
            </Label>
            <Input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={formData.cost}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  cost: e.target.value,
                }))
              }
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
              {t('feed:labels.date', { defaultValue: 'Date' })}
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common:cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t('common:saving', {
                    defaultValue: 'Saving...',
                  })
                : initialData
                  ? t('common:saveChanges', {
                      defaultValue: 'Save Changes',
                    })
                  : t('common:save', { defaultValue: 'Save' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
