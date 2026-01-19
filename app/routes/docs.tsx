import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '../features/landing/components/LandingLayout'
import { DocsHero } from '../features/landing/components/DocsHero'
import { DocsGrid } from '../features/landing/components/DocsGrid'
import { CTASection } from '../features/landing/components/CTASection'

export const Route = createFileRoute('/docs')({
  component: DocsPage,
})

function DocsPage() {
  return (
    <LandingLayout>
      <DocsHero />
      <DocsGrid />
      <CTASection />
    </LandingLayout>
  )
}
