/**
 * Onboarding Flow
 *
 * Multi-step onboarding for new users to set up their farm.
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
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
import { requireAuth } from '~/features/auth/server-middleware'
import { getSpeciesOptions } from '~/features/batches/constants'
import { createBatch } from '~/features/batches/server'
import {
  CURRENCY_PRESETS,
  getCurrencyPreset,
  useSettings,
} from '~/features/settings'
import { MODULE_METADATA } from '~/features/modules/constants'
import { useModules } from '~/features/modules/context'
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
interface CreateFarmInput {
  name: string
  location: string
  type: 'poultry' | 'fishery' | 'mixed'
}

const createFarmAction = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateFarmInput) => data)
  .handler(async ({ data }) => {
    await requireAuth()
    const farmId = await createFarm(data)
    return { success: true, farmId }
  })

interface CreateBatchInput {
  farmId: string
  livestockType: 'poultry' | 'fish'
  species: string
  initialQuantity: number
  acquisitionDate: string
  costPerUnit: number
  batchName?: string | null
}

const createBatchAction = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateBatchInput) => data)
  .handler(async ({ data }) => {
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
  const navigate = useNavigate()
  const {
    progress,
    isLoading,
    needsOnboarding,
    currentStepIndex,
    totalSteps,
    skipOnboarding,
  } = useOnboarding()

  // If onboarding is complete, redirect to dashboard
  if (!isLoading && !needsOnboarding) {
    navigate({ to: '/dashboard' })
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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
              <span className="font-semibold">Getting Started</span>
            </div>
            <Button variant="ghost" size="sm" onClick={skipOnboarding}>
              <SkipForward className="h-4 w-4 mr-1" />
              Skip Setup
            </Button>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
            <span>{Math.round(progressPercent)}% complete</span>
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
  const { completeStep, isAdminAdded } = useOnboarding()

  const benefits = [
    {
      icon: Package,
      title: 'Track Your Livestock',
      description: 'Monitor batches from acquisition to sale',
    },
    {
      icon: BarChart3,
      title: 'Growth Forecasting',
      description: 'Predict harvest dates and weights',
    },
    {
      icon: DollarSign,
      title: 'Financial Insights',
      description: 'Track costs, revenue, and profit margins',
    },
    {
      icon: ClipboardList,
      title: 'Complete Records',
      description: 'Feed, mortality, vaccinations, and more',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
          <Rocket className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold">Welcome to OpenLivestock!</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          {isAdminAdded
            ? "You've been added to a farm. Let's take a quick tour."
            : "Let's get your farm set up in just a few minutes."}
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
          Get Started <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Step 2: Create Farm
function CreateFarmStep() {
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
      completeStep('create-farm')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create farm')
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
        <h2 className="text-2xl font-bold">Create Your Farm</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          A farm is your main workspace with its own batches and records.
        </p>
      </div>
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Farm Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g., Sunshine Poultry Farm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, location: e.target.value }))
                }
                placeholder="e.g., Lagos, Nigeria"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Farm Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) =>
                  v &&
                  setFormData((p) => ({
                    ...p,
                    type: v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poultry">🐔 Poultry</SelectItem>
                  <SelectItem value="fishery">🐟 Fishery</SelectItem>
                  <SelectItem value="mixed">🏠 Mixed</SelectItem>
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
                variant="outline"
                onClick={skipStep}
                disabled={isSubmitting}
              >
                Skip
              </Button>
              <Button
                className="flex-1"
                disabled={isSubmitting || !formData.name || !formData.location}
              >
                {isSubmitting ? 'Creating...' : 'Create Farm'}{' '}
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
  const { completeStep, skipStep } = useOnboarding()
  const {
    enabledModules,
    toggleModule,
    isLoading: modulesLoading,
  } = useModules()
  const [selectedModules, setSelectedModules] =
    useState<Array<ModuleKey>>(enabledModules)

  const allModules: Array<{ key: ModuleKey; available: boolean }> = [
    { key: 'poultry', available: true },
    { key: 'aquaculture', available: true },
    { key: 'cattle', available: false },
    { key: 'goats', available: false },
    { key: 'sheep', available: false },
    { key: 'bees', available: false },
  ]

  const handleToggle = (key: ModuleKey) => {
    setSelectedModules((p) =>
      p.includes(key) ? p.filter((k) => k !== key) : [...p, key],
    )
  }

  const handleContinue = async () => {
    for (const { key } of allModules) {
      if (selectedModules.includes(key) !== enabledModules.includes(key)) {
        await toggleModule(key)
      }
    }
    completeStep('enable-modules')
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
          <Layers className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">Choose Your Modules</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Select the livestock types you manage.
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
              disabled={!available || modulesLoading}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'} ${!available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-3xl">{m.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{m.name}</span>
                  {!available && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      Coming Soon
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
          Skip
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selectedModules.length === 0 || modulesLoading}
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Step 4: Create Structure (Informational)
function CreateStructureStep() {
  const { completeStep, skipStep } = useOnboarding()
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
          <Home className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">Farm Organization</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          How OpenLivestock organizes your data.
        </p>
      </div>
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6 space-y-4">
          {[
            { n: '1', t: 'Farm', d: 'Your top-level workspace' },
            {
              n: '2',
              t: 'Batches',
              d: 'Groups of livestock acquired together',
            },
            {
              n: '3',
              t: 'Records',
              d: 'Daily entries for feed, mortality, weights',
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
              <strong>Tip:</strong> Start by creating a batch for your current
              livestock.
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-center gap-3 pt-4">
        <Button variant="outline" onClick={skipStep}>
          Skip
        </Button>
        <Button onClick={() => completeStep('create-structure')}>
          Got it <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Step 5: Create Batch
function CreateBatchStep() {
  const { completeStep, skipStep, progress, setBatchId } = useOnboarding()
  const { enabledModules } = useModules()

  const availableTypes = enabledModules
    .flatMap((k) => MODULE_METADATA[k].livestockTypes)
    .filter((t): t is 'poultry' | 'fish' => t === 'poultry' || t === 'fish')

  const [formData, setFormData] = useState({
    livestockType: availableTypes[0] || 'poultry',
    species: '',
    initialQuantity: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    costPerUnit: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const speciesOptions = getSpeciesOptions(formData.livestockType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!progress.farmId) {
      setError('Please create a farm first')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const result = await createBatchAction({
        data: {
          farmId: progress.farmId,
          livestockType: formData.livestockType,
          species: formData.species,
          initialQuantity: parseInt(formData.initialQuantity),
          acquisitionDate: formData.acquisitionDate,
          costPerUnit: parseFloat(formData.costPerUnit),
        },
      })
      if (result.batchId) setBatchId(result.batchId)
      completeStep('create-batch')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch')
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
        <h2 className="text-2xl font-bold">Create a Farm First</h2>
        <p className="text-muted-foreground">
          You need a farm before adding batches.
        </p>
        <Button onClick={skipStep}>Continue anyway</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
          <Package className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">Create Your First Batch</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          A batch is a group of livestock acquired together.
        </p>
      </div>
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Livestock Type</Label>
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
                  {availableTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Species</Label>
              <Select
                value={formData.species}
                onValueChange={(v) =>
                  v && setFormData((p) => ({ ...p, species: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.species || 'Select species'}
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
                <Label>Quantity</Label>
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
                <Label>Cost per Unit (₦)</Label>
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
              <Label>Acquisition Date</Label>
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
                variant="outline"
                onClick={skipStep}
                disabled={isSubmitting}
              >
                Skip
              </Button>
              <Button
                className="flex-1"
                disabled={
                  isSubmitting ||
                  !formData.species ||
                  !formData.initialQuantity ||
                  !formData.costPerUnit
                }
              >
                {isSubmitting ? 'Creating...' : 'Create Batch'}{' '}
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
        <h2 className="text-2xl font-bold">Your Preferences</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Set your currency and units.
        </p>
      </div>
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Currency</Label>
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
            <Label>Weight Unit</Label>
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
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                <SelectItem value="lbs">Pounds (lbs)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Format</Label>
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
          Skip
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save & Continue'}{' '}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Step 7: Feature Tour
function TourStep() {
  const { completeStep } = useOnboarding()
  const [idx, setIdx] = useState(0)

  const items = [
    {
      icon: Home,
      title: 'Dashboard',
      desc: 'Your command center - see farm health at a glance.',
      tip: 'Check daily to stay on top of operations.',
    },
    {
      icon: Package,
      title: 'Batches',
      desc: 'View batches, record feed, log mortality, track weights.',
      tip: 'Click any batch for detailed records.',
    },
    {
      icon: DollarSign,
      title: 'Sales & Expenses',
      desc: 'Track every naira - sales and costs.',
      tip: 'Accurate records reveal true profit margins.',
    },
    {
      icon: BarChart3,
      title: 'Reports',
      desc: 'Growth curves, batch comparisons, profitability analysis.',
      tip: 'Identify which batches perform best.',
    },
    {
      icon: Settings,
      title: 'Settings',
      desc: 'Manage modules, preferences, and account.',
      tip: 'Enable only modules you need.',
    },
  ]

  const item = items[idx]
  const isLast = idx === items.length - 1

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Quick Tour</h2>
        <p className="text-muted-foreground">
          Explore key features of OpenLivestock
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
              <strong>💡 Tip:</strong> {item.tip}
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
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button
          onClick={() => (isLast ? completeStep('tour') : setIdx((i) => i + 1))}
        >
          {isLast ? 'Finish Tour' : 'Next'}{' '}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Step 8: Complete
function CompleteStep() {
  const navigate = useNavigate()
  const { progress } = useOnboarding()

  const items = [
    progress.farmId && 'Created your farm',
    progress.batchId && 'Added your first batch',
    'Configured preferences',
    'Completed the tour',
  ].filter(Boolean)

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600">
          <Check className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold">You're All Set! 🎉</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Your farm is ready. Start tracking your livestock!
        </p>
      </div>
      {items.length > 0 && (
        <Card className="max-w-sm mx-auto">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3">What you accomplished</h4>
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
        <Button size="lg" onClick={() => navigate({ to: '/dashboard' })}>
          Go to Dashboard <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground">
          Need help? Restart the tour anytime from Settings.
        </p>
      </div>
    </div>
  )
}
