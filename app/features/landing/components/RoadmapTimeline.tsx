import { CheckCircle2, Circle, Clock, Target } from 'lucide-react'

interface Milestone {
  title: string
  description: string
  status: 'completed' | 'in-progress' | 'planned' | 'future'
  quarter: string
  items: Array<string>
}

const ROADMAP_DATA: Array<Milestone> = [
  {
    title: 'Foundation & Core',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
    status: 'completed',
    quarter: 'Q4 2025',
    items: [
      'Lorem ipsum dolor sit amet',
      'Consectetur adipiscing elit',
      'Sed do eiusmod tempor',
      'Ut labore et dolore magna',
      'Aliqua ut enim ad minim',
    ],
  },
  {
    title: 'Intelligence & Alerts',
    description:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea.',
    status: 'in-progress',
    quarter: 'Q1 2026',
    items: [
      'Duis aute irure dolor',
      'In reprehenderit in',
      'Voluptate velit esse',
      'Cillum dolore eu fugiat',
      'Nulla pariatur excepteur',
    ],
  },
  {
    title: 'Ecosystem Expansion',
    description:
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.',
    status: 'planned',
    quarter: 'Q2 2026',
    items: [
      'Sint occaecat cupidatat',
      'Non proident sunt in',
      'Culpa qui officia deserunt',
      'Mollit anim id est laborum',
      'Sed ut perspiciatis unde',
    ],
  },
  {
    title: 'Future Horizons',
    description:
      'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
    status: 'future',
    quarter: '2026+',
    items: [
      'Omnis iste natus error',
      'Sit voluptatem accusantium',
      'Doloremque laudantium',
      'Totam rem aperiam',
      'Eaque ipsa quae ab',
    ],
  },
]

export function RoadmapTimeline() {
  return (
    <section
      className="py-20 px-6 lg:px-12 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-landing-page)' }}
    >
      <div className="max-w-5xl mx-auto relative z-10">
        <div
          className="relative border-l ml-4 md:ml-0 md:pl-0"
          style={{ borderColor: 'var(--border-landing-subtle)' }}
        >
          {ROADMAP_DATA.map((milestone) => {
            const Icon =
              milestone.status === 'completed'
                ? CheckCircle2
                : milestone.status === 'in-progress'
                  ? Clock
                  : milestone.status === 'planned'
                    ? Target
                    : Circle

            const iconColor =
              milestone.status === 'completed'
                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                : milestone.status === 'in-progress'
                  ? 'text-blue-500 bg-blue-500/10 border-blue-500/20'
                  : milestone.status === 'planned'
                    ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                    : 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20'

            return (
              <div
                key={milestone.title}
                className="mb-16 relative pl-12 md:pl-0"
              >
                {/* Timeline Dot (Desktop: Center/Left aligned logic could be complex, keeping strict left for simplicity first) */}
                <div
                  className={`absolute left-[-20px] top-0 w-10 h-10 rounded-full border flex items-center justify-center bg-white dark:bg-black z-10 ${iconColor}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="grid md:grid-cols-12 gap-8 items-start">
                  <div className="md:col-span-4 pt-1">
                    <div
                      className="inline-block px-3 py-1 rounded-full text-xs font-mono mb-2 border md:mb-4"
                      style={{
                        backgroundColor: 'var(--bg-landing-pill)',
                        borderColor: 'var(--border-landing-subtle)',
                        color: 'var(--text-landing-secondary)',
                      }}
                    >
                      {milestone.quarter}
                    </div>
                    <h3
                      className="text-2xl font-semibold mb-2"
                      style={{ color: 'var(--text-landing-primary)' }}
                    >
                      {milestone.title}
                    </h3>
                    <p style={{ color: 'var(--text-landing-secondary)' }}>
                      {milestone.description}
                    </p>
                  </div>

                  <div className="md:col-span-8">
                    <div
                      className="rounded-xl border p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      style={{
                        borderColor: 'var(--border-landing-subtle)',
                        backgroundColor: 'var(--bg-landing-card)',
                      }}
                    >
                      <ul className="grid sm:grid-cols-2 gap-4">
                        {milestone.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div
                              className={`mt-1.5 w-1.5 h-1.5 rounded-full ${
                                milestone.status === 'completed'
                                  ? 'bg-emerald-500'
                                  : milestone.status === 'in-progress'
                                    ? 'bg-blue-500'
                                    : 'bg-neutral-400'
                              }`}
                            />
                            <span
                              className="text-sm font-light leading-relaxed"
                              style={{ color: 'var(--text-landing-primary)' }}
                            >
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
