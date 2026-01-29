import { useEffect, useRef, useState } from 'react'
import {
  Database,
  Globe,
  Layers,
  Rocket,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react'

const techStack = [
  {
    name: 'TanStack Start',
    role: 'FRAMEWORK',
    version: 'v1.0.0',
    description: 'Next-gen React framework with full-stack type safety.',
    icon: Rocket,
    color: 'emerald',
    code: 'bun create @tanstack/start@latest',
    nodeId: 'TS-01',
  },
  {
    name: 'Neon Postgres',
    role: 'DATABASE',
    version: 'v16.2',
    description: 'Serverless PostgreSQL with instant branching.',
    icon: Database,
    color: 'cyan',
    code: 'pg_connect(neon_dsn)',
    nodeId: 'DB-02',
  },
  {
    name: 'Cloudflare Workers',
    role: 'EDGE_RUNTIME',
    version: 'v3.0',
    description: 'Global edge deployment with <50ms latency.',
    icon: Globe,
    color: 'emerald',
    code: 'wrangler deploy --env production',
    nodeId: 'CF-03',
  },
  {
    name: 'Kysely',
    role: 'QUERY_BUILDER',
    version: 'v0.27',
    description: 'Type-safe SQL builder for TypeScript.',
    icon: Layers,
    color: 'cyan',
    code: 'db.selectFrom("farms").selectAll()',
    nodeId: 'KY-04',
  },
  {
    name: 'Better Auth',
    role: 'SECURITY',
    version: 'v1.1',
    description: 'Secure, passwordless authentication methodology.',
    icon: ShieldCheck,
    color: 'emerald',
    code: 'auth.getSession({ headers })',
    nodeId: 'AU-05',
  },
  {
    name: 'Tailwind v4',
    role: 'STYLING_ENGINE',
    version: 'v4.0-alpha',
    description: 'Zero-runtime CSS with oxide engine.',
    icon: Zap,
    color: 'cyan',
    code: '@theme { --font-sans: "Manrope" }',
    nodeId: 'TW-06',
  },
]

export function TechStackSection() {
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
      id="stack"
    >
      {/* Background Grid */}
      <div
        className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none transition-opacity duration-500"
        style={{
          backgroundImage:
            'linear-gradient(var(--landing-grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--landing-grid-color) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 'var(--landing-grid-opacity)',
        }}
      />

      <div className="max-w-[1400px] mx-auto relative z-10">
        {/* Header */}
        <div
          className={`mb-24 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <div className="flex items-center gap-2 mb-6 text-cyan-600 dark:text-cyan-500">
            <Terminal className="w-5 h-5" />
            <span className="font-mono text-sm tracking-widest uppercase">
              System Architecture
            </span>
          </div>
          <h2
            className="text-4xl lg:text-6xl font-medium tracking-tighter mb-6 transition-colors duration-500"
            style={{ color: 'var(--text-landing-primary)' }}
          >
            Built for the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400">
              Future.
            </span>
          </h2>
          <p
            className="max-w-2xl text-lg font-light border-l-2 pl-6 transition-colors duration-500"
            style={{
              color: 'var(--text-landing-secondary)',
              borderColor: 'var(--border-landing-subtle)',
            }}
          >
            A modern, type-safe stack designed for reliability, speed, and
            developer experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techStack.map((tech, idx) => (
            <div
              key={idx}
              className={`group relative perspective-card transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              <div
                className="relative h-full backdrop-blur-md rounded-xl p-1 overflow-hidden hover:border-emerald-500/30 transition-colors duration-500 border"
                style={{
                  backgroundColor: 'var(--bg-landing-card)',
                  borderColor: 'var(--border-landing-subtle)',
                }}
              >
                {/* Card Content */}
                <div
                  className="rounded-lg p-6 h-full flex flex-col relative z-10 transition-colors duration-500"
                  style={{
                    backgroundColor: 'var(--bg-landing-pill)',
                  }}
                >
                  {/* Top Bar */}
                  <div
                    className="flex items-center justify-between mb-6 border-b pb-4"
                    style={{
                      borderColor: 'var(--border-landing-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${tech.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'}`}
                      >
                        <tech.icon className="w-5 h-5 stroke-[1.5]" />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className="font-semibold tracking-tight transition-colors duration-500"
                          style={{
                            color: 'var(--text-landing-primary)',
                          }}
                        >
                          {tech.name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {tech.version}
                        </span>
                      </div>
                    </div>
                    <div
                      className="text-[9px] font-mono text-neutral-500 dark:text-neutral-600 border px-2 py-1 rounded bg-black/5 dark:bg-white/[0.02]"
                      style={{
                        borderColor: 'var(--border-landing-subtle)',
                      }}
                    >
                      {tech.nodeId}
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    className="text-sm font-light leading-relaxed mb-8 flex-grow transition-colors duration-500"
                    style={{
                      color: 'var(--text-landing-secondary)',
                    }}
                  >
                    {tech.description}
                  </p>

                  {/* Code Block Look */}
                  <div className="bg-neutral-100 dark:bg-neutral-900 rounded-md p-3 border border-black/5 dark:border-white/10 group-hover:border-black/10 dark:group-hover:border-white/20 transition-colors relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500/50 to-transparent" />
                    <code className="text-[10px] font-mono text-neutral-600 dark:text-neutral-300 flex items-center gap-2">
                      <span className="text-emerald-500">$</span>
                      {tech.code}
                    </code>
                  </div>

                  {/* Role Badge */}
                  <div className="absolute top-0 right-0 p-6 pointer-events-none">
                    <div className="text-[9px] font-mono tracking-widest text-neutral-400 dark:text-neutral-700 group-hover:text-emerald-500/50 transition-colors uppercase rotate-90 origin-top-right translate-x-2">
                      {tech.role}
                    </div>
                  </div>
                </div>

                {/* Hover Glow */}
                <div
                  className={`absolute -inset-2 bg-gradient-to-r ${tech.color === 'emerald' ? 'from-emerald-500/20' : 'from-cyan-500/20'} to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700 pointer-events-none`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
