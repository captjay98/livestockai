import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { LandingLayout } from '~/components/landing/LandingLayout'
import { PricingHero } from '~/components/landing/PricingHero'
import { PricingCards } from '~/components/landing/PricingCards'
import { ComparisonTable } from '~/components/landing/ComparisonTable'
import { FAQSection } from '~/components/landing/FAQSection'
import { CTASection } from '~/components/landing/CTASection'

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
})

function PricingPage() {
  const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD')

  return (
    <LandingLayout>
      <PricingHero currency={currency} setCurrency={setCurrency} />
      <PricingCards currency={currency} />
      <ComparisonTable />
      <FAQSection />
      <CTASection />
    </LandingLayout>
  )
}
