/**
 * Onboarding Flow
 *
 * Multi-step onboarding for new users to set up their farm.
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  DollarSign,
  Home,
  Layers,
  Package,
  Rocket,
  Settings,
  SkipForward,
  Sparkles,
} from 'lucide-react'

import type { OnboardingStep } from '~/features/onboarding/types'
import type { ModuleKey } from '~/features/modules/types'
import type { UserSettings } from '~/features/settings'
import { getOnboardingProgressFn } from '~/features/onboarding/server'
import {
  OnboardingProvider,
  useOnboarding,
} from '~/features/onboarding/context'
import { createFarm } from '~/features/farms/server'
import { getSpeciesOptions } from '~/features/batches/constants'
import { createBatch } from '~/features/batches/server'
import {
  CURRENCY_PRESETS,
  getCurrencyPreset,
  useFormatCurrency,
  useSettings,
} from '~/features/settings'
import { MODULE_METADATA } from '~/features/modules/constants'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Progress } from '~/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

// Server actions
type FarmType =
  | 'poultry'
  | 'aquaculture'
  | 'mixed'
  | 'cattle'
  | 'goats'
  | 'sheep'
  | 'bees'
  | 'multi'

interface CreateFarmInput {
  name: string
  location: string
  type: FarmType
}

const createFarmAction = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateFarmInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    const farmId = await createFarm(data, session.user.id)
    return { success: true, farmId }
  })

interface CreateBatchInput {
  farmId: string
  livestockType: 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'
  species: string
  initialQuantity: number
  acquisitionDate: string
  costPerUnit: number
  batchName?: string | null
}

const createBatchAction = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateBatchInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    const batchId = await createBatch(session.user.id, {
      farmId: data.farmId,
      livestockType: data.livestockType,
      species: data.species,
      initialQuantity: data.initialQuantity,
      acquisitionDate: new Date(data.acquisitionDate),
      costPerUnit: data.costPerUnit,
      batchName: data.batchName || null,
      sourceSize: null,
      structureId: null,
      targetHarvestDate: null,
      supplierId: null,
      notes: null,
    })
    return { success: true, batchId }
  })

export const Route = createFileRoute('/_auth/onboarding/')({
  loader: async () => {
    const result = await getOnboardingProgressFn()
    return result
  },
  component: OnboardingPage,
})

function OnboardingPage() {
  const loaderData = Route.useLoaderData()

  return (
    <OnboardingProvider
      initialNeedsOnboarding={loaderData.needsOnboarding}
      initialIsAdminAdded={loaderData.isAdminAdded}
      initialFarmId={loaderData.farmId}
    >
      <OnboardingContent />
    </OnboardingProvider>
  )
}

function OnboardingContent() {
  const { t } = useTranslation([
    'onboarding',
    'common',
    'settings',
    'farms',
    'batches',
    'reports',
  ])
  const navigate = useNavigate()
  const {
    progress,
    isLoading,
    needsOnboarding,
    currentStepIndex,
    totalSteps,
    skipOnboarding,
  } = useOnboarding()

  // Redirect to dashboard when onboarding is complete
  useEffect(() => {
    if (!isLoading && !needsOnboarding) {
      navigate({ to: '/dashboard' })
    }
  }, [isLoading, needsOnboarding, navigate])

  if (isLoading || !needsOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          {t('common:loading', { defaultValue: 'Loading...' })}
        </div>
      </div>
    )
  }

  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">
                {t('header.title', {
                  defaultValue: 'Getting Started',
                })}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={skipOnboarding}>
              <SkipForward className="h-4 w-4 mr-1" />
              {t('header.skip', { defaultValue: 'Skip Setup' })}
            </Button>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>
              {t('header.step', {
                defaultValue: 'Step {{current}} of {{total}}',
                current: currentStepIndex + 1,
                total: totalSteps,
              })}
            </span>
            <span>
              {t('header.percent', {
                defaultValue: '{{percent}}% complete',
                percent: Math.round(progressPercent),
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-8">
        <StepRenderer currentStep={progress.currentStep} />
      </div>
    </div>
  )
}

function StepRenderer({ currentStep }: { currentStep: OnboardingStep }) {
  switch (currentStep) {
    case 'welcome':
      return <WelcomeStep />
    case 'create-farm':
      return <CreateFarmStep />
    case 'enable-modules':
      return <EnableModulesStep />
    case 'create-structure':
      return <CreateStructureStep />
    case 'create-batch':
      return <CreateBatchStep />
    case 'preferences':
      return <PreferencesStep />
    case 'tour':
      return <TourStep />
    case 'complete':
      return <CompleteStep />
    default:
      return <WelcomeStep />
  }
}

// Step 1: Welcome
function WelcomeStep() {
  const { t } = useTranslation(['onboarding', 'common'])
  const { completeStep, isAdminAdded } = useOnboarding()

  const benefits = [
    {
      icon: Package,
      title: t('welcome.benefits.livestock.title', {
        defaultValue: 'Track Your Livestock',
      }),
      description: t('welcome.benefits.livestock.desc', {
        defaultValue: 'Monitor batches from acquisition to sale',
      }),
    },
    {
      icon: BarChart3,
      title: t('welcome.benefits.growth.title', {
        defaultValue: 'Growth Forecasting',
      }),
      description: t('welcome.benefits.growth.desc', {
        defaultValue: 'Predict harvest dates and weights',
      }),
    },
    {
      icon: DollarSign,
      title: t('welcome.benefits.financials.title', {
        defaultValue: 'Financial Insights',
      }),
      description: t('welcome.benefits.financials.desc', {
        defaultValue: 'Track costs, revenue, and profit margins',
      }),
    },
    {
      icon: ClipboardList,
      title: t('welcome.benefits.records.title', {
        defaultValue: 'Complete Records',
      }),
      description: t('welcome.benefits.records.desc', {
        defaultValue: 'Feed, mortality, vaccinations, and more',
      }),
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
          <Rocket className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold">
          {t('welcome.title', {
            defaultValue: 'Welcome to OpenLivestock!',
          })}
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          {isAdminAdded
            ? t('welcome.descAdmin', {
                defaultValue:
                  "You've been added to a farm. Let's take a quick tour.",
              })
            : t('welcome.descUser', {
                defaultValue:
                  "Let's get your farm set up in just a few minutes.",
              })}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {benefits.map((b) => (
          <Card key={b.title} className="border-2">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {b.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={() => completeStep('welcome')}>
          {t('welcome.start', { defaultValue: 'Get Started' })}{' '}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Step 2: Create Farm
function CreateFarmStep() {
  const { t } = useTranslation(['onboarding', 'common'])
  const { completeStep, setFarmId, skipStep } = useOnboarding()
  const [formData, setFormData] = useState<CreateFarmInput>({
    name: '',
    location: '',
    type: 'poultry',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const result = await createFarmAction({ data: formData })
      if (result.farmId) setFarmId(result.farmId)
      toast.success(t('createFarm.success', { defaultValue: 'Farm created' }))
      completeStep('create-farm')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('createFarm.error', {
              defaultValue: 'Failed to create farm',
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
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {t('createFarm.form.name', {
                  defaultValue: 'Farm Name',
                })}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder={t('createFarm.form.namePlaceholder', {
                  defaultValue: 'e.g., Sunshine Poultry Farm',
                })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">
                {t('createFarm.form.location', {
                  defaultValue: 'Location',
                })}
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, location: e.target.value }))
                }
                placeholder={t(
                  'onboarding.createFarm.form.locationPlaceholder',
                  { defaultValue: 'e.g., Lagos, Nigeria' },
                )}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t('createFarm.form.type', {
                  defaultValue: 'Farm Type',
                })}
              </Label>
              <Select
                value={formData.type}
                onValueChange={(v) => {
                  if (v) setFormData((p) => ({ ...p, type: v as FarmType }))
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poultry">
                    🐔 {t('farms:types.poultry', { defaultValue: 'Poultry' })}
                  </SelectItem>
                  <SelectItem value="aquaculture">
                    🐟{' '}
                    {t('farms:types.aquaculture', {
                      defaultValue: 'Aquaculture (Fish Farming)',
                    })}
                  </SelectItem>
                  <SelectItem value="cattle">
                    🐄 {t('farms:types.cattle', { defaultValue: 'Cattle' })}
                  </SelectItem>
                  <SelectItem value="goats">
                    🐐 {t('farms:types.goats', { defaultValue: 'Goats' })}
                  </SelectItem>
                  <SelectItem value="sheep">
                    🐑 {t('farms:types.sheep', { defaultValue: 'Sheep' })}
                  </SelectItem>
                  <SelectItem value="bees">
                    🐝{' '}
                    {t('farms:types.bees', { defaultValue: 'Bees (Apiary)' })}
                  </SelectItem>
                  <SelectItem value="mixed">
                    🏠{' '}
                    {t('farms:types.mixed', {
                      defaultValue: 'Mixed (Multiple Types)',
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
                disabled={isSubmitting || !formData.name || !formData.location}
              >
                {isSubmitting
                  ? t('createFarm.form.submitting', {
                      defaultValue: 'Creating...',
                    })
                  : t('createFarm.form.submit', {
                      defaultValue: 'Create Farm',
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

// Step 3: Enable Modules
function EnableModulesStep() {
  const { t } = useTranslation(['onboarding', 'common'])
  const { completeStep, skipStep, progress } = useOnboarding()
  const [selectedModules, setSelectedModules] = useState<Array<ModuleKey>>([
    'poultry',
    'aquaculture',
  ])

  // If no farm was created, skip this step
  if (!progress.farmId) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground">
            <Layers className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold">
            {t('enableModules.title', {
              defaultValue: 'Module Selection',
            })}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('enableModules.descEmpty', {
              defaultValue: 'Create a farm first to enable livestock modules.',
            })}
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-4">
          <Button variant="outline" onClick={skipStep}>
            {t('common:skip', { defaultValue: 'Skip' })}{' '}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const allModules: Array<{ key: ModuleKey; available: boolean }> = [
    { key: 'poultry', available: true },
    { key: 'aquaculture', available: true },
    { key: 'cattle', available: true },
    { key: 'goats', available: true },
    { key: 'sheep', available: true },
    { key: 'bees', available: true },
  ]

  const handleToggle = (key: ModuleKey) => {
    setSelectedModules((p) =>
      p.includes(key) ? p.filter((k) => k !== key) : [...p, key],
    )
  }

  const handleContinue = () => {
    // Module selection is stored locally for now
    // Actual module enabling happens when batches are created
    completeStep('enable-modules')
  }

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
            defaultValue: 'Select the livestock types you manage.',
          })}
        </p>
      </div>
      <div className="grid gap-3 max-w-lg mx-auto">
        {allModules.map(({ key, available }) => {
          const m = MODULE_METADATA[key]
          const selected = selectedModules.includes(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => available && handleToggle(key)}
              disabled={!available}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'} ${!available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-3xl">{m.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{m.name}</span>
                  {!available && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      {t('common:comingSoon', { defaultValue: 'Coming Soon' })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{m.description}</p>
              </div>
              {selected && available && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </button>
          )
        })}
      </div>
      <div className="flex justify-center gap-3 pt-4">
        <Button variant="outline" onClick={skipStep}>
          {t('common:skip', { defaultValue: 'Skip' })}
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selectedModules.length === 0}
        >
          {t('common:continue', { defaultValue: 'Continue' })}{' '}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Step 4: Create Structure (Informational)
function CreateStructureStep() {
  const { t } = useTranslation(['onboarding', 'common'])
  const { completeStep, skipStep } = useOnboarding()
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
          <Home className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">
          {t('createStructure.title', {
            defaultValue: 'Farm Organization',
          })}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t('createStructure.desc', {
            defaultValue: 'How OpenLivestock organizes your data.',
          })}
        </p>
      </div>
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6 space-y-4">
          {[
            {
              n: '1',
              t: t('farms:title', { defaultValue: 'Farm' }),
              d: t('createStructure.items.farm', {
                defaultValue: 'Your top-level workspace',
              }),
            },
            {
              n: '2',
              t: t('batches:title', { defaultValue: 'Batches' }),
              d: t('createStructure.items.batches', {
                defaultValue: 'Groups of livestock acquired together',
              }),
            },
            {
              n: '3',
              t: t('createStructure.items.recordsTitle', {
                defaultValue: 'Records',
              }),
              d: t('createStructure.items.records', {
                defaultValue: 'Daily entries for feed, mortality, weights',
              }),
            },
          ].map((i) => (
            <div key={i.n} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{i.n}</span>
              </div>
              <div>
                <h4 className="font-semibold">{i.t}</h4>
                <p className="text-sm text-muted-foreground">{i.d}</p>
              </div>
            </div>
          ))}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm">
              <strong>{t('common:tip', { defaultValue: 'Tip' })}:</strong>{' '}
              {t('createStructure.tip', {
                defaultValue:
                  'Start by creating a batch for your current livestock.',
              })}
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-center gap-3 pt-4">
        <Button variant="outline" onClick={skipStep}>
          {t('common:skip', { defaultValue: 'Skip' })}
        </Button>
        <Button onClick={() => completeStep('create-structure')}>
          {t('createStructure.submit', { defaultValue: 'Got it' })}{' '}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Step 5: Create Batch
function CreateBatchStep() {
  const { t } = useTranslation(['onboarding', 'common'])
  const { completeStep, skipStep, progress, setBatchId } = useOnboarding()
  const { symbol: currencySymbol } = useFormatCurrency()

  // All available livestock types
  const availableTypes = [
    { value: 'poultry', label: '🐔 Poultry' },
    { value: 'fish', label: '🐟 Fish' },
    { value: 'cattle', label: '🐄 Cattle' },
    { value: 'goats', label: '🐐 Goats' },
    { value: 'sheep', label: '🐑 Sheep' },
    { value: 'bees', label: '🐝 Bees' },
  ] as const

  type LivestockType = (typeof availableTypes)[number]['value']

  const [formData, setFormData] = useState({
    livestockType: 'poultry' as LivestockType,
    species: '',
    initialQuantity: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    costPerUnit: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const speciesOptions = getSpeciesOptions(formData.livestockType)

  // If no farm, show skip message
  if (!progress.farmId) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground">
            <Package className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold">
            {t('createBatch.title', {
              defaultValue: 'Create Your First Batch',
            })}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('createBatch.descEmpty', {
              defaultValue: 'Create a farm first to add livestock batches.',
            })}
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-4">
          <Button variant="outline" onClick={skipStep}>
            {t('common:skip', { defaultValue: 'Skip' })}{' '}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const result = await createBatchAction({
        data: {
          farmId: progress.farmId!, // Already checked above
          livestockType: formData.livestockType,
          species: formData.species,
          initialQuantity: parseInt(formData.initialQuantity),
          acquisitionDate: formData.acquisitionDate,
          costPerUnit: parseFloat(formData.costPerUnit),
        },
      })
      if (result.batchId) setBatchId(result.batchId)
      toast.success(t('createBatch.success', { defaultValue: 'Batch created' }))
      completeStep('create-batch')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('createBatch.error', {
              defaultValue: 'Failed to create batch',
            }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

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

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
          <Package className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">
          {t('createBatch.title', {
            defaultValue: 'Create Your First Batch',
          })}
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
                  setFormData((p) => ({
                    ...p,
                    livestockType: v,
                    species: '',
                  }))
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
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.species ||
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

// Step 6: Preferences
function PreferencesStep() {
  const { t } = useTranslation(['onboarding', 'common'])
  const { completeStep, skipStep } = useOnboarding()
  const { settings, updateSettings } = useSettings()
  const [localSettings, setLocalSettings] = useState<Partial<UserSettings>>({
    currencyCode: settings.currencyCode,
    weightUnit: settings.weightUnit,
    dateFormat: settings.dateFormat,
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSettings({ ...settings, ...localSettings } as UserSettings)
    } catch {
      /* continue */
    }
    setIsSaving(false)
    completeStep('preferences')
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
          <Settings className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">
          {t('preferences.title', {
            defaultValue: 'Your Preferences',
          })}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t('preferences.desc', {
            defaultValue: 'Set your currency and units.',
          })}
        </p>
      </div>
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>
              {t('settings:regional.currency.title', {
                defaultValue: 'Currency',
              })}
            </Label>
            <Select
              value={localSettings.currencyCode}
              onValueChange={(v) => {
                if (v) {
                  const p = getCurrencyPreset(v)
                  if (p)
                    setLocalSettings((s) => ({ ...s, currencyCode: p.code }))
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_PRESETS.map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.symbol} {p.code} - {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>
              {t('settings:regional.units.weight', {
                defaultValue: 'Weight Unit',
              })}
            </Label>
            <Select
              value={localSettings.weightUnit}
              onValueChange={(v) =>
                v &&
                setLocalSettings((s) => ({
                  ...s,
                  weightUnit: v,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">
                  {t('settings:regional.units.kg', {
                    defaultValue: 'Kilograms (kg)',
                  })}
                </SelectItem>
                <SelectItem value="lbs">
                  {t('settings:regional.units.lbs', {
                    defaultValue: 'Pounds (lbs)',
                  })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>
              {t('settings:regional.dateTime.dateFormat', {
                defaultValue: 'Date Format',
              })}
            </Label>
            <Select
              value={localSettings.dateFormat}
              onValueChange={(v) =>
                v &&
                setLocalSettings((s) => ({
                  ...s,
                  dateFormat: v,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-center gap-3 pt-4">
        <Button variant="outline" onClick={skipStep}>
          {t('common:skip', { defaultValue: 'Skip' })}
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving
            ? t('common:saving', { defaultValue: 'Saving...' })
            : t('preferences.submit', {
                defaultValue: 'Save & Continue',
              })}{' '}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Step 7: Feature Tour
function TourStep() {
  const { t } = useTranslation(['onboarding', 'common'])
  const { completeStep } = useOnboarding()
  const [idx, setIdx] = useState(0)

  const items = [
    {
      icon: Home,
      title: t('tour.dashboard.title', {
        defaultValue: 'Dashboard',
      }),
      desc: t('tour.dashboard.desc', {
        defaultValue: 'Your command center - see farm health at a glance.',
      }),
      tip: t('tour.dashboard.tip', {
        defaultValue: 'Check daily to stay on top of operations.',
      }),
    },
    {
      icon: Package,
      title: t('batches:title', { defaultValue: 'Batches' }),
      desc: t('tour.batches.desc', {
        defaultValue:
          'View batches, record feed, log mortality, track weights.',
      }),
      tip: t('tour.batches.tip', {
        defaultValue: 'Click any batch for detailed records.',
      }),
    },
    {
      icon: DollarSign,
      title: t('tour.finance.title', {
        defaultValue: 'Sales & Expenses',
      }),
      desc: t('tour.finance.desc', {
        defaultValue: 'Track every transaction - sales and costs.',
      }),
      tip: t('tour.finance.tip', {
        defaultValue: 'Accurate records reveal true profit margins.',
      }),
    },
    {
      icon: BarChart3,
      title: t('reports:title', { defaultValue: 'Reports' }),
      desc: t('tour.reports.desc', {
        defaultValue:
          'Growth curves, batch comparisons, profitability analysis.',
      }),
      tip: t('tour.reports.tip', {
        defaultValue: 'Identify which batches perform best.',
      }),
    },
    {
      icon: Settings,
      title: t('settings:title', { defaultValue: 'Settings' }),
      desc: t('tour.settings.desc', {
        defaultValue: 'Manage modules, preferences, and account.',
      }),
      tip: t('tour.settings.tip', {
        defaultValue: 'Enable only modules you need.',
      }),
    },
  ]

  const item = items[idx]
  const isLast = idx === items.length - 1

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          {t('tour.title', { defaultValue: 'Quick Tour' })}
        </h2>
        <p className="text-muted-foreground">
          {t('tour.summary', {
            defaultValue: 'Explore key features of OpenLivestock',
          })}
        </p>
      </div>
      <div className="flex justify-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-primary' : i < idx ? 'bg-primary/50' : 'bg-muted-foreground/30'}`}
          />
        ))}
      </div>
      <Card className="max-w-lg mx-auto overflow-hidden">
        <div className="bg-primary/5 p-8 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <item.icon className="h-10 w-10 text-primary" />
          </div>
        </div>
        <CardContent className="pt-6 space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold">{item.title}</h3>
            <p className="text-muted-foreground mt-2">{item.desc}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm">
              <strong>💡 {t('common:tip', { defaultValue: 'Tip' })}:</strong>{' '}
              {item.tip}
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-center gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />{' '}
          {t('common:previous', { defaultValue: 'Previous' })}
        </Button>
        <Button
          onClick={() => (isLast ? completeStep('tour') : setIdx((i) => i + 1))}
        >
          {isLast
            ? t('tour.finish', { defaultValue: 'Finish Tour' })
            : t('common:next', { defaultValue: 'Next' })}{' '}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Step 8: Complete
function CompleteStep() {
  const { t } = useTranslation(['onboarding', 'common'])
  const navigate = useNavigate()
  const { progress } = useOnboarding()
  const [isCompleting, setIsCompleting] = useState(false)

  const items = [
    progress.farmId &&
      t('complete.items.farm', {
        defaultValue: 'Created your farm',
      }),
    progress.batchId &&
      t('complete.items.batch', {
        defaultValue: 'Added your first batch',
      }),
    t('complete.items.preferences', {
      defaultValue: 'Configured preferences',
    }),
    t('complete.items.tour', { defaultValue: 'Completed the tour' }),
  ].filter(Boolean)

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      const { markOnboardingCompleteFn } =
        await import('~/features/onboarding/server')
      await markOnboardingCompleteFn()
      navigate({ to: '/dashboard' })
    } catch (err) {
      console.error('Failed to mark onboarding complete:', err)
      navigate({ to: '/dashboard' })
    }
  }

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600">
          <Check className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold">
          {t('complete.title', {
            defaultValue: "You're All Set! 🎉",
          })}
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          {t('complete.desc', {
            defaultValue: 'Your farm is ready. Start tracking your livestock!',
          })}
        </p>
      </div>
      {items.length > 0 && (
        <Card className="max-w-sm mx-auto">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3">
              {t('complete.accomplished', {
                defaultValue: 'What you accomplished',
              })}
            </h4>
            <ul className="space-y-2 text-left">
              {items.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" /> {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <div className="space-y-3">
        <Button size="lg" onClick={handleComplete} disabled={isCompleting}>
          {isCompleting
            ? t('complete.finishing', {
                defaultValue: 'Finishing...',
              })
            : t('complete.submit', {
                defaultValue: 'Go to Dashboard',
              })}{' '}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground">
          {t('complete.help', {
            defaultValue: 'Need help? Restart the tour anytime from Settings.',
          })}
        </p>
      </div>
    </div>
  )
}
