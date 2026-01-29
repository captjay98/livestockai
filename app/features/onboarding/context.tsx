/**
 * Onboarding Context
 *
 * Provides onboarding state management with localStorage persistence.
 * Tracks enabled modules for filtering livestock types in batch creation.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { toast } from 'sonner'
import { ABBREVIATED_STEPS, DEFAULT_PROGRESS, ONBOARDING_STEPS } from './types'
import type { ModuleKey } from '~/features/modules/types'
import type { OnboardingProgress, OnboardingStep } from './types'

const STORAGE_KEY = 'openlivestock_onboarding'

interface OnboardingContextValue {
  progress: OnboardingProgress
  isLoading: boolean
  needsOnboarding: boolean
  isAdminAdded: boolean
  currentStepIndex: number
  totalSteps: number
  goToStep: (step: OnboardingStep) => void
  completeStep: (step: OnboardingStep) => void
  skipStep: () => void
  skipOnboarding: () => void
  restartTour: () => void
  setFarmId: (farmId: string) => void
  setStructureId: (structureId: string) => void
  setBatchId: (batchId: string) => void
  setEnabledModules: (modules: Array<ModuleKey>) => void
  enabledModules: Array<ModuleKey>
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

interface OnboardingProviderProps {
  children: React.ReactNode
  initialNeedsOnboarding: boolean
  initialIsAdminAdded: boolean
  initialFarmId?: string | null
}

export function OnboardingProvider({
  children,
  initialNeedsOnboarding,
  initialIsAdminAdded,
  initialFarmId,
}: OnboardingProviderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(initialNeedsOnboarding)
  const [isAdminAdded] = useState(initialIsAdminAdded)
  const [progress, setProgress] = useState<OnboardingProgress>(() => {
    // Initialize with default, will be updated from localStorage
    return {
      ...DEFAULT_PROGRESS,
      farmId: initialFarmId || undefined,
    }
  })

  // Get the appropriate steps based on whether user was admin-added
  const steps = isAdminAdded ? ABBREVIATED_STEPS : ONBOARDING_STEPS

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as OnboardingProgress
        setProgress(parsed)
        // If onboarding was completed or skipped, don't need it
        if (parsed.completedAt || parsed.skipped) {
          setNeedsOnboarding(false)
        }
      }
    } catch {
      // Ignore parse errors, use default
    }
    setIsLoading(false)
  }, [])

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    }
  }, [progress, isLoading])

  const currentStepIndex = steps.indexOf(progress.currentStep)
  const totalSteps = steps.length

  const goToStep = useCallback((step: OnboardingStep) => {
    setProgress((prev) => ({
      ...prev,
      currentStep: step,
    }))
  }, [])

  const completeStep = useCallback(
    (step: OnboardingStep) => {
      setProgress((prev) => {
        const newCompletedSteps = prev.completedSteps.includes(step)
          ? prev.completedSteps
          : [...prev.completedSteps, step]

        // Find next step
        const currentIndex = steps.indexOf(step)
        const nextStep = steps[currentIndex + 1] || 'complete'

        // If completing the last step, mark as done
        if (nextStep === 'complete') {
          setNeedsOnboarding(false)
          return {
            ...prev,
            currentStep: 'complete',
            completedSteps: [...newCompletedSteps, 'complete'],
            completedAt: new Date().toISOString(),
          }
        }

        return {
          ...prev,
          currentStep: nextStep,
          completedSteps: newCompletedSteps,
        }
      })
    },
    [steps],
  )

  const skipStep = useCallback(() => {
    setProgress((prev) => {
      const currentIndex = steps.indexOf(prev.currentStep)
      const nextStep = steps[currentIndex + 1] || 'complete'

      if (nextStep === 'complete') {
        setNeedsOnboarding(false)
        return {
          ...prev,
          currentStep: 'complete',
          completedAt: new Date().toISOString(),
        }
      }

      return {
        ...prev,
        currentStep: nextStep,
      }
    })
  }, [steps])

  const skipOnboarding = useCallback(async () => {
    // Persist to database FIRST before updating local state
    try {
      const { markOnboardingCompleteFn } = await import('./server')
      await markOnboardingCompleteFn({ data: {} })
    } catch (err) {
      toast.error('Failed to mark onboarding complete')
    }

    // Only update local state after database is updated
    setProgress((prev) => ({
      ...prev,
      skipped: true,
      completedAt: new Date().toISOString(),
    }))
    setNeedsOnboarding(false)
  }, [])

  const restartTour = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      currentStep: 'tour',
      completedSteps: prev.completedSteps.filter((s) => s !== 'tour'),
    }))
    setNeedsOnboarding(true)
  }, [])

  const setFarmId = useCallback((farmId: string) => {
    setProgress((prev) => ({ ...prev, farmId }))
  }, [])

  const setStructureId = useCallback((structureId: string) => {
    setProgress((prev) => ({ ...prev, structureId }))
  }, [])

  const setBatchId = useCallback((batchId: string) => {
    setProgress((prev) => ({ ...prev, batchId }))
  }, [])

  const setEnabledModules = useCallback((modules: Array<ModuleKey>) => {
    setProgress((prev) => ({ ...prev, enabledModules: modules }))
  }, [])

  return (
    <OnboardingContext.Provider
      value={{
        progress,
        isLoading,
        needsOnboarding,
        isAdminAdded,
        currentStepIndex,
        totalSteps,
        goToStep,
        completeStep,
        skipStep,
        skipOnboarding,
        restartTour,
        setFarmId,
        setStructureId,
        setBatchId,
        setEnabledModules,
        enabledModules: progress.enabledModules,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}

/**
 * Clear onboarding progress from localStorage
 * Useful for testing or resetting user state
 */
export function clearOnboardingProgress() {
  localStorage.removeItem(STORAGE_KEY)
}
