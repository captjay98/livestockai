/**
 * CreateStructureStep - Onboarding step for creating a farm structure (optional)
 *
 * This step allows users to create their first structure (house, pond, pen, etc.)
 * or skip if they want to add structures later.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Building } from 'lucide-react'
import { toast } from 'sonner'
import type { StructureType } from '~/features/modules/types'
import { useOnboarding } from '~/features/onboarding/context'
import { createStructureFn } from '~/features/structures/server'
import { MODULE_METADATA } from '~/features/modules/constants'
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

// Structure types with labels (subset of all types for onboarding)
const STRUCTURE_TYPES: Array<{ value: StructureType; label: string }> = [
  { value: 'house', label: '🏠 House (Poultry)' },
  { value: 'pond', label: '🌊 Pond (Fish)' },
  { value: 'pen', label: '🏗️ Pen' },
  { value: 'cage', label: '🗄️ Cage' },
  { value: 'barn', label: '🏚️ Barn' },
  { value: 'pasture', label: '🌿 Pasture' },
  { value: 'hive', label: '🐝 Hive' },
]

export function CreateStructureStep() {
  const { t } = useTranslation(['onboarding', 'common', 'structures'])
  const { completeStep, skipStep, progress, setStructureId, enabledModules } =
    useOnboarding()

  const [formData, setFormData] = useState({
    name: '',
    type: '' as StructureType | '',
    capacity: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Filter structure types based on enabled modules
  const availableStructureTypes = STRUCTURE_TYPES.filter((st) => {
    // If no modules enabled, show all
    if (enabledModules.length === 0) return true

    // Check if any enabled module supports this structure type
    return enabledModules.some((moduleKey) => {
      const metadata = MODULE_METADATA[moduleKey]
      return metadata.structureTypes.includes(st.value)
    })
  })

  // If no farm was created, show skip message
  if (!progress.farmId) {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground">
          <Building className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">
          {t('createStructure.noFarm.title', {
            defaultValue: 'Create a Farm First',
          })}
        </h2>
        <p className="text-muted-foreground">
          {t('createStructure.noFarm.desc', {
            defaultValue: 'You need a farm before adding structures.',
          })}
        </p>
        <Button onClick={skipStep}>
          {t('common:continue', { defaultValue: 'Continue' })}
        </Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.type) return

    setIsSubmitting(true)
    setError('')

    try {
      const structureId = await createStructureFn({
        data: {
          input: {
            farmId: progress.farmId!,
            name: formData.name,
            type: formData.type,
            capacity: formData.capacity ? parseInt(formData.capacity) : null,
            status: 'active',
          },
        },
      })

      if (structureId) {
        setStructureId(structureId)
      }

      toast.success(
        t('createStructure.success', {
          defaultValue: 'Structure created',
        }),
      )
      completeStep('create-structure')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('createStructure.error', {
              defaultValue: 'Failed to create structure',
            }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
          <Building className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">
          {t('createStructure.title', {
            defaultValue: 'Add a Structure',
          })}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t('createStructure.desc', {
            defaultValue:
              'Structures help organize your livestock (houses, ponds, pens).',
          })}
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {t('structures:name', {
                  defaultValue: 'Structure Name',
                })}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    name: e.target.value,
                  }))
                }
                placeholder={t('structures:namePlaceholder', {
                  defaultValue: 'e.g., House A, Pond 1',
                })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                {t('structures:type', {
                  defaultValue: 'Structure Type',
                })}
              </Label>
              <Select
                value={formData.type}
                onValueChange={(v) =>
                  v &&
                  setFormData((p) => ({
                    ...p,
                    type: v as StructureType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('structures:selectType', {
                      defaultValue: 'Select type',
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableStructureTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">
                {t('structures:capacity', {
                  defaultValue: 'Capacity',
                })}{' '}
                ({t('common:optional', { defaultValue: 'Optional' })})
              </Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    capacity: e.target.value,
                  }))
                }
                placeholder={t('structures:capacityPlaceholder', {
                  defaultValue: 'e.g., 500',
                })}
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
                disabled={isSubmitting || !formData.name || !formData.type}
              >
                {isSubmitting
                  ? t('common:creating', {
                      defaultValue: 'Creating...',
                    })
                  : t('createStructure.submit', {
                      defaultValue: 'Create Structure',
                    })}{' '}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {t('createStructure.tip', {
            defaultValue:
              'You can add more structures later from the Farms page.',
          })}
        </p>
      </div>
    </div>
  )
}
