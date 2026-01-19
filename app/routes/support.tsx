import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '../features/landing/components/LandingLayout'
import { SupportHero } from '../features/landing/components/SupportHero'
import { SupportTiers } from '../features/landing/components/SupportTiers'
import { CTASection } from '../features/landing/components/CTASection'

export const Route = createFileRoute('/support')({
  component: SupportPage,
})

function SupportPage() {
  return (
    <LandingLayout variant="neon">
      <SupportHero />
      <SupportTiers />
      <CTASection />
    </LandingLayout>
  )
}
