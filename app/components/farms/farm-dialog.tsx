import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2 } from 'lucide-react'
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

// All 8 farm types from database schema
type FarmType =
  | 'poultry'
  | 'aquaculture'
  | 'mixed'
  | 'cattle'
  | 'goats'
  | 'sheep'
  | 'bees'
  | 'multi'

interface Farm {
  id: string
  name: string
  location: string
  type: FarmType
}

interface FarmDialogProps {
  farm?: Farm | null // If provided, we are in edit mode
  open: boolean
  onOpenChange: (open: boolean) => void
  // Onboarding mode props
  onboardingMode?: boolean
  onSuccess?: (farmId: string, farmType: string) => void
  onSkip?: () => void
}

export function FarmDialog({
  farm,
  open,
  onOpenChange,
  onboardingMode,
  onSuccess,
  onSkip,
}: FarmDialogProps) {
  const { t } = useTranslation(['farms', 'common'])
  const { createFarm, updateFarm } = useFarmMutations()
  const isEditing = !!farm

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'poultry' as FarmType,
  })

  const [error, setError] = useState('')

  // Initialize form data when opening/changing farm
  useEffect(() => {
    if (open) {
      if (farm) {
        setFormData({
          name: farm.name,
          location: farm.location,
          type: farm.type,
        })
      } else {
        // Reset for create mode
        setFormData({
          name: '',
          location: '',
          type: 'poultry',
        })
      }
      setError('')
    }
  }, [open, farm])

  const isPending = createFarm.isPending || updateFarm.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isEditing) {
      updateFarm.mutate(
        {
          data: {
            farmId: farm.id,
            name: formData.name,
            location: formData.location,
            type: formData.type,
          },
        },
        {
          onSuccess: () => onOpenChange(false),
          onError: (err) =>
            setError(
              err instanceof Error ? err.message : t('farms:error.update'),
            ),
        },
      )
    } else {
      createFarm.mutate(
        {
          data: {
            name: formData.name,
            location: formData.location,
            type: formData.type,
          },
        },
        {
          onSuccess: (farmId) => {
            if (onboardingMode && onSuccess && farmId) {
              onSuccess(farmId, formData.type)
            } else {
              onOpenChange(false)
            }
          },
          onError: (err) =>
            setError(
              err instanceof Error ? err.message : t('farms:error.create'),
            ),
        },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isEditing
              ? t('farms:editFarm', { defaultValue: 'Edit Farm' })
              : t('farms:createNewFarm', {
                  defaultValue: 'Create New Farm',
                })}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('farms:editDescription', {
                  defaultValue: 'Update the details of your farm',
                })
              : t('farms:createDescription', {
                  defaultValue: 'Enter the basic information for your new farm',
                })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('farms:farmName', { defaultValue: 'Farm Name' })}
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder={t('farms:namePlaceholder', {
                defaultValue: 'e.g. Green Valley Farms',
              })}
              required
              className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="location"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('farms:location', { defaultValue: 'Location' })}
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
              placeholder={t('farms:locationPlaceholder', {
                defaultValue: 'e.g. Lagos, Nigeria',
              })}
              required
              className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="type"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('farms:farmType', { defaultValue: 'Farm Type' })}
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => {
                if (value) {
                  setFormData((prev) => ({
                    ...prev,
                    type: value as FarmType,
                  }))
                }
              }}
            >
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="poultry">
                  🐔{' '}
                  {t('common:livestock.poultry', {
                    defaultValue: 'Poultry',
                  })}
                </SelectItem>
                <SelectItem value="aquaculture">
                  🐟{' '}
                  {t('common:livestock.aquaculture', {
                    defaultValue: 'Aquaculture',
                  })}
                </SelectItem>
                <SelectItem value="cattle">
                  🐄{' '}
                  {t('common:livestock.cattle', {
                    defaultValue: 'Cattle',
                  })}
                </SelectItem>
                <SelectItem value="goats">
                  🐐{' '}
                  {t('common:livestock.goats', {
                    defaultValue: 'Goats',
                  })}
                </SelectItem>
                <SelectItem value="sheep">
                  🐑{' '}
                  {t('common:livestock.sheep', {
                    defaultValue: 'Sheep',
                  })}
                </SelectItem>
                <SelectItem value="bees">
                  🐝{' '}
                  {t('common:livestock.bees', {
                    defaultValue: 'Bees',
                  })}
                </SelectItem>
                <SelectItem value="mixed">
                  🏠{' '}
                  {t('common:livestock.mixed', {
                    defaultValue: 'Mixed (Poultry + Fish)',
                  })}
                </SelectItem>
                <SelectItem value="multi">
                  🌐{' '}
                  {t('common:livestock.multi', {
                    defaultValue: 'Multi (Custom Selection)',
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

          <DialogFooter>
            {onboardingMode && onSkip ? (
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                disabled={isPending}
              >
                {t('common:skip', { defaultValue: 'Skip' })}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {t('common:cancel', { defaultValue: 'Cancel' })}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isPending || !formData.name || !formData.location}
            >
              {isPending
                ? isEditing
                  ? t('common:saving', {
                      defaultValue: 'Saving...',
                    })
                  : t('common:creating', {
                      defaultValue: 'Creating...',
                    })
                : isEditing
                  ? t('common:saveChanges', {
                      defaultValue: 'Save Changes',
                    })
                  : t('farms:createFarm', {
                      defaultValue: 'Create Farm',
                    })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
