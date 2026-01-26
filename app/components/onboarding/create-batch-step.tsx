import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Package } from 'lucide-react'
import { toast } from 'sonner'
import { useOnboarding } from '~/features/onboarding/context'
import { getSpeciesForLivestockTypeFn } from '~/features/breeds/server'
import { createBatchFn } from '~/features/batches/server'
import { useFormatCurrency } from '~/features/settings'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

const availableTypes = [
  { value: 'poultry', label: '🐔 Poultry' },
  { value: 'fish', label: '🐟 Fish' },
  { value: 'cattle', label: '🐄 Cattle' },
  { value: 'goats', label: '🐐 Goats' },
  { value: 'sheep', label: '🐑 Sheep' },
  { value: 'bees', label: '🐝 Bees' },
] as const

type LivestockType = (typeof availableTypes)[number]['value']

export function CreateBatchStep() {
  const { t } = useTranslation(['onboarding', 'common', 'batches'])
  const { completeStep, skipStep, progress, setBatchId } = useOnboarding()
  const { symbol: currencySymbol } = useFormatCurrency()

  const [formData, setFormData] = useState({
    livestockType: 'poultry' as LivestockType,
    species: '',
    initialQuantity: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    costPerUnit: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [speciesOptions, setSpeciesOptions] = useState<Array<{ value: string; label: string }>>([])
  const [isLoadingSpecies, setIsLoadingSpecies] = useState(false)

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
    // Reset species when livestock type changes
    setFormData((p) => ({ ...p, species: '' }))
  }, [formData.livestockType])

  if (!progress.farmId) {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 text-yellow-600">
          <Package className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">
          {t('createBatch.farmFirst.title', {
            defaultValue: 'Create a Farm First',
          })}
        </h2>
        <p className="text-muted-foreground">
          {t('createBatch.farmFirst.desc', {
            defaultValue: 'You need a farm before adding batches.',
          })}
        </p>
        <Button onClick={skipStep}>
          {t('common:continue', { defaultValue: 'Continue anyway' })}
        </Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const batchId = await createBatchFn({
        data: {
          batch: {
            farmId: progress.farmId!,
            livestockType: formData.livestockType,
            species: formData.species,
            initialQuantity: parseInt(formData.initialQuantity),
            acquisitionDate: new Date(formData.acquisitionDate),
            costPerUnit: parseFloat(formData.costPerUnit),
          },
        },
      })
      if (batchId) setBatchId(batchId)
      toast.success(t('createBatch.success', { defaultValue: 'Batch created' }))
      completeStep('create-batch')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('createBatch.error', { defaultValue: 'Failed to create batch' }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
          <Package className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">
          {t('createBatch.title', { defaultValue: 'Create Your First Batch' })}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t('createBatch.desc', {
            defaultValue: 'A batch is a group of livestock acquired together.',
          })}
        </p>
      </div>
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>
                {t('batches:form.type', { defaultValue: 'Livestock Type' })}
              </Label>
              <Select
                value={formData.livestockType}
                onValueChange={(v) =>
                  v &&
                  setFormData((p) => ({ ...p, livestockType: v, species: '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {t('batches:form.species', { defaultValue: 'Species' })}
              </Label>
              <Select
                value={formData.species}
                onValueChange={(v) =>
                  v && setFormData((p) => ({ ...p, species: v }))
                }
                disabled={isLoadingSpecies}
              >
                <SelectTrigger>
                  <SelectValue>
                    {isLoadingSpecies
                      ? 'Loading...'
                      : formData.species ||
                        t('batches:form.selectSpecies', {
                          defaultValue: 'Select species',
                        })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {speciesOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t('batches:form.quantity', { defaultValue: 'Quantity' })}
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.initialQuantity}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      initialQuantity: e.target.value,
                    }))
                  }
                  placeholder="500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('batches:form.costPerUnit', {
                    defaultValue: 'Cost per Unit',
                  })}{' '}
                  ({currencySymbol})
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPerUnit}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, costPerUnit: e.target.value }))
                  }
                  placeholder="350"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>
                {t('batches:form.acquisitionDate', {
                  defaultValue: 'Acquisition Date',
                })}
              </Label>
              <Input
                type="date"
                value={formData.acquisitionDate}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    acquisitionDate: e.target.value,
                  }))
                }
                required
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={skipStep}
                disabled={isSubmitting}
              >
                {t('common:skip', { defaultValue: 'Skip' })}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  isSubmitting ||
                  !formData.species ||
                  !formData.initialQuantity ||
                  !formData.costPerUnit
                }
              >
                {isSubmitting
                  ? t('createBatch.form.submitting', {
                      defaultValue: 'Creating...',
                    })
                  : t('createBatch.form.submit', {
                      defaultValue: 'Create Batch',
                    })}{' '}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
