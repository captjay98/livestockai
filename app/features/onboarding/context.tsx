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
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ABBREVIATED_STEPS, DEFAULT_PROGRESS, ONBOARDING_STEPS } from './types'
import type { ModuleKey } from '~/features/modules/types'
import type { OnboardingProgress, OnboardingStep } from './types'

const STORAGE_KEY = 'livestockai_onboarding'

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
  const { t } = useTranslation(['settings'])
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

  // Load progress from server on mount (sync across devices)
  useEffect(() => {
    async function init() {
      try {
        const { getOnboardingProgressFn } = await import('./server')
        const data = await getOnboardingProgressFn({ data: {} })

        // Server is the source of truth
        if (!data.needsOnboarding) {
          // User has completed onboarding or is a buyer
          setNeedsOnboarding(false)
          setProgress(data.progress)
          // Clear any stale localStorage
          localStorage.removeItem(STORAGE_KEY)
        } else {
          // User needs onboarding
          setNeedsOnboarding(true)

          // If server has progress beyond welcome, use it
          if (data.progress.currentStep !== 'welcome') {
            setProgress(data.progress)
          } else {
            // Server says start from welcome - check localStorage for resume
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
              try {
                const parsed = JSON.parse(stored) as OnboardingProgress
                // Only use localStorage if it's not at 'complete' (stale data)
                if (parsed.currentStep !== 'complete') {
                  setProgress(parsed)
                } else {
                  // Stale localStorage showing complete but server says needs onboarding
                  // Trust server and clear localStorage
                  localStorage.removeItem(STORAGE_KEY)
                  setProgress(data.progress)
                }
              } catch {
                // Invalid localStorage, use server data
                setProgress(data.progress)
              }
            } else {
              // No localStorage, use server data
              setProgress(data.progress)
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync onboarding state', err)
        // Fallback to local storage only if server fails
        try {
          const stored = localStorage.getItem(STORAGE_KEY)
          if (stored) {
            const parsed = JSON.parse(stored) as OnboardingProgress
            setProgress(parsed)
          }
        } catch {}
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  // Save progress to server and localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))

      // Debounce or fire-and-forget server save
      // We don't want to block UI, so we just call it
      import('./server').then(({ saveOnboardingProgressFn }) => {
        saveOnboardingProgressFn({ data: { progress } }).catch(() => {
          // Silent fail on save is acceptable for now, local storage is backup
        })
      })
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

  const skipStep = useCallback(async () => {
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

    // Save to server immediately
    try {
      const { saveOnboardingProgressFn } = await import('./server')
      const currentIndex = steps.indexOf(progress.currentStep)
      const nextStep = steps[currentIndex + 1] || 'complete'
      await saveOnboardingProgressFn({
        data: {
          progress: {
            ...progress,
            currentStep: nextStep,
          },
        },
      })
    } catch {
      // Silent fail, localStorage is backup
    }
  }, [steps, progress])

  const skipOnboarding = useCallback(async () => {
    // Persist to database FIRST before navigating
    try {
      const { markOnboardingCompleteFn } = await import('./server')
      await markOnboardingCompleteFn({ data: {} })
      // Use full page reload to ensure fresh state from server
      window.location.href = '/dashboard'
    } catch (err) {
      toast.error(
        t('settings:help.resetOnboardingFailed', {
          defaultValue: 'Failed to mark onboarding complete',
        }),
      )
      // Even on error, try to navigate - the DB update may have succeeded
      window.location.href = '/dashboard'
    }
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
