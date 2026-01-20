import { toast } from 'sonner'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Wheat } from 'lucide-react'
import type { CreateFeedRecordInput } from '~/features/feed/server'
import { FEED_TYPES, createFeedRecordFn } from '~/features/feed/server'
import { useFormatCurrency, useFormatWeight } from '~/features/settings'
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

// Server function to get batches for the farm
const getBatchesForFeedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    const { db } = await import('~/lib/db')
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()

    return db
      .selectFrom('batches')
      .select(['id', 'species', 'livestockType', 'currentQuantity'])
      .where('farmId', '=', data.farmId)
      .where('status', '=', 'active')
      .execute()
  })

// Server function to get feed inventory
const getFeedInventoryFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    const { db } = await import('~/lib/db')
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()

    return db
      .selectFrom('feed_inventory')
      .select(['feedType', 'quantityKg'])
      .where('farmId', '=', data.farmId)
      .execute()
  })

interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
}

interface FeedInventory {
  feedType: string
  quantityKg: string
}

interface FeedDialogProps {
  farmId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedDialog({ farmId, open, onOpenChange }: FeedDialogProps) {
  const { t } = useTranslation(['feed', 'batches', 'common'])
  const router = useRouter()
  const { symbol: currencySymbol } = useFormatCurrency()
  const { format: formatWeight } = useFormatWeight()
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [inventory, setInventory] = useState<Array<FeedInventory>>([])
  const [formData, setFormData] = useState({
    batchId: '',
    feedType: '' as CreateFeedRecordInput['feedType'] | '',
    quantityKg: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load batches and inventory when dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (isOpen) {
      try {
        const [batchesData, inventoryData] = await Promise.all([
          getBatchesForFeedFn({ data: { farmId } }),
          getFeedInventoryFn({ data: { farmId } }),
        ])
        setBatches(batchesData)
        setInventory(inventoryData)
      } catch (err) {
        console.error('Failed to load data:', err)
        toast.error(
          t('common:errors.operationFailed', {
            defaultValue: 'Operation failed',
          }),
        )
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.feedType || !formData.batchId) return
    setIsSubmitting(true)
    setError('')

    try {
      await createFeedRecordFn({
        data: {
          farmId,
          record: {
            batchId: formData.batchId,
            feedType: formData.feedType,
            quantityKg: parseFloat(formData.quantityKg),
            cost: parseFloat(formData.cost),
            date: new Date(formData.date),
          },
        },
      })
      toast.success(
        t('messages.recorded', { defaultValue: 'Feed record created' }),
      )
      handleOpenChange(false)
      setFormData({
        batchId: '',
        feedType: '',
        quantityKg: '',
        cost: '',
        date: new Date().toISOString().split('T')[0],
      })
      router.invalidate()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('error.record', {
              defaultValue: 'Failed to record feed usage',
            }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedFeedInventory = inventory.find(
    (i) => i.feedType === formData.feedType,
  )
  const availableKg = selectedFeedInventory
    ? parseFloat(selectedFeedInventory.quantityKg)
    : 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wheat className="h-5 w-5" />
            {t('recordUsage', { defaultValue: 'Record Feed Usage' })}
          </DialogTitle>
          <DialogDescription>
            {t('recordDescription', {
              defaultValue: 'Log feed consumption for a batch',
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batchId">
              {t('batches:batch', { defaultValue: 'Batch' })}
            </Label>
            <Select
              value={formData.batchId}
              onValueChange={(value) =>
                value && setFormData((prev) => ({ ...prev, batchId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {formData.batchId
                    ? batches.find((b) => b.id === formData.batchId)?.species
                    : t('batches:selectBatch', {
                        defaultValue: 'Select batch',
                      })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.species} (
                    {t('batches:activeCount', {
                      count: batch.currentQuantity,
                      defaultValue: '{{count}} active',
                    })}{' '}
                    {t(`common:livestock.${batch.livestockType}`, {
                      defaultValue: batch.livestockType,
                    })}
                    )
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedType">
              {t('feedType', { defaultValue: 'Feed Type' })}
            </Label>
            <Select
              value={formData.feedType}
              onValueChange={(value) =>
                value &&
                setFormData((prev) => ({
                  ...prev,
                  feedType: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {formData.feedType
                    ? FEED_TYPES.find(
                        (type) => type.value === formData.feedType,
                      )?.label
                    : t('selectFeedType', {
                        defaultValue: 'Select feed type',
                      })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FEED_TYPES.map((type) => {
                  const inv = inventory.find((i) => i.feedType === type.value)
                  const qty = inv ? parseFloat(inv.quantityKg) : 0
                  return (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      disabled={qty <= 0}
                    >
                      {t(`types.${type.value}`, { defaultValue: type.label })} (
                      {formatWeight(qty)}{' '}
                      {t('available', { defaultValue: 'available' })})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantityKg">
                {t('common:quantityLabel', {
                  unit: 'kg',
                  defaultValue: 'Quantity ({{unit}})',
                })}
              </Label>
              <Input
                id="quantityKg"
                type="number"
                min="0.1"
                step="0.1"
                max={availableKg}
                value={formData.quantityKg}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantityKg: e.target.value,
                  }))
                }
                placeholder="10"
                required
              />
              {formData.feedType && (
                <p className="text-xs text-muted-foreground">
                  {t('availableLabel', { defaultValue: 'Available' })}:{' '}
                  {formatWeight(availableKg)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">
                {t('common:cost', {
                  symbol: currencySymbol,
                  defaultValue: 'Cost ({{symbol}})',
                })}
              </Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, cost: e.target.value }))
                }
                placeholder="5000"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">
              {t('common:date', { defaultValue: 'Date' })}
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
                !formData.batchId ||
                !formData.feedType ||
                !formData.quantityKg ||
                !formData.cost
              }
            >
              {isSubmitting
                ? t('common:recording', { defaultValue: 'Recording...' })
                : t('recordFeed', { defaultValue: 'Record Feed' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
