import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '~/components/landing/LandingLayout'
import { LandingHero } from '~/components/landing/LandingHero'
import { FeaturesSection } from '~/components/landing/FeaturesSection'
import { TechStackSection } from '~/components/landing/TechStackSection'
import { AgentReadySection } from '~/components/landing/AgentReadySection'
import { CTASection } from '~/components/landing/CTASection'
import { SmartEcosystemSection } from '~/components/landing/SmartEcosystemSection'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <LandingLayout>
      <LandingHero />
      <FeaturesSection />
      <SmartEcosystemSection />
      <TechStackSection />
      <AgentReadySection />
      <CTASection />
    </LandingLayout>
  )
}
