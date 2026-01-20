import { toast } from 'sonner'
import React, { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Egg } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { createEggRecordFn } from '~/features/eggs/server'
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

const getPoultryBatchesFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    const { db } = await import('~/lib/db')
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()

    return db
      .selectFrom('batches')
      .select(['id', 'species', 'currentQuantity'])
      .where('farmId', '=', data.farmId)
      .where('livestockType', '=', 'poultry')
      .where('status', '=', 'active')
      .execute()
  })

interface Batch {
  id: string
  species: string
  currentQuantity: number
}

interface EggDialogProps {
  farmId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EggDialog({ farmId, open, onOpenChange }: EggDialogProps) {
  const { t } = useTranslation(['eggs', 'batches', 'common'])
  const router = useRouter()
  const [batches, setBatches] = useState<Array<Batch>>([])
  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    quantityCollected: '',
    quantityBroken: '0',
    quantitySold: '0',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleOpenChange = async (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (isOpen) {
      try {
        const batchesData = await getPoultryBatchesFn({ data: { farmId } })
        setBatches(batchesData)
      } catch (err) {
        console.error('Failed to load batches:', err)
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
    if (!formData.batchId) return
    setIsSubmitting(true)
    setError('')

    try {
      await createEggRecordFn({
        data: {
          farmId,
          record: {
            batchId: formData.batchId,
            date: new Date(formData.date),
            quantityCollected: parseInt(formData.quantityCollected),
            quantityBroken: parseInt(formData.quantityBroken) || 0,
            quantitySold: parseInt(formData.quantitySold) || 0,
          },
        },
      })
      toast.success(
        t('messages.recorded', { defaultValue: 'Egg record created' }),
      )
      handleOpenChange(false)
      setFormData({
        batchId: '',
        date: new Date().toISOString().split('T')[0],
        quantityCollected: '',
        quantityBroken: '0',
        quantitySold: '0',
      })
      router.invalidate()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('error.record', {
              defaultValue: 'Failed to record egg collection',
            }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedBatch = batches.find((b) => b.id === formData.batchId)
  const collected = parseInt(formData.quantityCollected) || 0
  const broken = parseInt(formData.quantityBroken) || 0
  const sold = parseInt(formData.quantitySold) || 0
  const remaining = collected - broken - sold

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Egg className="h-5 w-5" />
            {t('recordCollection', {
              defaultValue: 'Record Egg Collection',
            })}
          </DialogTitle>
          <DialogDescription>
            {t('recordDescription', {
              defaultValue: "Log today's egg collection from a layer batch",
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batchId">
              {t('layerBatch', { defaultValue: 'Layer Batch' })}
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
                    ? `${selectedBatch?.species} (${selectedBatch?.currentQuantity} ${t('birds', { defaultValue: 'birds' })})`
                    : t('batches:selectBatch', {
                        defaultValue: 'Select batch',
                      })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.species} ({batch.currentQuantity}{' '}
                    {t('birds', { defaultValue: 'birds' })})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {batches.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t('noBatches', {
                  defaultValue: 'No active poultry batches found',
                })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">
              {t('collectionDate', { defaultValue: 'Collection Date' })}
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

          <div className="space-y-2">
            <Label htmlFor="quantityCollected">
              {t('collected', { defaultValue: 'Eggs Collected' })}
            </Label>
            <Input
              id="quantityCollected"
              type="number"
              min="0"
              value={formData.quantityCollected}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  quantityCollected: e.target.value,
                }))
              }
              placeholder="150"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantityBroken">
                {t('broken', { defaultValue: 'Broken' })}
              </Label>
              <Input
                id="quantityBroken"
                type="number"
                min="0"
                max={collected}
                value={formData.quantityBroken}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantityBroken: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantitySold">
                {t('sold', { defaultValue: 'Sold' })}
              </Label>
              <Input
                id="quantitySold"
                type="number"
                min="0"
                max={collected - broken}
                value={formData.quantitySold}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantitySold: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
          </div>

          {collected > 0 && (
            <div className="p-3 bg-muted rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span>{t('collected', { defaultValue: 'Collected' })}:</span>
                <span className="font-medium">{collected}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t('broken', { defaultValue: 'Broken' })}:</span>
                <span>-{broken}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t('sold', { defaultValue: 'Sold' })}:</span>
                <span>-{sold}</span>
              </div>
              <div className="border-t pt-1 flex justify-between text-sm font-medium">
                <span>{t('inStock', { defaultValue: 'In Stock' })}:</span>
                <span className={remaining < 0 ? 'text-destructive' : ''}>
                  {remaining}
                </span>
              </div>
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
                isSubmitting || !formData.batchId || !formData.quantityCollected
              }
            >
              {isSubmitting
                ? t('common:recording', { defaultValue: 'Recording...' })
                : t('recordCollection', {
                    defaultValue: 'Record Collection',
                  })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
