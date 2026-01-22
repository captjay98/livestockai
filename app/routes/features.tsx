import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '~/components/landing/LandingLayout'
import { FeaturesHero } from '~/components/landing/FeaturesHero'
import { FeaturesBentoGrid } from '~/components/landing/FeaturesBentoGrid'
import { SpeciesSupport } from '~/components/landing/SpeciesSupport'
import { AdvancedFeatures } from '~/components/landing/AdvancedFeatures'
import { CTASection } from '~/components/landing/CTASection'

export const Route = createFileRoute('/features')({
  component: FeaturesPage,
})

function FeaturesPage() {
  return (
    <LandingLayout>
      <FeaturesHero />
      <FeaturesBentoGrid />
      <AdvancedFeatures />
      <SpeciesSupport />
      <CTASection />
    </LandingLayout>
  )
}
