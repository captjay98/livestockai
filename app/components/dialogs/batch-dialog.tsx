import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ChevronDown, ChevronUp, Users } from 'lucide-react'
import type { Breed } from '~/features/breeds/types'
import { useErrorMessage } from '~/hooks/useErrorMessage'
import { SOURCE_SIZE_OPTIONS, createBatchFn } from '~/features/batches/server'
import { useFarm } from '~/features/farms/context'
import { useFormatCurrency } from '~/features/settings'
import {
  getBreedsForSpeciesFn,
  getSpeciesForLivestockTypeFn,
  submitBreedRequestFn,
} from '~/features/breeds/server'
import { BreedRequestDialog } from '~/components/dialogs/breed-request-dialog'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'
import { Alert, AlertDescription } from '~/components/ui/alert'

interface BatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const getLivestockTypes = (t: any) => [
  {
    value: 'poultry',
    label: t('batches:poultry', { defaultValue: 'Poultry' }),
  },
  { value: 'fish', label: t('batches:fish', { defaultValue: 'Fish' }) },
]

export function BatchDialog({ open, onOpenChange }: BatchDialogProps) {
  const { t } = useTranslation(['batches', 'common'])
  const getErrorMessage = useErrorMessage()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectedFarmId, structures, suppliers } = useFarm()
  const { symbol: currencySymbol } = useFormatCurrency()
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
  const [breeds, setBreeds] = useState<Array<Breed>>([])
  const [speciesOptions, setSpeciesOptions] = useState<
    Array<{ value: string; label: string }>
  >([])
  const [isLoadingBreeds, setIsLoadingBreeds] = useState(false)
  const [isLoadingSpecies, setIsLoadingSpecies] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAdditional, setShowAdditional] = useState(false)
  const [showBreedRequestDialog, setShowBreedRequestDialog] = useState(false)

  // Fetch species when livestock type changes
  useEffect(() => {
    const fetchSpecies = async () => {
      if (!formData.livestockType) {
        setSpeciesOptions([])
        return
      }

      setIsLoadingSpecies(true)
      try {
        const result = await getSpeciesForLivestockTypeFn({
          data: { livestockType: formData.livestockType },
        })
        setSpeciesOptions(result)
      } catch (err) {
        console.error('Failed to fetch species:', err)
        setSpeciesOptions([])
      } finally {
        setIsLoadingSpecies(false)
      }
    }

    fetchSpecies()
    // Reset species, breed, and sourceSize when livestock type changes
    setFormData((prev) => ({
      ...prev,
      species: '',
      breedId: '',
      sourceSize: '',
    }))
    setBreeds([])
  }, [formData.livestockType])

  // Fetch breeds when species changes
  useEffect(() => {
    const fetchBreeds = async () => {
      if (!formData.species) {
        setBreeds([])
        return
      }

      setIsLoadingBreeds(true)
      try {
        const result = await getBreedsForSpeciesFn({
          data: { speciesKey: formData.species },
        })
        setBreeds(result)

        // Pre-select default breed if available
        const defaultBreed = result.find((b) => b.isDefault)
        if (defaultBreed) {
          setFormData((prev) => ({ ...prev, breedId: defaultBreed.id }))
        } else {
          setFormData((prev) => ({ ...prev, breedId: '' }))
        }
      } catch (err) {
        console.error('Failed to fetch breeds:', err)
      } finally {
        setIsLoadingBreeds(false)
      }
    }

    fetchBreeds()
  }, [formData.species])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmId) {
      if (!selectedFarmId) {
        setError(
          t('messages.selectFarm', {
            defaultValue: 'Please select a farm first',
          }),
        )
        return
      }
      return
    }
    if (!formData.livestockType) return
    setIsSubmitting(true)
    setError('')

    try {
      await createBatchFn({
        data: {
          batch: {
            farmId: selectedFarmId,
            livestockType: formData.livestockType,
            species: formData.species,
            initialQuantity: parseInt(formData.initialQuantity),
            costPerUnit: parseFloat(formData.costPerUnit),
            acquisitionDate: new Date(formData.acquisitionDate),
            // Enhanced fields
            batchName: formData.batchName || null,
            sourceSize: formData.sourceSize || null,
            structureId: formData.structureId || null,
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
      })
      toast.success(t('messages.created', { defaultValue: 'Batch created' }))
      onOpenChange(false)
      queryClient.invalidateQueries({
        queryKey: ['farm-modules', selectedFarmId],
      })
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
      setShowAdditional(false)
      router.invalidate()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const sourceSizeOptions = useMemo(() => {
    if (!formData.livestockType) return []

    const baseOptions = SOURCE_SIZE_OPTIONS[formData.livestockType]

    // If a breed is selected and has specific source sizes, filter the base options
    const selectedBreed = breeds.find((b) => b.id === formData.breedId)
    if (selectedBreed && selectedBreed.sourceSizes.length > 0) {
      return baseOptions.filter((opt) =>
        selectedBreed.sourceSizes.includes(opt.value),
      )
    }

    return baseOptions
  }, [formData.livestockType, formData.breedId, breeds])

  const livestockTypes = getLivestockTypes(t)

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

          {!selectedFarmId && (
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
                {t('livestockType', { defaultValue: 'Livestock Type' })}
              </Label>
              <Select
                value={formData.livestockType}
                onValueChange={(value) =>
                  value &&
                  setFormData((prev) => ({
                    ...prev,
                    livestockType: value,
                  }))
                }
                disabled={!selectedFarmId}
              >
                <SelectTrigger>
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
                <Label htmlFor="species">{t('species')}</Label>
                <Select
                  value={formData.species}
                  onValueChange={(value) =>
                    value &&
                    setFormData((prev) => ({ ...prev, species: value }))
                  }
                  disabled={isLoadingSpecies}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {isLoadingSpecies
                        ? 'Loading...'
                        : formData.species
                          ? speciesOptions.find(
                              (s) => s.value === formData.species,
                            )?.label
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
                  <Label htmlFor="breedId">{t('breed')}</Label>
                  {isLoadingBreeds && (
                    <span className="text-[10px] text-muted-foreground animate-pulse">
                      Loading...
                    </span>
                  )}
                </div>
                <Select
                  value={formData.breedId || ''}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, breedId: value || '' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      {formData.breedId
                        ? breeds.find((b) => b.id === formData.breedId)
                            ?.displayName
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="initialQuantity">{t('common:quantity')}</Label>
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
                  placeholder="100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPerUnit">
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
                  placeholder="500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisitionDate">{t('common:date')}</Label>
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
              />
            </div>

            {/* Additional Details Section */}
            <Collapsible open={showAdditional} onOpenChange={setShowAdditional}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="w-full justify-between p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                >
                  <span>
                    {t('additionalDetails', {
                      defaultValue: 'Additional Details',
                    })}
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
                  <Label htmlFor="batchName">
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
                  />
                </div>

                {formData.livestockType && (
                  <div className="space-y-2">
                    <Label htmlFor="sourceSize">
                      {t('sourceSize', { defaultValue: 'Source Size' })} (
                      {t('common:optional', { defaultValue: 'Optional' })})
                    </Label>
                    <Select
                      value={formData.sourceSize || undefined}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          sourceSize: value || '',
                        }))
                      }
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="structureId">
                      {t('structure', { defaultValue: 'Structure' })} (
                      {t('common:optional', { defaultValue: 'Optional' })})
                    </Label>
                    <Select
                      value={formData.structureId || undefined}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          structureId: value || '',
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {formData.structureId
                            ? structures.find(
                                (s) => s.id === formData.structureId,
                              )?.name
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
                    <Label htmlFor="supplierId">
                      {t('supplier', { defaultValue: 'Supplier' })} (
                      {t('common:optional', { defaultValue: 'Optional' })})
                    </Label>
                    <Select
                      value={formData.supplierId || undefined}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          supplierId: value || '',
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {formData.supplierId
                            ? suppliers.find(
                                (s) => s.id === formData.supplierId,
                              )?.name
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
                  <Label htmlFor="targetHarvestDate">
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetPricePerUnit">
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
                    placeholder="1500"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('targetPriceHelp', {
                      defaultValue:
                        'Expected price per unit at harvest (for revenue forecasting)',
                    })}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">
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
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

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
                disabled={
                  isSubmitting ||
                  !formData.livestockType ||
                  !formData.species ||
                  !formData.initialQuantity ||
                  !formData.costPerUnit
                }
              >
                {isSubmitting
                  ? t('common:saving', { defaultValue: 'Creating...' })
                  : t('create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BreedRequestDialog
        open={showBreedRequestDialog}
        onOpenChange={setShowBreedRequestDialog}
        onSubmit={async (data) => {
          await submitBreedRequestFn({
            data: {
              moduleKey: formData.livestockType,
              speciesKey: formData.species,
              ...data,
            },
          })
        }}
      />
    </>
  )
}
