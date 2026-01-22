import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

interface WaterQualityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<void>
  batches: Array<any>
  isSubmitting: boolean
  initialData?: any
  title: string
  tempLabel: string
}

export function WaterQualityFormDialog({
  open,
  onOpenChange,
  onSubmit,
  batches,
  isSubmitting,
  initialData,
  title,
  tempLabel,
}: WaterQualityFormDialogProps) {
  const { t } = useTranslation(['waterQuality', 'common', 'batches'])
  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    ph: '',
    temperatureCelsius: '',
    dissolvedOxygenMgL: '',
    ammoniaMgL: '',
    notes: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        batchId: initialData.batchId,
        date: new Date(initialData.date).toISOString().split('T')[0],
        ph: initialData.ph.toString(),
        temperatureCelsius: initialData.temperatureCelsius.toString(),
        dissolvedOxygenMgL: initialData.dissolvedOxygenMgL.toString(),
        ammoniaMgL: initialData.ammoniaMgL.toString(),
        notes: initialData.notes || '',
      })
    } else {
      setFormData({
        batchId: '',
        date: new Date().toISOString().split('T')[0],
        ph: '',
        temperatureCelsius: '',
        dissolvedOxygenMgL: '',
        ammoniaMgL: '',
        notes: '',
      })
    }
    setError('')
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('batches:batch', { defaultValue: 'Batch' })}</Label>
            {initialData ? (
              <Input value={initialData.species} disabled />
            ) : (
              <Select
                value={formData.batchId}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, batchId: val || '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.batchId
                      ? batches.find((b) => b.id === formData.batchId)?.species
                      : t('waterQuality:selectFishBatch', {
                          defaultValue: 'Select fish batch',
                        })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.species} (
                      {t('batches:fishCount', {
                        count: batch.currentQuantity,
                        defaultValue: '{{count}} fish',
                      })}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('common:date', { defaultValue: 'Date' })}</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                {t('waterQuality:labels.ph', { defaultValue: 'pH' })}
              </Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={formData.ph}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, ph: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t('waterQuality:labels.temperature', {
                  defaultValue: 'Temperature',
                })}{' '}
                ({tempLabel})
              </Label>
              <Input
                type="number"
                step="0.1"
                value={formData.temperatureCelsius}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    temperatureCelsius: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t('waterQuality:labels.dissolvedOxygen', {
                  defaultValue: 'Dissolved Oxygen (mg/L)',
                })}
              </Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={formData.dissolvedOxygenMgL}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dissolvedOxygenMgL: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t('waterQuality:labels.ammonia', {
                  defaultValue: 'Ammonia (mg/L)',
                })}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.ammoniaMgL}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ammoniaMgL: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common:cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.batchId || !formData.ph}
            >
              {isSubmitting
                ? t('common:saving', { defaultValue: 'Saving...' })
                : initialData
                  ? t('common:update', { defaultValue: 'Update' })
                  : t('waterQuality:saveRecord', {
                      defaultValue: 'Save Record',
                    })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
