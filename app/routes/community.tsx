import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '../features/landing/components/LandingLayout'
import { CommunityHero } from '../features/landing/components/CommunityHero'
import { CommunityStats } from '../features/landing/components/CommunityStats'
import { CTASection } from '../features/landing/components/CTASection'

export const Route = createFileRoute('/community')({
  component: CommunityPage,
})

function CommunityPage() {
  return (
    <LandingLayout variant="neon">
      <CommunityHero />
      <CommunityStats />
      <CTASection />
    </LandingLayout>
  )
}
