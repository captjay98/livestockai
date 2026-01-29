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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

interface EggFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<void>
  batches: Array<any>
  isSubmitting: boolean
  initialData?: any
  isEdit?: boolean
}

export function EggFormDialog({
  open,
  onOpenChange,
  onSubmit,
  batches,
  isSubmitting,
  initialData,
}: EggFormDialogProps) {
  const { t } = useTranslation(['eggs', 'common', 'batches'])
  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    quantityCollected: '',
    quantityBroken: '0',
    quantitySold: '0',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        batchId: initialData.batchId,
        date: new Date(initialData.date).toISOString().split('T')[0],
        quantityCollected: String(initialData.quantityCollected),
        quantityBroken: String(initialData.quantityBroken),
        quantitySold: String(initialData.quantitySold),
      })
    } else {
      setFormData({
        batchId: '',
        date: new Date().toISOString().split('T')[0],
        quantityCollected: '',
        quantityBroken: '0',
        quantitySold: '0',
      })
    }
    setError('')
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await onSubmit({
        ...formData,
        quantityCollected: parseInt(formData.quantityCollected),
        quantityBroken: parseInt(formData.quantityBroken),
        quantitySold: parseInt(formData.quantitySold),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? t('eggs:editRecordTitle', {
                  defaultValue: 'Edit Egg Record',
                })
              : t('eggs:addRecordTitle', {
                  defaultValue: 'Record Egg Production',
                })}
          </DialogTitle>
          {!initialData && (
            <DialogDescription>
              {t('eggs:addRecordDescription', {
                defaultValue: 'Enter daily egg collection details',
              })}
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!initialData && (
            <div className="space-y-2">
              <Label htmlFor="batch">
                {t('batches:batch', { defaultValue: 'Batch' })}
              </Label>
              <Select
                value={formData.batchId}
                onValueChange={(value: string | null) =>
                  setFormData((prev) => ({
                    ...prev,
                    batchId: value || '',
                  }))
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
                      {t('batches:birdCount', {
                        count: batch.currentQuantity,
                        defaultValue: '{{count}} birds',
                      })}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date">
              {t('common:date', { defaultValue: 'Date' })}
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
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="collected">
                {t('eggs:collected', {
                  defaultValue: 'Collected',
                })}
              </Label>
              <Input
                id="collected"
                type="number"
                min="0"
                value={formData.quantityCollected}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantityCollected: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="broken">
                {t('eggs:broken', { defaultValue: 'Broken' })}
              </Label>
              <Input
                id="broken"
                type="number"
                min="0"
                value={formData.quantityBroken}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantityBroken: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sold">
                {t('eggs:sold', { defaultValue: 'Sold' })}
              </Label>
              <Input
                id="sold"
                type="number"
                min="0"
                value={formData.quantitySold}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantitySold: e.target.value,
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
              disabled={
                isSubmitting ||
                (!initialData && !formData.batchId) ||
                !formData.quantityCollected
              }
            >
              {isSubmitting
                ? t('common:saving', {
                    defaultValue: 'Saving...',
                  })
                : initialData
                  ? t('common:saveChanges', {
                      defaultValue: 'Save Changes',
                    })
                  : t('eggs:saveRecord', {
                      defaultValue: 'Save Record',
                    })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
