import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '../features/landing/components/LandingLayout'
import { RoadmapHero } from '../features/landing/components/RoadmapHero'
import { RoadmapTimeline } from '../features/landing/components/RoadmapTimeline'
import { CTASection } from '../features/landing/components/CTASection'

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
