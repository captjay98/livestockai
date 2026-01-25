import { useEffect, useRef, useState } from 'react'
import {
  Globe,
  LayoutGrid,
  Minus,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react'

const features = [
  {
    title: 'Multi-Species Mastery',
    description:
      'Poultry, Aquaculture, Cattle, and more. Purpose-built modules for every stage of the lifecycle.',
    icon: LayoutGrid,
    accent: 'emerald',
    code: 'SPEC-01',
  },
  {
    title: 'Predictive Analytics',
    description:
      'Growth curves, mortality alerts, and revenue forecasting to keep your farm ahead.',
    icon: TrendingUp,
    accent: 'cyan',
    code: 'DATA-02',
  },
  {
    title: 'Financial Command',
    description:
      'P&L reports, invoicing, and multi-currency support for precise business tracking.',
    icon: Wallet,
    accent: 'emerald',
    code: 'ECON-03',
  },
  {
    title: 'Offline Reliability',
    description:
      'Works in the field without internet. Data syncs automatically when you reconnect.',
    icon: ShieldCheck,
    accent: 'cyan',
    code: 'SYNC-04',
  },
  {
    title: 'Global Ready',
    description:
      'Built-in support for multiple languages and international farming standards.',
    icon: Globe,
    accent: 'emerald',
    code: 'GLOB-05',
  },
  {
    title: 'Blazing Fast',
    description:
      'Edge-deployed infrastructure ensures zero latency for every user, everywhere.',
    icon: Zap,
    accent: 'cyan',
    code: 'CORE-06',
  },
]

const colorMap = {
  emerald:
    'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  cyan: 'from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
}

export function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="py-32 px-6 lg:px-12 relative overflow-hidden font-manrope transition-colors duration-500"
      style={{ backgroundColor: 'var(--bg-landing-page)' }}
      id="features"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-white/5 to-transparent" />
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          backgroundImage:
            'radial-gradient(var(--landing-grid-color) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 'var(--landing-grid-opacity)',
        }}
      />

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div
          className={`transition-all duration-1000 ease-out flex flex-col items-start mb-24 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <div className="flex items-center gap-4 mb-6">
            <Minus className="w-8 h-8 text-emerald-500 stroke-[3]" />
            <span className="text-xs font-mono uppercase tracking-[0.4em] text-emerald-500 font-bold">
              Platform Capabilities
            </span>
          </div>

          <h2
            className="text-5xl lg:text-7xl font-semibold tracking-tighter mb-8 leading-[0.9] transition-colors duration-500"
            style={{ color: 'var(--text-landing-primary)' }}
          >
            Everything you need to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400">
              scale with speed.
            </span>
          </h2>

          <p
            className="max-w-xl text-lg font-light leading-relaxed transition-colors duration-500"
            style={{ color: 'var(--text-landing-secondary)' }}
          >
            A unified operating system for modern livestock farming. <br />
            Engineered for precision, built for scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`group relative p-[1px] rounded-2xl overflow-hidden transition-all duration-700 ${
                inView
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${idx * 150}ms` }}
            >
              {/* Card Gradient Border */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent group-hover:from-emerald-500/20 transition-all duration-500" />

              {/* Inner Card */}
              <div
                className="relative h-full backdrop-blur-xl rounded-[calc(1rem-1px)] p-10 border overflow-hidden flex flex-col transition-colors duration-500"
                style={{
                  backgroundColor: 'var(--bg-landing-card)',
                  borderColor: 'var(--border-landing-subtle)',
                }}
              >
                {/* Tech Accents */}
                <div className="absolute top-4 right-4 text-[9px] font-mono text-neutral-400 dark:text-neutral-700 tracking-[0.2em] group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors uppercase">
                  {feature.code}
                </div>

                <div
                  className={`w-14 h-14 rounded-2xl border bg-gradient-to-br transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 flex items-center justify-center mb-8 ${colorMap[feature.accent as keyof typeof colorMap]}`}
                >
                  <feature.icon className="w-7 h-7 stroke-[1.5]" />
                </div>

                <h3
                  className="text-2xl font-semibold mb-4 tracking-tight uppercase group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                  style={{ color: 'var(--text-landing-primary)' }}
                >
                  {feature.title}
                </h3>

                <p
                  className="leading-relaxed font-light text-[15px] group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors"
                  style={{ color: 'var(--text-landing-secondary)' }}
                >
                  {feature.description}
                </p>

                {/* Decorative bottom line */}
                <div className="mt-auto pt-8">
                  <div className="h-[1px] w-0 group-hover:w-full bg-gradient-to-r from-emerald-500/40 to-transparent transition-all duration-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extreme Background Glows */}
      <div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-emerald-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[600px] h-[600px] bg-cyan-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
    </section>
  )
}
