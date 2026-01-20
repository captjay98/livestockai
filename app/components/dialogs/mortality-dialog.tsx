import React, { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createServerFn } from '@tanstack/react-start'
import { useTranslation } from 'react-i18next'
import type { MortalityTable } from '~/lib/db/types'
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

const recordMortalityFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      batchId: string
      quantity: number
      date: string
      cause: MortalityCause
      notes?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    const { recordMortality } = await import('~/features/mortality/server')
    return recordMortality(session.user.id, {
      batchId: data.batchId,
      quantity: data.quantity,
      date: new Date(data.date),
      cause: data.cause,
      notes: data.notes,
    })
  })

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
  const queryClient = useQueryClient()
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
          const { getBatchesPaginated } =
            await import('~/features/batches/server')
          const result = await getBatchesPaginated(selectedFarmId, {
            page: 1,
            pageSize: 100,
          })
          setBatches(result.data.filter((b: any) => b.status === 'active'))
        } catch (err) {
          console.error('Failed to load batches:', err)
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedBatch = activeBatches.find((b) => b.id === formData.batchId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.batchId || !formData.quantity || !formData.cause) return

    setIsSubmitting(true)
    try {
      await recordMortalityFn({
        data: {
          batchId: formData.batchId,
          quantity: parseInt(formData.quantity),
          date: formData.date,
          cause: formData.cause,
          notes: formData.notes || undefined,
        },
      })
      toast.success(t('recorded', { defaultValue: 'Mortality recorded' }))
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onOpenChange(false)
      setFormData({
        batchId: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        cause: '',
        notes: '',
      })
      onSuccess?.()
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t('error.record', { defaultValue: 'Failed to record' }),
      )
    } finally {
      setIsSubmitting(false)
    }
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
            <Label htmlFor="batch">
              {t('batches:batch', { defaultValue: 'Batch' })} *
            </Label>
            <Select
              value={formData.batchId}
              onValueChange={(v) =>
                v && setFormData((p) => ({ ...p, batchId: v }))
              }
            >
              <SelectTrigger>
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
              <Label htmlFor="quantity">
                {t('common:quantity', { defaultValue: 'Quantity' })} *
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedBatch?.currentQuantity || 999999}
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, quantity: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">
                {t('common:date', { defaultValue: 'Date' })} *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, date: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cause">
              {t('cause', { defaultValue: 'Cause' })} *
            </Label>
            <Select
              value={formData.cause}
              onValueChange={(v) =>
                v && setFormData((p) => ({ ...p, cause: v }))
              }
            >
              <SelectTrigger>
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
            <Label htmlFor="notes">
              {t('common:notes', { defaultValue: 'Notes' })}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder={t('common:optionalNotes', {
                defaultValue: 'Optional notes...',
              })}
              rows={2}
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
                isSubmitting ||
                !formData.batchId ||
                !formData.quantity ||
                !formData.cause
              }
            >
              {isSubmitting
                ? t('common:recording', { defaultValue: 'Recording...' })
                : t('common:record', { defaultValue: 'Record' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
