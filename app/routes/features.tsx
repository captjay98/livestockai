import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '../features/landing/components/LandingLayout'
import { FeaturesHero } from '../features/landing/components/FeaturesHero'
import { FeaturesBentoGrid } from '../features/landing/components/FeaturesBentoGrid'
import { SpeciesSupport } from '../features/landing/components/SpeciesSupport'
import { AdvancedFeatures } from '../features/landing/components/AdvancedFeatures'
import { CTASection } from '../features/landing/components/CTASection'

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
