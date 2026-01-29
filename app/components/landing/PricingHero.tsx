import { DollarSign } from 'lucide-react'

interface PricingHeroProps {
  currency: 'USD' | 'NGN'
  setCurrency: (currency: 'USD' | 'NGN') => void
}

export function PricingHero({ currency, setCurrency }: PricingHeroProps) {
  return (
    <section className="min-h-[60vh] flex flex-col justify-center w-full pt-40 pb-20 px-6 lg:px-12 relative overflow-hidden transition-colors duration-500">
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none transition-colors duration-500"
        style={{
          backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage:
            'radial-gradient(circle at 50% 50%, black, transparent 80%)',
        }}
      />

      <div className="max-w-[1400px] mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 animate-fade-in">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
            Transparent Pricing
          </span>
        </div>

        <h1
          className="text-5xl lg:text-7xl font-manrope font-semibold mb-6 tracking-tight animate-slide-up text-transparent bg-clip-text"
          style={{
            backgroundImage:
              'linear-gradient(115deg, var(--text-landing-primary) 40%, var(--text-landing-secondary) 50%, var(--text-landing-primary) 60%)',
            backgroundSize: '200% auto',
            animation: 'light-scan 5s linear infinite',
          }}
        >
          <span className="block">Simple Pricing</span>
          <span className="block text-emerald-500">For Every Farm Size</span>
        </h1>

        <p
          className="max-w-2xl mx-auto text-lg mb-10 font-light animate-slide-up delay-100 transition-colors duration-500"
          style={{ color: 'var(--text-landing-secondary)' }}
        >
          Self-host for free forever, or use our managed cloud with automatic
          backups and updates. No hidden fees.
        </p>

        {/* Currency Toggle */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setCurrency('USD')}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              currency === 'USD'
                ? 'bg-neutral-900 text-white dark:bg-white/10 dark:text-white border-transparent dark:border-white/20 shadow-lg'
                : 'bg-transparent text-neutral-500 border border-transparent hover:border-neutral-200 dark:hover:border-white/5'
            }`}
          >
            USD
          </button>
          <button
            onClick={() => setCurrency('NGN')}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              currency === 'NGN'
                ? 'bg-neutral-900 text-white dark:bg-white/10 dark:text-white border-transparent dark:border-white/20 shadow-lg'
                : 'bg-transparent text-neutral-500 border border-transparent hover:border-neutral-200 dark:hover:border-white/5'
            }`}
          >
            NGN
          </button>
        </div>
      </div>
    </section>
  )
}
