import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  FileText,
  LayoutGrid,
  Minus,
  Shield,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

const benefits = [
  {
    title: 'District Dashboard',
    description:
      'Monitor all farms in your district with color-coded health status at a glance.',
    icon: LayoutGrid,
  },
  {
    title: 'Outbreak Detection',
    description:
      'Automatic alerts when multiple farms show high mortality patterns.',
    icon: AlertTriangle,
  },
  {
    title: 'Digital Visit Records',
    description:
      'Record farm visits digitally with findings, recommendations, and attachments.',
    icon: FileText,
  },
  {
    title: 'Privacy-First Access',
    description:
      'Farmers control who sees their data with time-limited access grants.',
    icon: Shield,
  },
]

export function ExtensionSection() {
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
      id="extension"
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
            <Minus className="w-8 h-8 text-purple-500 stroke-[3]" />
            <span className="text-xs font-mono uppercase tracking-[0.4em] text-purple-500 font-bold">
              For Government & NGOs
            </span>
          </div>

          <h2
            className="text-5xl lg:text-7xl font-semibold tracking-tighter mb-8 leading-[0.9] transition-colors duration-500"
            style={{ color: 'var(--text-landing-primary)' }}
          >
            Built for Agricultural <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400">
              Extension Services
            </span>
          </h2>

          <p
            className="max-w-xl text-lg font-light leading-relaxed transition-colors duration-500"
            style={{ color: 'var(--text-landing-secondary)' }}
          >
            Empower your field agents with district-wide farm monitoring and
            early disease detection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {benefits.map((benefit, idx) => (
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
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent group-hover:from-purple-500/20 transition-all duration-500" />

              {/* Inner Card */}
              <div
                className="relative h-full backdrop-blur-xl rounded-[calc(1rem-1px)] p-8 border overflow-hidden flex items-start gap-6 transition-colors duration-500"
                style={{
                  backgroundColor: 'var(--bg-landing-card)',
                  borderColor: 'var(--border-landing-subtle)',
                }}
              >
                <div className="w-12 h-12 rounded-xl border bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-6 h-6 stroke-[1.5]" />
                </div>

                <div>
                  <h3
                    className="text-xl font-semibold mb-2 tracking-tight uppercase group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                    style={{
                      color: 'var(--text-landing-primary)',
                    }}
                  >
                    {benefit.title}
                  </h3>

                  <p
                    className="leading-relaxed font-light text-[15px] group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors"
                    style={{
                      color: 'var(--text-landing-secondary)',
                    }}
                  >
                    {benefit.description}
                  </p>
                </div>

                {/* Decorative bottom line */}
                <div className="absolute bottom-0 left-0 h-[1px] w-0 group-hover:w-full bg-gradient-to-r from-purple-500/40 to-transparent transition-all duration-700" />
              </div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
          style={{ transitionDelay: '600ms' }}
        >
          <Link
            to="/support"
            className="relative px-8 py-4 rounded-xl overflow-hidden group/btn font-mono text-sm font-bold tracking-[0.2em] uppercase transition-all duration-500 bg-purple-500 text-white hover:bg-purple-400"
          >
            <span className="relative z-20 flex items-center justify-center gap-2">
              Request Enterprise Demo
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          </Link>

          <Link
            to="/features"
            hash="extension"
            className="relative px-8 py-4 rounded-xl overflow-hidden group/btn font-mono text-sm font-bold tracking-[0.2em] uppercase transition-all duration-500 bg-black/5 dark:bg-white/5 border hover:border-purple-500/50 hover:bg-purple-500/5 dark:hover:bg-white/10"
            style={{
              color: 'var(--text-landing-primary)',
              borderColor: 'var(--border-landing-subtle)',
            }}
          >
            <span className="relative z-20 flex items-center justify-center gap-2">
              Learn More
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </div>

      {/* Background Glows */}
      <div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-purple-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[600px] h-[600px] bg-pink-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
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
