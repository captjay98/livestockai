/**
 * Onboarding Types
 *
 * Type definitions for the onboarding flow.
 * 7-step flow: welcome → create-farm → create-structure → create-batch → preferences → tour → complete
 */

import type { ModuleKey } from '~/features/modules/types'

export type OnboardingStep =
  | 'welcome'
  | 'create-farm' // Combined: farm creation + module selection
  | 'create-structure' // Optional: create a structure
  | 'create-batch'
  | 'preferences'
  | 'tour'
  | 'complete'

export interface OnboardingProgress {
  currentStep: OnboardingStep
  completedSteps: Array<OnboardingStep>
  farmId?: string
  structureId?: string
  batchId?: string
  enabledModules: Array<ModuleKey> // Track enabled modules for batch filtering
  skipped: boolean
  completedAt?: string
}

export const ONBOARDING_STEPS: Array<OnboardingStep> = [
  'welcome',
  'create-farm',
  'create-structure',
  'create-batch',
  'preferences',
  'tour',
  'complete',
]

export const ABBREVIATED_STEPS: Array<OnboardingStep> = [
  'welcome',
  'tour',
  'complete',
]

export const DEFAULT_PROGRESS: OnboardingProgress = {
  currentStep: 'welcome',
  completedSteps: [],
  enabledModules: [],
  skipped: false,
}
