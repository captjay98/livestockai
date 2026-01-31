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
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { ModuleKey } from '~/features/modules/types'
import { useOnboarding } from '~/features/onboarding/context'
import { toggleModuleFn } from '~/features/modules/server'
import { getDefaultModulesForFarmType } from '~/features/modules/utils'
import { MODULE_METADATA } from '~/features/modules/constants'
import { FarmDialog } from '~/components/farms/farm-dialog'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

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
      // Enable all modules in parallel
      await Promise.all(
        modules.map((moduleKey) =>
          toggleModuleFn({
            data: { farmId, moduleKey, enabled: true },
          }),
        ),
      )

      setEnabledModules(modules)
      toast.success(
        t('createFarm.success', { defaultValue: 'Farm created successfully' }),
      )
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

  if (phase === 'farm') {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-2xl mx-auto">
        <div className="text-center space-y-4 px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xl shadow-emerald-500/5 relative overflow-hidden"
          >
            <Home className="h-8 w-8 relative z-10" />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute inset-0 bg-primary/20 blur-xl"
            />
          </motion.div>

          <div className="space-y-2">
            <h2
              className="text-3xl font-bold tracking-tight"
              style={{ color: 'var(--text-landing-primary)' }}
            >
              {t('createFarm.title', { defaultValue: 'Create Your Farm' })}
            </h2>
            <p
              className="text-base font-light max-w-md mx-auto leading-relaxed"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              {t('createFarm.desc', {
                defaultValue:
                  'A farm is your main workspace where you manage your livestock, structures, and records.',
              })}
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full"
        >
          <FarmDialog
            open={true}
            onOpenChange={() => {}}
            onboardingMode={true}
            onSuccess={handleFarmCreated}
            onSkip={skipStep}
          />
        </motion.div>
      </div>
    )
  }

  // Phase 2: Module selection for 'multi' farm type
  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4 max-w-2xl px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-secondary/10 text-secondary border border-secondary/20 shadow-xl shadow-secondary/5 relative overflow-hidden"
        >
          <Layers className="h-10 w-10 relative z-10" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-secondary/20 blur-xl"
          />
        </motion.div>

        <div className="space-y-3">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">
            {t('enableModules.title', { defaultValue: 'Choose Your Modules' })}
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            {t('enableModules.desc', {
              defaultValue:
                'Select all the livestock types you plan to manage. You can always change this later.',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl px-6">
        {ALL_MODULES.map((key, index) => {
          const m = MODULE_METADATA[key]
          const selected = selectedModules.includes(key)

          return (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => handleToggleModule(key)}
              className={cn(
                'group relative flex flex-col items-center text-center gap-3 p-6 rounded-[2rem] border transition-all duration-300 outline-none overflow-hidden glass-card',
                selected
                  ? 'bg-primary/5 border-primary/20 shadow-xl shadow-primary/5 ring-1 ring-primary/10'
                  : 'bg-white/5 dark:bg-black/20 border-white/10 hover:bg-white/10 dark:hover:bg-black/30 hover:border-white/20',
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3',
                  selected
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-white/10 dark:bg-white/5 shadow-sm',
                )}
              >
                {m.icon}
              </div>

              <div className="space-y-1 relative z-10">
                <h3
                  className={cn(
                    'font-bold text-base transition-colors',
                    selected ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {m.name}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed px-1 line-clamp-2">
                  {m.description}
                </p>
              </div>

              {selected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg"
                >
                  <Check className="h-4 w-4 text-primary-foreground stroke-[3]" />
                </motion.div>
              )}

              {!selected && (
                <div className="absolute top-4 right-4 w-7 h-7 rounded-full border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-2 w-2 rounded-full bg-white/20" />
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full max-w-md px-6"
      >
        <button
          type="button"
          onClick={skipStep}
          className="w-full sm:w-auto px-10 py-4 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all duration-300 rounded-2xl hover:bg-white/5"
          disabled={isSubmitting}
        >
          {t('common:skip', { defaultValue: 'Skip for now' })}
        </button>
        <Button
          onClick={handleModulesConfirmed}
          disabled={selectedModules.length === 0 || isSubmitting}
          className="w-full sm:w-auto h-14 px-12 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/20 transition-all group overflow-hidden relative"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isSubmitting
              ? t('common:saving', { defaultValue: 'Initializing...' })
              : t('common:continue', {
                  defaultValue: 'Everything Looks Correct',
                })}{' '}
            {!isSubmitting && (
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            )}
          </span>
          <motion.div
            className="absolute inset-0 bg-white/20"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />
        </Button>
      </motion.div>
    </div>
  )
}
