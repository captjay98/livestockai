import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
})

function PricingPage() {
  const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Pricing</h1>
          <button
            onClick={() => setCurrency((c) => (c === 'USD' ? 'NGN' : 'USD'))}
            className="px-3 py-1 border rounded"
          >
            {currency === 'USD' ? '$ USD' : '₦ NGN'}
          </button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">
          Pricing page coming soon.
        </p>
      </main>
    </div>
  )
}
