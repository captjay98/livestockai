import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MortalityTable } from '~/lib/db/types'
import { logger } from '~/lib/logger'
import { useMortalityMutations } from '~/features/mortality/mutations'
import { getBatchesFn } from '~/features/batches/server'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
  Dialog,
  DialogContent,
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
import { useFarm } from '~/features/farms/context'

type MortalityCause = MortalityTable['cause']

const MORTALITY_CAUSES: ReadonlyArray<{
  value: MortalityCause
  label: string
}> = [
  { value: 'disease', label: 'Disease' },
  { value: 'predator', label: 'Predator Attack' },
  { value: 'weather', label: 'Weather/Environment' },
  { value: 'starvation', label: 'Starvation' },
  { value: 'injury', label: 'Injury' },
  { value: 'poisoning', label: 'Poisoning' },
  { value: 'suffocation', label: 'Suffocation' },
  { value: 'culling', label: 'Culling' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'other', label: 'Other' },
]

interface MortalityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function MortalityDialog({
  open,
  onOpenChange,
  onSuccess,
}: MortalityDialogProps) {
  const { t } = useTranslation(['mortality', 'batches', 'common'])
  const { createMortality } = useMortalityMutations()
  const { selectedFarmId } = useFarm()
  const [batches, setBatches] = useState<
    Array<{
      id: string
      species: string
      currentQuantity: number
      status: string
    }>
  >([])

  useEffect(() => {
    const loadBatches = async () => {
      if (selectedFarmId && open) {
        try {
          const allBatches = await getBatchesFn({
            data: { farmId: selectedFarmId },
          })
          setBatches(allBatches.filter((b: any) => b.status === 'active'))
        } catch (err) {
          logger.error('Failed to load batches:', err)
        }
      }
    }
    loadBatches()
  }, [selectedFarmId, open])

  const activeBatches = batches

  const [formData, setFormData] = useState<{
    batchId: string
    quantity: string
    date: string
    cause: MortalityCause | ''
    notes: string
  }>({
    batchId: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    cause: '',
    notes: '',
  })

  const selectedBatch = activeBatches.find((b) => b.id === formData.batchId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.batchId || !formData.quantity || !formData.cause) return

    createMortality.mutate(
      {
        farmId: selectedFarmId!,
        data: {
          batchId: formData.batchId,
          quantity: parseInt(formData.quantity),
          date: new Date(formData.date),
          cause: formData.cause,
          notes: formData.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          setFormData({
            batchId: '',
            quantity: '',
            date: new Date().toISOString().split('T')[0],
            cause: '',
            notes: '',
          })
          onSuccess?.()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('recordMortality', {
              defaultValue: 'Record Mortality',
            })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="batch"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('batches:batch', { defaultValue: 'Batch' })} *
            </Label>
            <Select
              value={formData.batchId}
              onValueChange={(v) =>
                v && setFormData((p) => ({ ...p, batchId: v }))
              }
            >
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                <SelectValue>
                  {formData.batchId
                    ? activeBatches.find((b) => b.id === formData.batchId)
                        ?.species
                    : t('batches:selectBatch', {
                        defaultValue: 'Select batch',
                      })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {activeBatches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.species} (
                    {t('batches:remaining', {
                      count: batch.currentQuantity,
                      defaultValue: '{{count}} remaining',
                    })}
                    )
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="quantity"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
              >
                {t('common:quantity', {
                  defaultValue: 'Quantity',
                })}{' '}
                *
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedBatch?.currentQuantity || 999999}
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    quantity: e.target.value,
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
                {t('common:date', { defaultValue: 'Date' })} *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    date: e.target.value,
                  }))
                }
                required
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="cause"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('cause', { defaultValue: 'Cause' })} *
            </Label>
            <Select
              value={formData.cause}
              onValueChange={(v) =>
                v && setFormData((p) => ({ ...p, cause: v }))
              }
            >
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                <SelectValue>
                  {formData.cause
                    ? t(`causes.${formData.cause}`, {
                        defaultValue: MORTALITY_CAUSES.find(
                          (c) => c.value === formData.cause,
                        )?.label,
                      })
                    : t('selectCause', {
                        defaultValue: 'Select cause',
                      })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MORTALITY_CAUSES.map((cause) => (
                  <SelectItem key={cause.value} value={cause.value}>
                    {t(`causes.${cause.value}`, {
                      defaultValue: cause.label,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="notes"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('common:notes', { defaultValue: 'Notes' })}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  notes: e.target.value,
                }))
              }
              placeholder={t('common:optionalNotes', {
                defaultValue: 'Optional notes...',
              })}
              rows={2}
              className="bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm p-4 rounded-xl resize-none"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common:cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              type="submit"
              disabled={
                createMortality.isPending ||
                !formData.batchId ||
                !formData.quantity ||
                !formData.cause
              }
            >
              {createMortality.isPending
                ? t('common:recording', {
                    defaultValue: 'Recording...',
                  })
                : t('common:record', {
                    defaultValue: 'Record',
                  })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
