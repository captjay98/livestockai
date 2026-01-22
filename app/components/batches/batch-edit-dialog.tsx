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

interface Batch {
  id: string
  species: string
  currentQuantity: number
  status: string
  // Add other fields if necessary
}

interface BatchEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batch: Batch | null
  onSubmit: (data: {
    currentQuantity: string
    status: 'active' | 'depleted' | 'sold'
  }) => Promise<void>
  isSubmitting: boolean
}

export function BatchEditDialog({
  open,
  onOpenChange,
  batch,
  onSubmit,
  isSubmitting,
}: BatchEditDialogProps) {
  const { t } = useTranslation(['batches', 'common'])
  const [formData, setFormData] = useState({
    currentQuantity: '',
    status: 'active' as 'active' | 'depleted' | 'sold',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (batch) {
      setFormData({
        currentQuantity: batch.currentQuantity.toString(),
        status: batch.status as 'active' | 'depleted' | 'sold',
      })
    }
  }, [batch])

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
          <DialogTitle>
            {t('dialog.editTitle', { defaultValue: 'Edit Batch' })}
          </DialogTitle>
          <DialogDescription>
            {t('dialog.editDescription', {
              defaultValue: 'Update batch information',
            })}
          </DialogDescription>
        </DialogHeader>
        {batch && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('species', { defaultValue: 'Species' })}</Label>
              <Input value={batch.species} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-current-quantity">
                {t('quantity', { defaultValue: 'Quantity' })}
              </Label>
              <Input
                id="edit-current-quantity"
                type="number"
                min="0"
                value={formData.currentQuantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    currentQuantity: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">
                {t('columns.status', { defaultValue: 'Status' })}
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: string | null) => {
                  if (
                    value === 'active' ||
                    value === 'depleted' ||
                    value === 'sold'
                  ) {
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    {t('statuses.active', { defaultValue: 'Active' })}
                  </SelectItem>
                  <SelectItem value="depleted">
                    {t('statuses.depleted', {
                      defaultValue: 'Depleted',
                    })}
                  </SelectItem>
                  <SelectItem value="sold">
                    {t('statuses.sold', { defaultValue: 'Sold' })}
                  </SelectItem>
                </SelectContent>
              </Select>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('common:saving', { defaultValue: 'Saving...' })
                  : t('common:save', { defaultValue: 'Save' })}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
