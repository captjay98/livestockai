import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Users } from 'lucide-react'
import type { ModuleKey } from '~/features/modules/types'
import { useErrorMessage } from '~/hooks/useErrorMessage'
import { useBatchMutations } from '~/features/batches/mutations'
import { useFarm } from '~/features/farms/context'
import { filterLivestockTypesByModules } from '~/features/modules/utils'
import { Button } from '~/components/ui/button'
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
import { Alert, AlertDescription } from '~/components/ui/alert'

interface BatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Onboarding mode props
  onboardingMode?: boolean
  farmIdOverride?: string
  structureIdOverride?: string
  enabledModulesFilter?: Array<ModuleKey>
  onSuccess?: (batchId: string) => void
  onSkip?: () => void
}

const getLivestockTypes = (t: any) => [
  {
    value: 'poultry',
    label: t('batches:poultry', { defaultValue: 'Poultry' }),
  },
  { value: 'fish', label: t('batches:fish', { defaultValue: 'Fish' }) },
  { value: 'cattle', label: t('batches:cattle', { defaultValue: 'Cattle' }) },
  { value: 'goats', label: t('batches:goats', { defaultValue: 'Goats' }) },
  { value: 'sheep', label: t('batches:sheep', { defaultValue: 'Sheep' }) },
  { value: 'bees', label: t('batches:bees', { defaultValue: 'Bees' }) },
]

export function BatchDialog({
  open,
  onOpenChange,
  onboardingMode,
  farmIdOverride,
  structureIdOverride,
  enabledModulesFilter,
  onSuccess,
  onSkip,
}: BatchDialogProps) {
  const { t } = useTranslation(['batches', 'common'])
  const getErrorMessage = useErrorMessage()
  const { createBatch } = useBatchMutations()
  const { selectedFarmId } = useFarm()

  // Use farmIdOverride in onboarding mode, otherwise use selectedFarmId
  const effectiveFarmId = onboardingMode ? farmIdOverride : selectedFarmId

  // Filter livestock types based on enabled modules
  const allLivestockTypes = getLivestockTypes(t)
  const livestockTypes = useMemo(() => {
    if (enabledModulesFilter && enabledModulesFilter.length > 0) {
      return filterLivestockTypesByModules(
        allLivestockTypes,
        enabledModulesFilter,
      )
    }
    return allLivestockTypes
  }, [allLivestockTypes, enabledModulesFilter])

  const [formData, setFormData] = useState({
    livestockType: '' as 'poultry' | 'fish' | '',
    species: '',
    initialQuantity: '',
    costPerUnit: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    // Enhanced fields
    batchName: '',
    sourceSize: '',
    structureId: '',
    targetHarvestDate: '',
    target_weight_g: '',
    targetPricePerUnit: '',
    supplierId: '',
    breedId: '',
    notes: '',
  })
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!effectiveFarmId) {
      setError(
        t('messages.selectFarm', {
          defaultValue: 'Please select a farm first',
        }),
      )
      return
    }
    if (!formData.livestockType) return
    setError('')

    createBatch.mutate(
      {
        batch: {
          farmId: effectiveFarmId,
          livestockType: formData.livestockType,
          species: formData.species,
          initialQuantity: parseInt(formData.initialQuantity),
          costPerUnit: parseFloat(formData.costPerUnit),
          acquisitionDate: new Date(formData.acquisitionDate),
          // Enhanced fields
          batchName: formData.batchName || null,
          sourceSize: formData.sourceSize || null,
          structureId: formData.structureId || structureIdOverride || null,
          targetHarvestDate: formData.targetHarvestDate
            ? new Date(formData.targetHarvestDate)
            : null,
          target_weight_g: formData.target_weight_g
            ? parseInt(formData.target_weight_g)
            : null,
          targetPricePerUnit: formData.targetPricePerUnit
            ? parseFloat(formData.targetPricePerUnit)
            : null,
          supplierId: formData.supplierId || null,
          breedId: formData.breedId || null,
          notes: formData.notes || null,
        },
      },
      {
        onSuccess: (batchId: string) => {
          // In onboarding mode, call onSuccess callback
          if (onboardingMode && onSuccess && batchId) {
            onSuccess(batchId)
          } else {
            onOpenChange(false)
            setFormData({
              livestockType: '',
              species: '',
              initialQuantity: '',
              costPerUnit: '',
              acquisitionDate: new Date().toISOString().split('T')[0],
              batchName: '',
              sourceSize: '',
              structureId: '',
              targetHarvestDate: '',
              target_weight_g: '',
              targetPricePerUnit: '',
              supplierId: '',
              breedId: '',
              notes: '',
            })
          }
        },
        onError: (err: Error) => setError(getErrorMessage(err)),
      },
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('create')}
            </DialogTitle>
            <DialogDescription>
              {t('description', {
                defaultValue: 'Create a new livestock batch',
              })}
            </DialogDescription>
          </DialogHeader>

          {!effectiveFarmId && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select a farm from the header before adding a batch.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="livestockType">
                {t('livestockType')} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.livestockType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    livestockType: value as 'poultry' | 'fish',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectLivestockType')} />
                </SelectTrigger>
                <SelectContent>
                  {livestockTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {onboardingMode && onSkip ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSkip}
                  disabled={createBatch.isPending}
                >
                  {t('common:skip', { defaultValue: 'Skip' })}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={createBatch.isPending}
                >
                  {t('common:cancel', {
                    defaultValue: 'Cancel',
                  })}
                </Button>
              )}
              <Button
                type="submit"
                disabled={
                  createBatch.isPending ||
                  !formData.livestockType ||
                  !formData.species ||
                  !formData.initialQuantity ||
                  !formData.costPerUnit
                }
              >
                {createBatch.isPending
                  ? t('common:saving', {
                      defaultValue: 'Creating...',
                    })
                  : t('create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
