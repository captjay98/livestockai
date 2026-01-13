/**
 * Onboarding Types
 *
 * Type definitions for the onboarding flow.
 */

export type OnboardingStep =
  | 'welcome'
  | 'create-farm'
  | 'enable-modules'
  | 'create-structure'
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
  skipped: boolean
  completedAt?: string
}

export const ONBOARDING_STEPS: Array<OnboardingStep> = [
  'welcome',
  'create-farm',
  'enable-modules',
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
  skipped: false,
}
