import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '~/components/landing/LandingLayout'
import { RoadmapHero } from '~/components/landing/RoadmapHero'
import { RoadmapTimeline } from '~/components/landing/RoadmapTimeline'
import { CTASection } from '~/components/landing/CTASection'

export const Route = createFileRoute('/roadmap')({
  component: RoadmapPage,
})

function RoadmapPage() {
  return (
    <LandingLayout>
      <RoadmapHero />
      <RoadmapTimeline />
      <CTASection />
    </LandingLayout>
  )
}
