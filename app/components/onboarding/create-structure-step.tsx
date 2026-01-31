import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Box,
  Bug,
  Building,
  Grid,
  Home,
  Leaf,
  Warehouse,
  Waves,
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { StructureType } from '~/features/modules/types'
import { useOnboarding } from '~/features/onboarding/context'
import { useStructureMutations } from '~/features/structures/mutations'
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
import { cn } from '~/lib/utils'

// Structure types with labels and icons
const STRUCTURE_TYPES: Array<{
  value: StructureType
  label: string
  icon: any
  color: string
}> = [
  {
    value: 'house',
    label: 'House (Poultry)',
    icon: Home,
    color: 'text-orange-500',
  },
  { value: 'pond', label: 'Pond (Fish)', icon: Waves, color: 'text-blue-500' },
  { value: 'pen', label: 'Pen', icon: Grid, color: 'text-emerald-500' },
  { value: 'cage', label: 'Cage', icon: Box, color: 'text-slate-500' },
  { value: 'barn', label: 'Barn', icon: Warehouse, color: 'text-amber-600' },
  { value: 'pasture', label: 'Pasture', icon: Leaf, color: 'text-green-500' },
  { value: 'hive', label: 'Hive', icon: Bug, color: 'text-yellow-500' },
]

export function CreateStructureStep() {
  const { t } = useTranslation(['onboarding', 'common', 'structures'])
  const { completeStep, skipStep, progress, setStructureId, enabledModules } =
    useOnboarding()
  const { createStructure } = useStructureMutations()

  const [formData, setFormData] = useState({
    name: '',
    type: '' as StructureType | '',
    capacity: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Filter structure types based on enabled modules
  const availableStructureTypes = STRUCTURE_TYPES.filter((st) => {
    if (enabledModules.length === 0) return true
    return enabledModules.some((moduleKey) => {
      const metadata = MODULE_METADATA[moduleKey]
      return metadata.structureTypes.includes(st.value)
    })
  })

  if (!progress.farmId) {
    return (
      <div className="space-y-8 p-8 text-center glass-card rounded-3xl border-white/20 bg-white/40 dark:bg-black/40 backdrop-blur-xl shadow-2xl">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted/20 text-muted-foreground border border-muted/30">
          <Building className="h-10 w-10" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">
            {t('createStructure.noFarm.title', {
              defaultValue: 'Create a Farm First',
            })}
          </h2>
          <p className="text-lg text-muted-foreground max-w-sm mx-auto">
            {t('createStructure.noFarm.desc', {
              defaultValue: 'You need a farm before adding structures.',
            })}
          </p>
        </div>
        <Button size="lg" onClick={skipStep} className="rounded-full px-8">
          {t('common:continue', { defaultValue: 'Continue' })}
        </Button>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.type) return

    setIsSubmitting(true)
    setError('')

    try {
      createStructure.mutate(
        {
          structure: {
            farmId: progress.farmId!,
            name: formData.name,
            type: formData.type as any,
            capacity: formData.capacity ? parseInt(formData.capacity) : null,
            status: 'active',
          },
        },
        {
          onSuccess: (structureId: string) => {
            if (structureId) {
              setStructureId(structureId)
            }
            completeStep('create-structure')
          },
          onError: (err: Error) => {
            setError(
              err instanceof Error ? err.message : t('createStructure.error'),
            )
          },
        },
      )
    } finally {
      // setIsSubmitting(false) is handled by mutation state
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-6 max-w-2xl px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/5 relative overflow-hidden"
        >
          <Building className="h-10 w-10 relative z-10" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-primary/20 blur-xl"
          />
        </motion.div>

        <div className="space-y-3">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">
            {t('createStructure.title', { defaultValue: 'Add a Structure' })}
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            {t('createStructure.desc', {
              defaultValue:
                'Structures help separate your livestock into manageable areas like houses, ponds, or pens.',
            })}
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md"
      >
        <Card className="border-white/20 bg-white/50 dark:bg-black/50 backdrop-blur-2xl shadow-2xl overflow-hidden glass-card rounded-[2.5rem]">
          <CardContent className="p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="type"
                    className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 pl-1"
                  >
                    {t('structures:type', { defaultValue: 'Structure Type' })}
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) =>
                      v &&
                      setFormData((p) => ({ ...p, type: v as StructureType }))
                    }
                  >
                    <SelectTrigger className="h-14 bg-background/40 border-white/10 dark:border-white/5 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all text-base px-5">
                      <SelectValue placeholder={t('structures:selectType')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                      {availableStructureTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem
                            key={type.value}
                            value={type.value}
                            className="rounded-xl py-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'p-1.5 rounded-lg bg-current/10',
                                  type.color,
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="font-medium">{type.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-bold uppercase tracking_wider text-muted-foreground/80 pl-1"
                  >
                    {t('structures:name', { defaultValue: 'Structure Name' })}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder={t('structures:namePlaceholder', {
                      defaultValue: 'e.g., North House, Pond 1',
                    })}
                    required
                    className="h-14 bg-background/40 border-white/10 dark:border-white/5 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all text-base px-5"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="capacity"
                    className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 pl-1"
                  >
                    {t('structures:capacity', { defaultValue: 'Capacity' })}
                    <span className="text-[10px] ml-2 opacity-50 font-mono">
                      OPTIONAL
                    </span>
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, capacity: e.target.value }))
                    }
                    placeholder={t('structures:capacityPlaceholder', {
                      defaultValue: 'Max units',
                    })}
                    className="h-14 bg-background/40 border-white/10 dark:border-white/5 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all text-base px-5 text-lg"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-sm text-destructive font-medium bg-destructive/10 p-4 rounded-2xl border border-destructive/20"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-4 pt-2">
                <Button
                  type="submit"
                  disabled={
                    createStructure.isPending ||
                    !formData.name ||
                    !formData.type
                  }
                  className="w-full h-14 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/20 transition-all group overflow-hidden relative"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {createStructure.isPending ? (
                      t('common:creating', { defaultValue: 'Creating Area...' })
                    ) : (
                      <>
                        {t('createStructure.submit', {
                          defaultValue: 'Add Structure',
                        })}
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                </Button>

                <button
                  type="button"
                  onClick={skipStep}
                  className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
                  disabled={isSubmitting}
                >
                  {t('common:skip', { defaultValue: 'Skip for now' })}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
