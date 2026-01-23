import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { OnboardingStep } from '~/features/onboarding/types'
import { getOnboardingProgressFn } from '~/features/onboarding/server'
import {
  OnboardingProvider,
  useOnboarding,
} from '~/features/onboarding/context'
import {
  CompleteStep,
  CreateBatchStep,
  CreateFarmStep,
  CreateStructureStep,
  EnableModulesStep,
  OnboardingLayout,
  PreferencesStep,
  TourStep,
  WelcomeStep,
} from '~/components/onboarding'

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
  const { t } = useTranslation(['common'])
  const navigate = useNavigate()
  const { isLoading, needsOnboarding, progress } = useOnboarding()

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

  return (
    <OnboardingLayout>
      <StepRenderer currentStep={progress.currentStep} />
    </OnboardingLayout>
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
