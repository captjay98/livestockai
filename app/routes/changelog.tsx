import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '../features/landing/components/LandingLayout'
import { ChangelogHero } from '../features/landing/components/ChangelogHero'
import { ChangelogList } from '../features/landing/components/ChangelogList'
import { CTASection } from '../features/landing/components/CTASection'

export const Route = createFileRoute('/changelog')({
  component: ChangelogPage,
})

function ChangelogPage() {
  return (
    <LandingLayout>
      <ChangelogHero />
      <ChangelogList />
      <CTASection />
    </LandingLayout>
  )
}
