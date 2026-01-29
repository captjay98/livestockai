/**
 * CreateFarmStep - Onboarding step for creating a farm and enabling modules
 *
 * This step combines farm creation with module selection:
 * - Uses FarmDialog in onboarding mode for farm creation
 * - Auto-selects modules based on farm type
 * - For 'multi' farm type, shows module selection UI
 * - Persists modules to farm_modules table via toggleModuleFn
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, Home, Layers } from 'lucide-react'
import { toast } from 'sonner'
import type { ModuleKey } from '~/features/modules/types'
import { useOnboarding } from '~/features/onboarding/context'
import { toggleModuleFn } from '~/features/modules/server'
import { getDefaultModulesForFarmType } from '~/features/modules/utils'
import { MODULE_METADATA } from '~/features/modules/constants'
import { FarmDialog } from '~/components/dialogs/farm-dialog'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

type FarmCreationPhase = 'farm' | 'modules'

const ALL_MODULES: Array<ModuleKey> = [
  'poultry',
  'aquaculture',
  'cattle',
  'goats',
  'sheep',
  'bees',
]

export function CreateFarmStep() {
  const { t } = useTranslation(['onboarding', 'common', 'farms'])
  const { completeStep, setFarmId, setEnabledModules, skipStep } =
    useOnboarding()

  // Phase: 'farm' for farm creation, 'modules' for module selection (multi type only)
  const [phase, setPhase] = useState<FarmCreationPhase>('farm')
  const [createdFarmId, setCreatedFarmId] = useState<string | null>(null)
  const [selectedModules, setSelectedModules] = useState<Array<ModuleKey>>([
    'poultry',
    'aquaculture',
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle farm creation success
  const handleFarmCreated = async (farmId: string, farmType: string) => {
    setCreatedFarmId(farmId)
    setFarmId(farmId)

    // For 'multi' farm type, show module selection UI
    if (farmType === 'multi') {
      setPhase('modules')
      return
    }

    // For other farm types, auto-select modules and persist
    const modulesToEnable = getDefaultModulesForFarmType(farmType)
    await persistModulesAndComplete(farmId, modulesToEnable)
  }

  // Persist modules to database and complete step
  const persistModulesAndComplete = async (
    farmId: string,
    modules: Array<ModuleKey>,
  ) => {
    setIsSubmitting(true)
    try {
      // Enable each module in the database
      for (const moduleKey of modules) {
        await toggleModuleFn({
          data: { farmId, moduleKey, enabled: true },
        })
      }

      setEnabledModules(modules)
      completeStep('create-farm')
    } catch (err) {
      toast.error(
        t('createFarm.moduleError', {
          defaultValue: 'Failed to enable modules',
        }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle module selection confirmation for 'multi' farm type
  const handleModulesConfirmed = async () => {
    if (!createdFarmId || selectedModules.length === 0) return
    await persistModulesAndComplete(createdFarmId, selectedModules)
  }

  // Toggle module selection
  const handleToggleModule = (key: ModuleKey) => {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  // Phase 1: Farm creation using FarmDialog
  if (phase === 'farm') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
            <Home className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold">
            {t('createFarm.title', {
              defaultValue: 'Create Your Farm',
            })}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('createFarm.desc', {
              defaultValue:
                'A farm is your main workspace with its own batches and records.',
            })}
          </p>
        </div>

        <FarmDialog
          open={true}
          onOpenChange={() => {}}
          onboardingMode={true}
          onSuccess={handleFarmCreated}
          onSkip={skipStep}
        />
      </div>
    )
  }

  // Phase 2: Module selection for 'multi' farm type
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
          <Layers className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">
          {t('enableModules.title', {
            defaultValue: 'Choose Your Modules',
          })}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t('enableModules.desc', {
            defaultValue: 'Select the livestock types you manage on this farm.',
          })}
        </p>
      </div>

      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6 space-y-3">
          {ALL_MODULES.map((key) => {
            const m = MODULE_METADATA[key]
            const selected = selectedModules.includes(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleToggleModule(key)}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all w-full ${
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-3xl">{m.icon}</div>
                <div className="flex-1">
                  <span className="font-semibold">{m.name}</span>
                  <p className="text-sm text-muted-foreground">
                    {m.description}
                  </p>
                </div>
                {selected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3 pt-4">
        <Button variant="outline" onClick={skipStep}>
          {t('common:skip', { defaultValue: 'Skip' })}
        </Button>
        <Button
          onClick={handleModulesConfirmed}
          disabled={selectedModules.length === 0 || isSubmitting}
        >
          {isSubmitting
            ? t('common:saving', { defaultValue: 'Saving...' })
            : t('common:continue', { defaultValue: 'Continue' })}{' '}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
