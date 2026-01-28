import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '~/components/landing/LandingLayout'
import { CommunityHero } from '~/components/landing/CommunityHero'
import { CommunityStats } from '~/components/landing/CommunityStats'
import { CTASection } from '~/components/landing/CTASection'

export const Route = createFileRoute('/community')({
    component: CommunityPage,
})

function CommunityPage() {
    return (
        <LandingLayout variant="neon">
            <CommunityHero />
            <CommunityStats />
            <CTASection />
        </LandingLayout>
    )
}
