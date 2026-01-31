import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Eye,
  Send,
  UserCheck,
} from 'lucide-react'

const steps = [
  {
    number: '01',
    title: 'Request Access',
    description:
      'Extension worker submits access request with purpose and duration. Farmer receives notification.',
    icon: Send,
    color: 'purple',
  },
  {
    number: '02',
    title: 'Farmer Approves',
    description:
      'Farmer reviews request and approves with optional financial visibility. Access grant created with expiration.',
    icon: UserCheck,
    color: 'emerald',
  },
  {
    number: '03',
    title: 'View Farm Health',
    description:
      'Extension worker views farm details, batch health, mortality rates, and trends on the district dashboard.',
    icon: Eye,
    color: 'blue',
  },
  {
    number: '04',
    title: 'Create Visit Record',
    description:
      'Document farm visits with findings, recommendations, and photo attachments. Set follow-up dates.',
    icon: ClipboardList,
    color: 'orange',
  },
  {
    number: '05',
    title: 'Farmer Acknowledges',
    description:
      'Farmer reviews visit record and acknowledges recommendations. Complete audit trail maintained.',
    icon: CheckCircle2,
    color: 'teal',
  },
]

const colorClasses: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
  },
  teal: {
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
    border: 'border-teal-500/30',
  },
}

export function ExtensionWorkflow() {
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
      className="relative w-full px-6 lg:px-12 py-24 transition-colors duration-500"
      style={{ backgroundColor: 'var(--bg-landing-page)' }}
    >
      <div className="max-w-[1400px] mx-auto">
        <div
          className={`text-center mb-16 transition-all duration-1000 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <h2
            className="font-manrope text-4xl lg:text-6xl font-semibold tracking-tight mb-6 transition-colors duration-500"
            style={{ color: 'var(--text-landing-primary)' }}
          >
            How It Works
          </h2>
          <p
            className="max-w-2xl mx-auto text-lg transition-colors duration-500"
            style={{ color: 'var(--text-landing-secondary)' }}
          >
            A privacy-first workflow that puts farmers in control while enabling
            effective agricultural oversight.
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((step, idx) => {
              const colors = colorClasses[step.color]
              return (
                <div
                  key={idx}
                  className={`relative transition-all duration-700 ${
                    inView
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-12'
                  }`}
                  style={{ transitionDelay: `${idx * 150}ms` }}
                >
                  <div className="glass-card p-6 rounded-2xl h-full transition-colors duration-500 hover:bg-black/5 dark:hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}
                      >
                        <step.icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <span
                        className={`text-xs font-mono ${colors.text} uppercase tracking-wider`}
                      >
                        Step {step.number}
                      </span>
                    </div>

                    <h3
                      className="text-lg font-medium mb-2 tracking-tight transition-colors duration-500"
                      style={{ color: 'var(--text-landing-primary)' }}
                    >
                      {step.title}
                    </h3>

                    <p
                      className="text-sm leading-relaxed font-light transition-colors duration-500"
                      style={{ color: 'var(--text-landing-secondary)' }}
                    >
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow between steps (desktop only) */}
                  {idx < steps.length - 1 && (
                    <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="w-6 h-6 text-purple-500/50" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
