import { createFileRoute, redirect } from '@tanstack/react-router'
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
  OnboardingLayout,
  PreferencesStep,
  TourStep,
  WelcomeStep,
} from '~/components/onboarding'
import { OnboardingSkeleton } from '~/components/onboarding/onboarding-skeleton'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/_auth/onboarding/')({
  loader: async () => {
    const result = await getOnboardingProgressFn({ data: {} })

    // If user doesn't need onboarding, redirect to dashboard
    if (!result.needsOnboarding) {
      throw redirect({ to: '/dashboard' })
    }

    return result
  },
  component: OnboardingPage,
  pendingComponent: OnboardingSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
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
  const { progress } = useOnboarding()

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
