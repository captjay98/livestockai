import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '~/components/landing/LandingLayout'
import { DocsHero } from '~/components/landing/DocsHero'
import { DocsGrid } from '~/components/landing/DocsGrid'
import { CTASection } from '~/components/landing/CTASection'

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
