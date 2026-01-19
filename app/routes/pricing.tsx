import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { LandingLayout } from '../features/landing/components/LandingLayout'
import { PricingHero } from '../features/landing/components/PricingHero'
import { PricingCards } from '../features/landing/components/PricingCards'
import { ComparisonTable } from '../features/landing/components/ComparisonTable'
import { FAQSection } from '../features/landing/components/FAQSection'
import { CTASection } from '../features/landing/components/CTASection'

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
