import { toast } from 'sonner'
import React, { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { logger } from '~/lib/logger'
import { getFarmByIdFn, updateFarmFn } from '~/features/farms/server'
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

interface EditFarmDialogProps {
  farmId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditFarmDialog({
  farmId,
  open,
  onOpenChange,
  onSuccess,
}: EditFarmDialogProps) {
  const { t } = useTranslation(['farms', 'common'])
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'poultry' as 'poultry' | 'aquaculture' | 'mixed',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadFarm = async () => {
      if (open && farmId) {
        try {
          const farmData = await getFarmByIdFn({ data: { farmId } })
          if (farmData) {
            setFormData({
              name: farmData.name,
              location: farmData.location,
              type: farmData.type as 'poultry' | 'aquaculture' | 'mixed',
            })
          }
        } catch (err) {
          logger.error('Failed to load farm:', err)
          toast.error(
            t('common:errors.operationFailed', {
              defaultValue: 'Operation failed',
            }),
          )
        } finally {
          setIsLoading(false)
        }
      }
    }
    loadFarm()
  }, [open, farmId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await updateFarmFn({
        data: {
          farmId,
          name: formData.name,
          location: formData.location,
          type: formData.type,
        },
      })
      toast.success(t('farms:updated', { defaultValue: 'Farm updated' }))
      onOpenChange(false)
      if (onSuccess) onSuccess()
      router.invalidate()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('farms:error.update', {
              defaultValue: 'Failed to update farm',
            }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('farms:editFarm', { defaultValue: 'Edit Farm' })}
          </DialogTitle>
          <DialogDescription>
            {t('farms:editDescription', {
              defaultValue: 'Update your farm information',
            })}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-farm-name">
                {t('farms:farmName', {
                  defaultValue: 'Farm Name',
                })}
              </Label>
              <Input
                id="edit-farm-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder={t('farms:placeholders.name', {
                  defaultValue: 'Enter farm name',
                })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-farm-location">
                {t('farms:location', {
                  defaultValue: 'Location',
                })}
              </Label>
              <Input
                id="edit-farm-location"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                placeholder={t('farms:placeholders.location', {
                  defaultValue: 'Enter farm location',
                })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-farm-type">
                {t('farms:farmType', {
                  defaultValue: 'Farm Type',
                })}
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  if (
                    value === 'poultry' ||
                    value === 'aquaculture' ||
                    value === 'mixed'
                  ) {
                    setFormData((prev) => ({
                      ...prev,
                      type: value,
                    }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poultry">
                    {t('common:livestock.poultry', {
                      defaultValue: 'Poultry',
                    })}
                  </SelectItem>
                  <SelectItem value="aquaculture">
                    {t('common:livestock.aquaculture', {
                      defaultValue: 'Aquaculture',
                    })}
                  </SelectItem>
                  <SelectItem value="mixed">
                    {t('common:livestock.mixed', {
                      defaultValue: 'Mixed',
                    })}
                  </SelectItem>
                </SelectContent>
              </Select>
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
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('common:cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.location}
              >
                {isSubmitting
                  ? t('common:updating', {
                      defaultValue: 'Updating...',
                    })
                  : t('farms:updateFarm', {
                      defaultValue: 'Update Farm',
                    })}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
