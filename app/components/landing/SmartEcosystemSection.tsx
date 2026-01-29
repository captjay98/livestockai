import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Bot,
  Cpu,
  CreditCard,
  Scale,
  ScanFace,
  Sparkles,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { MouseEvent } from 'react'

const ecosystems = [
  {
    title: 'Farm Sentinel',
    subtitle: 'Marathon Agent',
    description:
      'Autonomous 24/7 monitoring with causal reasoning. Detects anomalies before they become disasters.',
    icon: Bot,
    // Using semantic color mapping instead of hardcoded classes
    accent: 'primary',
    link: '/features#sentinel',
    colSpan: 'md:col-span-2 lg:col-span-2',
  },
  {
    title: 'Vision Assistant',
    subtitle: 'Real-Time Teacher',
    description:
      'Point your camera for instant health assessment, weight estimation, and adaptive guidance.',
    icon: ScanFace,
    accent: 'secondary',
    link: '/features#vision',
    colSpan: 'md:col-span-1 lg:col-span-1',
  },
  {
    title: 'Farm Optimizer',
    subtitle: 'Vibe Engineering',
    description:
      'AI that backtests strategies before recommending. Verified improvements, not guesses.',
    icon: Scale,
    accent: 'primary',
    link: '/features#optimizer',
    colSpan: 'md:col-span-1 lg:col-span-1',
  },
  {
    title: 'Credit Passport',
    subtitle: 'DeFi Ready',
    description: 'Cryptographic proof of farm performance for lenders.',
    icon: CreditCard,
    accent: 'secondary',
    link: '/features#passport',
    colSpan: 'md:col-span-1 lg:col-span-1',
  },
  {
    title: 'IoT Sensor Hub',
    subtitle: 'Automation',
    description:
      'Connect ESP32/Arduino sensors for real-time environmental monitoring and alerts.',
    icon: Cpu,
    accent: 'primary',
    link: '/features#iot',
    colSpan: 'md:col-span-2 lg:col-span-2',
  },
]

export function SmartEcosystemSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
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

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="py-32 px-6 lg:px-12 relative overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: 'var(--bg-landing-page)' }}
    >
      {/* Dynamic Spotlight - Using CSS vars for color (Emerald-ish in light, glowy in dark) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5 transition-opacity duration-300"
        style={{
          background: `radial-gradient(1000px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--landing-grid-color), transparent 40%)`,
        }}
      />

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(var(--landing-grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--landing-grid-color) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          maskImage:
            'radial-gradient(circle at 50% 50%, black, transparent 90%)',
        }}
      />

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div
          className={`flex flex-col md:flex-row justify-between items-end mb-20 gap-8 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-6 backdrop-blur-md"
              style={{
                backgroundColor: 'var(--bg-landing-pill)',
                borderColor: 'var(--border-landing-subtle)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Powered by Gemini 3
              </span>
            </div>

            <h2
              className="text-5xl lg:text-7xl font-bold tracking-tighter mb-6 leading-[0.9]"
              style={{ color: 'var(--text-landing-primary)' }}
            >
              Smart{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">
                Ecosystem
              </span>
            </h2>

            <p
              className="text-xl font-light leading-relaxed transition-colors duration-500"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              A neural network for your farm. Automating specific decisions so
              you can focus on scale.
            </p>
          </div>

          <div
            className="hidden md:flex items-center gap-2 text-sm font-mono transition-colors duration-500"
            style={{ color: 'var(--text-landing-secondary)' }}
          >
            <ScanFace className="w-4 h-4" />
            <span>SYSTEM_READY</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ecosystems.map((item, idx) => (
            <Link
              to={item.link}
              key={idx}
              /* 
                                              Using semantic variables for card backgrounds and borders. 
                                              Hover effects use brand colors (emerald/cyan) via Tailwind utility classes, 
                                              which is consistent with the rest of the site but avoids hardcoded hex/arbitrary values for the base state.
                                          */
              className={`group relative rounded-3xl p-8 border backdrop-blur-sm overflow-hidden transition-all duration-500 ${item.colSpan} flex flex-col justify-between ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{
                backgroundColor: 'var(--bg-landing-card)',
                borderColor: 'var(--border-landing-subtle)',
                transitionDelay: `${idx * 75}ms`,
              }}
            >
              {/* Hover Gradient Overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-${item.accent === 'primary' ? 'emerald' : 'cyan'}-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <div className="mb-8 relative z-10">
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center p-0.5 mb-6 group-hover:scale-110 transition-transform duration-500 bg-gradient-to-br ${item.accent === 'primary' ? 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'}`}
                >
                  <item.icon className="w-6 h-6 stroke-[1.5]" />
                </div>

                <h3
                  className="text-2xl font-bold mb-2 transition-colors duration-300 group-hover:text-emerald-500"
                  style={{
                    color: 'var(--text-landing-primary)',
                  }}
                >
                  {item.title}
                </h3>
                <div
                  className="text-xs font-mono mb-4 opacity-60"
                  style={{
                    color: 'var(--text-landing-secondary)',
                  }}
                >
                  {item.subtitle}
                </div>
                <p
                  className="font-light leading-relaxed transition-colors duration-500"
                  style={{
                    color: 'var(--text-landing-secondary)',
                  }}
                >
                  {item.description}
                </p>
              </div>

              <div
                className="flex items-center justify-between mt-auto pt-8 border-t relative z-10 transition-colors duration-500"
                style={{
                  borderColor: 'var(--border-landing-subtle)',
                }}
              >
                <div
                  className="h-1 w-12 rounded-full overflow-hidden"
                  style={{
                    backgroundColor: 'var(--bg-landing-pill)',
                  }}
                >
                  <div
                    className={`h-full w-0 group-hover:w-full transition-all duration-700 ease-out ${item.accent === 'primary' ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                  />
                </div>
                <ArrowRight
                  className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-all duration-500 group-hover:text-emerald-500"
                  style={{
                    color: 'var(--text-landing-secondary)',
                  }}
                />
              </div>
            </Link>
          ))}

          {/* Beta Access CTA */}
          <Link
            to="/register"
            className="group relative rounded-3xl p-8 border border-dashed flex flex-col items-center justify-center text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-500 md:col-span-2 lg:col-span-1"
            style={{ borderColor: 'var(--border-landing-subtle)' }}
          >
            <span
              className="text-sm font-mono mb-2"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              ACCESS THE BETA
            </span>
            <span
              className="text-2xl font-bold mb-4 transition-colors group-hover:text-emerald-500"
              style={{ color: 'var(--text-landing-primary)' }}
            >
              Start Now
            </span>
            <div
              className="w-10 h-10 rounded-full border flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-white transition-all duration-300"
              style={{
                borderColor: 'var(--border-landing-subtle)',
                color: 'var(--text-landing-primary)',
              }}
            >
              <ArrowRight className="w-5 h-5" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
