import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '~/components/landing/LandingLayout'
import { ChangelogHero } from '~/components/landing/ChangelogHero'
import { ChangelogList } from '~/components/landing/ChangelogList'
import { CTASection } from '~/components/landing/CTASection'

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
