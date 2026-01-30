import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { ModuleKey } from '~/features/modules/types'
import { useErrorMessage } from '~/hooks/useErrorMessage'
import { SOURCE_SIZE_OPTIONS } from '~/features/batches/server'
import { useFarm } from '~/features/farms/context'
import { useFormatCurrency } from '~/features/settings'
import { filterLivestockTypesByModules } from '~/features/modules/utils'
import { useBatchMutations } from '~/features/batches/mutations'
import { useBreeds, useSpecies } from '~/features/batches/queries'
import { BreedRequestDialog } from '~/components/breeds/breed-request-dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'
import { Alert, AlertDescription } from '~/components/ui/alert'

export interface BatchFormProps {
  onSuccess?: (batchId: string) => void
  onCancel?: () => void
  onboardingMode?: boolean
  farmIdOverride?: string
  structureIdOverride?: string
  enabledModulesFilter?: Array<ModuleKey>
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

export function BatchForm({
  onSuccess,
  onCancel,
  onboardingMode,
  farmIdOverride,
  structureIdOverride,
  enabledModulesFilter,
}: BatchFormProps) {
  const { t } = useTranslation(['batches', 'common'])
  const getErrorMessage = useErrorMessage()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectedFarmId, structures, suppliers } = useFarm()
  const { symbol: currencySymbol } = useFormatCurrency()

  const effectiveFarmId = onboardingMode ? farmIdOverride : selectedFarmId

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

  const { data: speciesOptions = [], isLoading: isLoadingSpecies } = useSpecies(
    formData.livestockType,
  )
  const { data: breeds = [], isLoading: isLoadingBreeds } = useBreeds(
    formData.species,
  )
  const { createBatch } = useBatchMutations()

  const [error, setError] = useState('')
  const [showAdditional, setShowAdditional] = useState(false)
  const [showBreedRequestDialog, setShowBreedRequestDialog] = useState(false)

  useEffect(() => {
    if (breeds.length > 0) {
      const defaultBreed = breeds.find((b) => b.isDefault)
      if (defaultBreed) {
        setFormData((prev) => ({
          ...prev,
          breedId: defaultBreed.id,
        }))
      }
    }
  }, [breeds])
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

    if (!formData.livestockType) {
      setError(
        t('messages.selectType', {
          defaultValue: 'Please select livestock type',
        }),
      )
      return
    }
    if (!formData.species) {
      setError(
        t('messages.selectSpecies', { defaultValue: 'Please select species' }),
      )
      return
    }
    if (!formData.initialQuantity) {
      setError(
        t('messages.enterQuantity', {
          defaultValue: 'Please enter initial quantity',
        }),
      )
      return
    }
    if (!formData.costPerUnit) {
      setError(
        t('messages.enterPrice', {
          defaultValue: 'Please enter cost per unit',
        }),
      )
      return
    }

    setError('')

    createBatch.mutate(
      {
        batch: {
          farmId: effectiveFarmId,
          livestockType: formData.livestockType as any,
          species: formData.species,
          initialQuantity: parseInt(formData.initialQuantity),
          costPerUnit: parseFloat(formData.costPerUnit),
          acquisitionDate: new Date(formData.acquisitionDate),
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
          if (onSuccess) {
            onSuccess(batchId)
          }

          if (!onboardingMode) {
            queryClient.invalidateQueries({
              queryKey: ['farm-modules', effectiveFarmId],
            })
            router.invalidate()
          }
        },
        onError: (err: any) => {
          console.error('Batch creation failed:', err)
          const message = getErrorMessage(err)
          if (err.data && typeof err.data === 'object') {
            setError(JSON.stringify(err.data))
          } else {
            setError(message)
          }
        },
      },
    )
  }

  const sourceSizeOptions = useMemo(() => {
    if (!formData.livestockType) return []
    const baseOptions = SOURCE_SIZE_OPTIONS[formData.livestockType]
    const selectedBreed = breeds.find((b) => b.id === formData.breedId)
    if (selectedBreed && selectedBreed.sourceSizes.length > 0) {
      return baseOptions.filter((opt) =>
        selectedBreed.sourceSizes.includes(opt.value),
      )
    }
    return baseOptions
  }, [formData.livestockType, formData.breedId, breeds])

  return (
    <>
      {!effectiveFarmId && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a farm from the header before adding a batch.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="livestockType"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
          >
            {t('livestockType', { defaultValue: 'Livestock Type' })}
          </Label>
          <Select
            value={formData.livestockType}
            onValueChange={(value) =>
              value &&
              setFormData((prev) => ({
                ...prev,
                livestockType: value as any,
                species: '',
                breedId: '',
                sourceSize: '',
              }))
            }
            disabled={!effectiveFarmId}
          >
            <SelectTrigger
              className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
              style={{ color: 'var(--text-landing-primary)' }}
            >
              <SelectValue>
                {formData.livestockType
                  ? livestockTypes.find(
                      (lt) => lt.value === formData.livestockType,
                    )?.label
                  : t('placeholders.selectType', {
                      defaultValue: 'Select type',
                    })}
              </SelectValue>
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

        {formData.livestockType && (
          <div className="space-y-2">
            <Label
              htmlFor="species"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('species')}
            </Label>
            <Select
              value={formData.species}
              onValueChange={(value) =>
                value &&
                setFormData((prev) => ({
                  ...prev,
                  species: value,
                  breedId: '',
                }))
              }
              disabled={isLoadingSpecies}
            >
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                <SelectValue>
                  {isLoadingSpecies
                    ? t('common:loading')
                    : formData.species
                      ? speciesOptions.find((s) => s.value === formData.species)
                          ?.label
                      : t('placeholders.selectSpecies', {
                          defaultValue: 'Select species',
                        })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {speciesOptions.map((species) => (
                  <SelectItem key={species.value} value={species.value}>
                    {species.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.species && breeds.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="breedId"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
              >
                {t('breed')}
              </Label>
              {isLoadingBreeds && (
                <span className="text-[10px] text-muted-foreground animate-pulse">
                  {t('common:loading')}
                </span>
              )}
            </div>
            <Select
              value={formData.breedId || ''}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  breedId: value || '',
                }))
              }
            >
              <SelectTrigger
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                <SelectValue>
                  {formData.breedId
                    ? breeds.find((b) => b.id === formData.breedId)?.displayName
                    : t('placeholders.selectBreed', {
                        defaultValue: 'Select breed',
                      })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {breeds.map((breed) => (
                  <SelectItem key={breed.id} value={breed.id}>
                    {breed.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.species && (
              <p className="text-xs text-muted-foreground">
                Don't see your breed?{' '}
                <button
                  type="button"
                  onClick={() => setShowBreedRequestDialog(true)}
                  className="text-primary underline hover:no-underline"
                >
                  Request it here
                </button>
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="initialQuantity"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('common:quantity')}
            </Label>
            <Input
              id="initialQuantity"
              type="number"
              min="1"
              value={formData.initialQuantity}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  initialQuantity: e.target.value,
                }))
              }
              placeholder={t('batches:placeholders.quantity', {
                defaultValue: '100',
              })}
              required
              className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="costPerUnit"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
            >
              {t('common:price')} ({currencySymbol})
            </Label>
            <Input
              id="costPerUnit"
              type="number"
              min="0"
              step="0.01"
              value={formData.costPerUnit}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  costPerUnit: e.target.value,
                }))
              }
              placeholder={t('batches:placeholders.unitPrice', {
                defaultValue: '500',
              })}
              required
              className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
              style={{ color: 'var(--text-landing-primary)' }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="acquisitionDate"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
          >
            {t('common:date')}
          </Label>
          <Input
            id="acquisitionDate"
            type="date"
            value={formData.acquisitionDate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                acquisitionDate: e.target.value,
              }))
            }
            required
            className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
            style={{ color: 'var(--text-landing-primary)' }}
          />
        </div>

        <Collapsible open={showAdditional} onOpenChange={setShowAdditional}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              type="button"
              className="w-full justify-between p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
            >
              <span>
                {t('additionalDetails', { defaultValue: 'Additional Details' })}
              </span>
              {showAdditional ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label
                htmlFor="batchName"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
              >
                {t('batchName', { defaultValue: 'Batch Name' })} (
                {t('common:optional', { defaultValue: 'Optional' })})
              </Label>
              <Input
                id="batchName"
                value={formData.batchName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    batchName: e.target.value,
                  }))
                }
                placeholder={t('batchNamePlaceholder', {
                  defaultValue: 'e.g., JAN-2026-BR-01',
                })}
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              />
            </div>

            {formData.livestockType && (
              <div className="space-y-2">
                <Label
                  htmlFor="sourceSize"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
                >
                  {t('sourceSize', { defaultValue: 'Source Size' })} (
                  {t('common:optional', { defaultValue: 'Optional' })})
                </Label>
                <Select
                  value={formData.sourceSize}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      sourceSize: value || '',
                    }))
                  }
                >
                  <SelectTrigger
                    className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                    style={{ color: 'var(--text-landing-primary)' }}
                  >
                    <SelectValue>
                      {formData.sourceSize
                        ? sourceSizeOptions.find(
                            (s) => s.value === formData.sourceSize,
                          )?.label
                        : t('selectSourceSize', {
                            defaultValue: 'Select source size',
                          })}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {sourceSizeOptions.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {structures.length > 0 && (
              <div className="space-y-2">
                <Label
                  htmlFor="structureId"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
                >
                  {t('structure', { defaultValue: 'Structure' })} (
                  {t('common:optional', { defaultValue: 'Optional' })})
                </Label>
                <Select
                  value={formData.structureId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      structureId: value || '',
                    }))
                  }
                >
                  <SelectTrigger
                    className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                    style={{ color: 'var(--text-landing-primary)' }}
                  >
                    <SelectValue>
                      {formData.structureId
                        ? structures.find((s) => s.id === formData.structureId)
                            ?.name
                        : t('selectStructure', {
                            defaultValue: 'Select structure',
                          })}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {structures.map((structure) => (
                      <SelectItem key={structure.id} value={structure.id}>
                        {structure.name} ({structure.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {suppliers.length > 0 && (
              <div className="space-y-2">
                <Label
                  htmlFor="supplierId"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
                >
                  {t('supplier', { defaultValue: 'Supplier' })} (
                  {t('common:optional', { defaultValue: 'Optional' })})
                </Label>
                <Select
                  value={formData.supplierId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      supplierId: value || '',
                    }))
                  }
                >
                  <SelectTrigger
                    className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                    style={{ color: 'var(--text-landing-primary)' }}
                  >
                    <SelectValue>
                      {formData.supplierId
                        ? suppliers.find((s) => s.id === formData.supplierId)
                            ?.name
                        : t('selectSupplier', {
                            defaultValue: 'Select supplier',
                          })}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="targetHarvestDate"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
              >
                {t('targetHarvestDate', {
                  defaultValue: 'Target Harvest Date',
                })}{' '}
                ({t('common:optional', { defaultValue: 'Optional' })})
              </Label>
              <Input
                id="targetHarvestDate"
                type="date"
                value={formData.targetHarvestDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetHarvestDate: e.target.value,
                  }))
                }
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="targetPricePerUnit"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
              >
                {t('targetPrice', { defaultValue: 'Target Price' })} (
                {currencySymbol})
              </Label>
              <Input
                id="targetPricePerUnit"
                type="number"
                step="0.01"
                min="0"
                value={formData.targetPricePerUnit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetPricePerUnit: e.target.value,
                  }))
                }
                placeholder={t('batches:placeholders.avgWeight', {
                  defaultValue: '1500',
                })}
                className="h-11 bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm px-4 rounded-xl"
                style={{ color: 'var(--text-landing-primary)' }}
              />
              <p className="text-xs text-muted-foreground pl-1">
                {t('targetPriceHelp', {
                  defaultValue:
                    'Expected price per unit at harvest (for revenue forecasting)',
                })}
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="notes"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1"
              >
                {t('common:notes', { defaultValue: 'Notes' })} (
                {t('common.optional', { defaultValue: 'Optional' })})
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder={t('notesPlaceholder', {
                  defaultValue: 'Any additional notes about this batch...',
                })}
                rows={3}
                className="bg-black/5 dark:bg-white/5 border-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-medium text-sm p-4 rounded-xl resize-none"
                style={{ color: 'var(--text-landing-primary)' }}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        <div
          className={`flex items-center ${onboardingMode ? 'justify-end gap-3' : 'justify-end gap-3'}`}
        >
          {onboardingMode && onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={createBatch.isPending}
              className="h-11 rounded-xl hover:bg-white/5"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              {t('common:skip', { defaultValue: 'Skip' })}
            </Button>
          )}
          {!onboardingMode && onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={createBatch.isPending}
              className="h-11 rounded-xl hover:bg-white/5"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              {t('common:cancel', { defaultValue: 'Cancel' })}
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
            className="h-11 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-xl font-bold tracking-wide px-8"
          >
            {createBatch.isPending
              ? t('common:saving', { defaultValue: 'Creating...' })
              : t('create')}
          </Button>
        </div>
      </form>

      <BreedRequestDialog
        open={showBreedRequestDialog}
        onOpenChange={setShowBreedRequestDialog}
        moduleKey={formData.livestockType as any}
        speciesKey={formData.species}
      />
    </>
  )
}
