import { Building2, Check, Globe, Shield, Sparkles, Zap } from 'lucide-react'
import { Link } from '@tanstack/react-router'

interface PricingCardsProps {
  currency: 'USD' | 'NGN'
}

const tiers = [
  {
    name: 'Free',
    code: 'BASE-01',
    price: { USD: '$0', NGN: '₦0' },
    description: 'Essential management for starting farms.',
    icon: Sparkles,
    accent: 'cyan',
    features: [
      '1 Farm management',
      '200 Livestock limit',
      'Offline-first access',
      'Standard reports',
    ],
    cta: 'Get Started',
    href: '/register',
    popular: false,
  },
  {
    name: 'Starter',
    code: 'GROW-02',
    price: { USD: '$5', NGN: '₦3,000' },
    description: 'Ideal for growing farms and smaller batches.',
    icon: Zap,
    accent: 'emerald',
    features: [
      '1 Farm management',
      '2,000 Livestock limit',
      'Automatic cloud sync',
      'Secure backups',
      'Email support',
    ],
    cta: 'Get Started',
    href: '/register',
    popular: false,
  },
  {
    name: 'Professional',
    code: 'PRO-03',
    price: { USD: '$12', NGN: '₦7,000' },
    description: 'Full control for serious farm operations.',
    icon: Building2,
    accent: 'purple',
    features: [
      '3 Farms management',
      '10,000 Livestock limit',
      'SMS alert system',
      '3 Team accounts',
      'Priority support',
    ],
    cta: 'Get Started',
    href: '/register',
    popular: true,
  },
  {
    name: 'Enterprise',
    code: 'CORE-04',
    price: { USD: '$29', NGN: '₦15,000' },
    description: 'Tailored solutions for large-scale production.',
    icon: Globe,
    accent: 'amber',
    features: [
      '10 Farms management',
      'Unlimited livestock',
      'Direct 24/7 support',
      'Custom integrations',
      'Dedicated manager',
    ],
    cta: 'Contact Sales',
    href: '/register',
    popular: false,
  },
]

const colorMap = {
  cyan: 'from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 glow-cyan',
  emerald:
    'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 glow-emerald',
  purple:
    'from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30 glow-purple',
  amber:
    'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 glow-amber',
}

export function PricingCards({ currency }: PricingCardsProps) {
  return (
    <section
      className="w-full py-32 px-6 lg:px-12 relative overflow-hidden font-manrope transition-colors duration-500"
      style={{ backgroundColor: 'var(--bg-landing-page)' }}
    >
      {/* Structural Elements */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity duration-500"
        style={{
          backgroundImage:
            'linear-gradient(var(--landing-grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--landing-grid-color) 1px, transparent 1px)',
          backgroundSize: '100px 100px',
          opacity: 'var(--landing-grid-opacity)',
        }}
      />

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`group relative h-full flex flex-col p-[1px] rounded-2xl overflow-hidden transition-all duration-700 ${
                tier.popular
                  ? 'scale-[1.02] z-20 shadow-[0_30px_100px_-20px_rgba(16,185,129,0.15)]'
                  : 'hover:scale-[1.01]'
              }`}
            >
              {/* Card Background & Borders */}
              <div
                className={`absolute inset-0 bg-gradient-to-br transition-all duration-700 ${
                  tier.popular
                    ? 'from-emerald-500/40 via-white/5 to-transparent'
                    : 'from-black/5 dark:from-white/5 via-transparent to-transparent group-hover:from-black/10 dark:group-hover:from-white/10'
                }`}
              />

              <div
                className="flex-1 backdrop-blur-3xl rounded-[calc(1rem-1px)] relative flex flex-col p-8 lg:p-10 border overflow-hidden transition-colors duration-500"
                style={{
                  backgroundColor: 'var(--bg-landing-card)',
                  borderColor: 'var(--border-landing-subtle)',
                }}
              >
                {/* Tech Aesthetics: Scanlines and Corner Brackets */}
                <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rotate-45 pointer-events-none bg-black/[0.02] dark:bg-white/[0.02]" />
                <div className="absolute top-4 right-4 flex gap-1 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                  <div className="w-1 h-3 rounded-full bg-neutral-400 dark:bg-white" />
                  <div className="w-1 h-3 rounded-full bg-neutral-400 dark:bg-white" />
                </div>

                {/* Header */}
                <div className="mb-10 relative">
                  <div className="flex items-center justify-between mb-8">
                    <div
                      className={`text-[10px] font-mono tracking-[0.3em] uppercase opacity-40 group-hover:opacity-100 transition-opacity transition-colors duration-500`}
                      style={{ color: 'var(--text-landing-secondary)' }}
                    >
                      {tier.code}
                    </div>
                    {tier.popular && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-emerald-500/10 border border-emerald-500/20">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400 tracking-tighter uppercase font-mono">
                          Most Popular
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`p-3 rounded-xl border bg-gradient-to-br transition-transform duration-500 group-hover:-rotate-12 ${colorMap[tier.accent as keyof typeof colorMap]}`}
                    >
                      <tier.icon className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <div>
                      <h3
                        className="text-xl font-bold tracking-tight uppercase transition-colors duration-500"
                        style={{ color: 'var(--text-landing-primary)' }}
                      >
                        {tier.name}
                      </h3>
                      <div className="h-0.5 w-8 bg-current opacity-20 mt-1" />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span
                      className="text-5xl font-bold tracking-tighter transition-colors duration-500"
                      style={{ color: 'var(--text-landing-primary)' }}
                    >
                      {tier.price[currency]}
                    </span>
                    <span
                      className="text-xs font-mono uppercase transition-colors duration-500"
                      style={{ color: 'var(--text-landing-secondary)' }}
                    >
                      / Month
                    </span>
                  </div>
                  <p
                    className="text-xs font-mono tracking-wide leading-relaxed uppercase italic transition-colors duration-500"
                    style={{ color: 'var(--text-landing-secondary)' }}
                  >
                    {tier.description}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-12 flex-grow">
                  <div
                    className="text-[10px] font-mono uppercase tracking-widest mb-4 transition-colors duration-500"
                    style={{ color: 'var(--text-landing-secondary)' }}
                  >
                    Plan Features:
                  </div>
                  {tier.features.map((feature, fIdx) => (
                    <div
                      key={fIdx}
                      className="flex items-center gap-3 text-[13px] font-light border-b pb-3 last:border-0 group/f transition-colors duration-500"
                      style={{
                        borderColor: 'var(--border-landing-subtle)',
                        color: 'var(--text-landing-secondary)',
                      }}
                    >
                      <Check className="w-3.5 h-3.5 text-current transition-transform group-hover/f:scale-125 duration-300" />
                      <span className="group-hover/f:text-emerald-600 dark:group-hover/f:text-white transition-colors">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  to={tier.href}
                  className={`relative w-full py-4 rounded-xl overflow-hidden group/btn font-mono text-xs font-bold tracking-[0.2em] uppercase transition-all duration-500 ${
                    tier.popular
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'bg-black/5 dark:bg-white/5 border hover:border-emerald-500/50 hover:bg-emerald-500/5 dark:hover:bg-white/10'
                  }`}
                  style={
                    !tier.popular
                      ? {
                          color: 'var(--text-landing-primary)',
                          borderColor: 'var(--border-landing-subtle)',
                        }
                      : {}
                  }
                >
                  <span className="relative z-20 flex items-center justify-center gap-2">
                    {tier.cta}
                    <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                  {/* Button Glitch Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                </Link>

                {/* Bottom Decor */}
                <div className="absolute bottom-0 left-0 w-full h-[2px] opacity-20 bg-gradient-to-r from-transparent via-current to-transparent" />
              </div>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <div className="mt-20 flex flex-col items-center justify-center text-center opacity-40 hover:opacity-100 transition-opacity">
          <div
            className="w-12 h-px mb-6 transition-colors duration-500"
            style={{ backgroundColor: 'var(--border-landing-subtle)' }}
          />
          <p
            className="text-[10px] font-mono tracking-[0.2em] uppercase leading-loose max-w-lg transition-colors duration-500"
            style={{ color: 'var(--text-landing-secondary)' }}
          >
            All pricing tiers are subject to network governance. <br />
            Managed cloud includes 256-bit encryption & localized persistence.
          </p>
        </div>
      </div>
    </section>
  )
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
