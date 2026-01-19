import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '../features/landing/components/LandingLayout'
import { LandingHero } from '../features/landing/components/LandingHero'
import { FeaturesSection } from '../features/landing/components/FeaturesSection'
import { TechStackSection } from '../features/landing/components/TechStackSection'
import { AgentReadySection } from '../features/landing/components/AgentReadySection'
import { CommunitySection } from '../features/landing/components/CommunitySection'
import { CTASection } from '../features/landing/components/CTASection'
import { SmartEcosystemSection } from '../features/landing/components/SmartEcosystemSection'

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
      <CommunitySection />
      <AgentReadySection />
      <CTASection />
    </LandingLayout>
  )
}
