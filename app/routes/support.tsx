import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '~/components/landing/LandingLayout'
import { SupportHero } from '~/components/landing/SupportHero'
import { SupportTiers } from '~/components/landing/SupportTiers'
import { CTASection } from '~/components/landing/CTASection'

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
