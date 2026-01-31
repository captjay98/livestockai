import React, { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getFarmByIdFn } from '~/features/farms/server'
import { useFarmMutations } from '~/features/farms/mutations'
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
  const { updateFarm } = useFarmMutations()
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'poultry' as 'poultry' | 'aquaculture' | 'mixed',
  })
  const [error, setError] = useState('')

  const { data: farmData, isLoading } = useQuery({
    queryKey: ['farm', farmId],
    queryFn: () => getFarmByIdFn({ data: { farmId } }),
    enabled: open && !!farmId,
  })

  useEffect(() => {
    if (farmData) {
      setFormData({
        name: farmData.name,
        location: farmData.location,
        type: farmData.type as 'poultry' | 'aquaculture' | 'mixed',
      })
    }
  }, [farmData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    updateFarm.mutate(
      {
        data: {
          farmId,
          name: formData.name,
          location: formData.location,
          type: formData.type,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          onSuccess?.()
        },
        onError: (err) =>
          setError(
            err instanceof Error ? err.message : t('farms:error.update'),
          ),
      },
    )
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
                disabled={updateFarm.isPending}
              >
                {t('common:cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                type="submit"
                disabled={
                  updateFarm.isPending || !formData.name || !formData.location
                }
              >
                {updateFarm.isPending
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
