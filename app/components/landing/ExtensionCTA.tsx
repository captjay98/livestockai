import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  Headphones,
  Shield,
  Users,
} from 'lucide-react'

const enterpriseFeatures = [
  { icon: Users, text: 'Unlimited extension workers' },
  { icon: Globe, text: 'Multi-district management' },
  { icon: Shield, text: 'SLA guarantees' },
  { icon: Headphones, text: 'Dedicated account manager' },
]

const additionalFeatures = [
  'Outbreak detection & alerts',
  'Digital visit records',
  'Priority support',
  'Custom training',
  'Regional threshold configuration',
  'Comprehensive audit logs',
]

export function ExtensionCTA() {
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
      className="relative w-full px-6 lg:px-12 py-32 transition-colors duration-500"
      style={{ backgroundColor: 'var(--bg-landing-page)' }}
    >
      {/* Background Glows */}
      <div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-purple-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[600px] h-[600px] bg-pink-500/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div
          className={`text-center mb-16 transition-all duration-1000 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">
              GOV-05 • Enterprise
            </span>
          </div>

          <h2
            className="font-manrope text-4xl lg:text-6xl font-semibold tracking-tight mb-6 transition-colors duration-500"
            style={{ color: 'var(--text-landing-primary)' }}
          >
            Ready to Transform Your
            <br />
            <span className="text-purple-500">Extension Services?</span>
          </h2>

          <p
            className="max-w-2xl mx-auto text-lg transition-colors duration-500"
            style={{ color: 'var(--text-landing-secondary)' }}
          >
            Custom pricing for government agencies and NGOs. Contact our team
            for a personalized demo and deployment plan.
          </p>
        </div>

        {/* Pricing Card */}
        <div
          className={`max-w-3xl mx-auto transition-all duration-1000 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
          style={{ transitionDelay: '200ms' }}
        >
          <div
            className="glass-card rounded-3xl p-8 lg:p-12 border transition-colors duration-500"
            style={{ borderColor: 'var(--border-landing-subtle)' }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Key Features */}
              <div>
                <h3
                  className="text-2xl font-semibold mb-6 transition-colors duration-500"
                  style={{ color: 'var(--text-landing-primary)' }}
                >
                  Enterprise Features
                </h3>

                <div className="space-y-4 mb-8">
                  {enterpriseFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <span
                        className="font-medium transition-colors duration-500"
                        style={{ color: 'var(--text-landing-primary)' }}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Additional Features */}
              <div>
                <h3
                  className="text-2xl font-semibold mb-6 transition-colors duration-500"
                  style={{ color: 'var(--text-landing-primary)' }}
                >
                  Also Included
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {additionalFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span
                        className="text-sm transition-colors duration-500"
                        style={{ color: 'var(--text-landing-secondary)' }}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div
              className="mt-10 pt-8 border-t flex flex-col sm:flex-row gap-4 justify-center"
              style={{ borderColor: 'var(--border-landing-subtle)' }}
            >
              <Link
                to="/support"
                className="relative px-8 py-4 rounded-xl overflow-hidden group/btn font-mono text-sm font-bold tracking-[0.2em] uppercase transition-all duration-500 bg-purple-500 text-white hover:bg-purple-400 text-center"
              >
                <span className="relative z-20 flex items-center justify-center gap-2">
                  Request Enterprise Demo
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              </Link>

              <Link
                to="/support"
                className="relative px-8 py-4 rounded-xl overflow-hidden group/btn font-mono text-sm font-bold tracking-[0.2em] uppercase transition-all duration-500 bg-black/5 dark:bg-white/5 border hover:border-purple-500/50 hover:bg-purple-500/5 dark:hover:bg-white/10 text-center"
                style={{
                  color: 'var(--text-landing-primary)',
                  borderColor: 'var(--border-landing-subtle)',
                }}
              >
                <span className="relative z-20 flex items-center justify-center gap-2">
                  Contact Sales
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
