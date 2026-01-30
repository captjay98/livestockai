import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '~/components/landing/LandingLayout'
import { ExtensionHero } from '~/components/landing/ExtensionHero'
import { ExtensionFeaturesGrid } from '~/components/landing/ExtensionFeaturesGrid'
import { ExtensionWorkflow } from '~/components/landing/ExtensionWorkflow'
import { ExtensionHealthStatus } from '~/components/landing/ExtensionHealthStatus'
import { ExtensionCTA } from '~/components/landing/ExtensionCTA'

export const Route = createFileRoute('/extension-workers')({
  component: ExtensionWorkersPage,
})

function ExtensionWorkersPage() {
  return (
    <LandingLayout>
      <ExtensionHero />
      <ExtensionFeaturesGrid />
      <ExtensionWorkflow />
      <ExtensionHealthStatus />
      <ExtensionCTA />
    </LandingLayout>
  )
}
