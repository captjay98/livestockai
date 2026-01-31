import { useEffect, useRef, useState } from 'react'

const thresholds = [
  { species: 'Broiler', amber: '5%', red: '10%' },
  { species: 'Layer', amber: '3%', red: '7%' },
  { species: 'Catfish', amber: '12%', red: '18%' },
  { species: 'Tilapia', amber: '10%', red: '15%' },
  { species: 'Cattle', amber: '2%', red: '5%' },
  { species: 'Goats', amber: '3%', red: '7%' },
  { species: 'Sheep', amber: '3%', red: '7%' },
]

export function ExtensionHealthStatus() {
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
      className="relative w-full px-6 lg:px-12 py-24 border-t transition-colors duration-500"
      style={{
        backgroundColor: 'var(--bg-landing-page)',
        borderColor: 'var(--border-landing-subtle)',
      }}
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Explanation */}
          <div
            className={`transition-all duration-1000 ease-out ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}
          >
            <h2
              className="font-manrope text-4xl lg:text-5xl font-semibold tracking-tight mb-6 transition-colors duration-500"
              style={{ color: 'var(--text-landing-primary)' }}
            >
              Species-Specific
              <br />
              <span className="text-purple-500">Health Thresholds</span>
            </h2>

            <p
              className="text-lg mb-8 transition-colors duration-500"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              Farms are classified based on mortality rates using
              species-specific thresholds. Admins can configure custom
              thresholds per region.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full bg-emerald-500" />
                <span
                  className="transition-colors duration-500"
                  style={{ color: 'var(--text-landing-secondary)' }}
                >
                  <strong className="text-emerald-500">Green:</strong> Mortality
                  rate below amber threshold
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full bg-amber-500" />
                <span
                  className="transition-colors duration-500"
                  style={{ color: 'var(--text-landing-secondary)' }}
                >
                  <strong className="text-amber-500">Amber:</strong> Mortality
                  rate between amber and red
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span
                  className="transition-colors duration-500"
                  style={{ color: 'var(--text-landing-secondary)' }}
                >
                  <strong className="text-red-500">Red:</strong> Mortality rate
                  above red threshold
                </span>
              </div>
            </div>
          </div>

          {/* Right: Threshold Table */}
          <div
            className={`transition-all duration-1000 ease-out ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="glass-card rounded-2xl overflow-hidden">
              <div
                className="px-6 py-4 border-b transition-colors duration-500"
                style={{ borderColor: 'var(--border-landing-subtle)' }}
              >
                <h3
                  className="font-medium transition-colors duration-500"
                  style={{ color: 'var(--text-landing-primary)' }}
                >
                  Default Mortality Thresholds
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className="border-b transition-colors duration-500"
                      style={{ borderColor: 'var(--border-landing-subtle)' }}
                    >
                      <th
                        className="px-6 py-3 text-left text-xs font-mono uppercase tracking-wider transition-colors duration-500"
                        style={{ color: 'var(--text-landing-secondary)' }}
                      >
                        Species
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-mono uppercase tracking-wider text-amber-500">
                        Amber
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-mono uppercase tracking-wider text-red-500">
                        Red
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {thresholds.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b last:border-b-0 transition-colors duration-500 hover:bg-black/5 dark:hover:bg-white/[0.02]"
                        style={{ borderColor: 'var(--border-landing-subtle)' }}
                      >
                        <td
                          className="px-6 py-3 text-sm font-medium transition-colors duration-500"
                          style={{ color: 'var(--text-landing-primary)' }}
                        >
                          {row.species}
                        </td>
                        <td className="px-6 py-3 text-center text-sm text-amber-500 font-mono">
                          {row.amber}
                        </td>
                        <td className="px-6 py-3 text-center text-sm text-red-500 font-mono">
                          {row.red}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
