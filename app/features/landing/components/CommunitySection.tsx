import { GitMerge, Github, Heart, Star, Users } from 'lucide-react'

const stats = [
  { label: 'Contributors', value: '120+', icon: Users, color: 'emerald' },
  { label: 'GitHub Stars', value: '2.5k', icon: Star, color: 'amber' },
  { label: 'Forks', value: '450+', icon: GitMerge, color: 'cyan' },
  { label: 'Sponsors', value: '50+', icon: Heart, color: 'pink' },
]

export function CommunitySection() {
  return (
    <section
      className="py-24 px-6 lg:px-12 relative overflow-hidden font-manrope border-y transition-colors duration-500"
      style={{
        backgroundColor: 'var(--bg-landing-page)',
        borderColor: 'var(--border-landing-subtle)',
      }}
    >
      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24">
          {/* Text Content */}
          <div className="flex-1 text-left">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-8 transition-colors duration-500"
              style={{
                backgroundColor: 'var(--bg-landing-pill)',
                borderColor: 'var(--border-landing-subtle)',
              }}
            >
              <Github className="w-4 h-4 text-neutral-800 dark:text-white" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Open Source Protocol
              </span>
            </div>

            <h2
              className="text-4xl lg:text-6xl font-semibold tracking-tight mb-6 transition-colors duration-500"
              style={{ color: 'var(--text-landing-primary)' }}
            >
              Powered by <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400">
                Community Intelligence.
              </span>
            </h2>

            <p
              className="text-lg font-light leading-relaxed max-w-xl mb-10 transition-colors duration-500"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              OpenLivestock is more than software; it's a movement. Built by
              farmers and developers working together to democratize
              agricultural technology.
            </p>

            <a
              href="https://github.com/captjay98/open-livestock-manager"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 transition-colors group"
              style={{
                backgroundColor: 'var(--bg-landing-card)',
                borderColor: 'var(--border-landing-subtle)',
              }}
            >
              <span
                className="text-sm font-medium transition-colors duration-500"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                Join on GitHub
              </span>
              <div className="p-1 rounded bg-black/5 dark:bg-white/10 group-hover:bg-emerald-500/20 transition-colors">
                <Github className="w-4 h-4 text-emerald-600 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400" />
              </div>
            </a>
          </div>

          {/* Stats Grid */}
          <div className="flex-1 w-full lg:min-w-[500px]">
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border transition-all duration-500 group relative overflow-hidden"
                  style={{
                    backgroundColor: 'var(--bg-landing-card)',
                    borderColor: 'var(--border-landing-subtle)',
                  }}
                >
                  <div
                    className={`absolute -right-4 -top-4 w-24 h-24 bg-${stat.color}-500/10 blur-[40px] rounded-full group-hover:bg-${stat.color}-500/20 transition-colors`}
                  />

                  <div className="relative z-10">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform duration-500 border bg-black/5 dark:bg-white/5 group-hover:scale-110 text-${stat.color}-600 dark:text-${stat.color}-400`}
                      style={{ borderColor: 'var(--border-landing-subtle)' }}
                    >
                      <stat.icon className="w-5 h-5 stroke-[1.5]" />
                    </div>
                    <div
                      className="text-3xl font-bold mb-1 tracking-tight transition-colors duration-500"
                      style={{ color: 'var(--text-landing-primary)' }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contribution Graph Pattern (Mock) */}
            <div className="mt-8 flex gap-1 justify-center opacity-20 mask-gradient-b">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div
                      key={j}
                      className={`w-3 h-3 rounded-sm ${
                        Math.random() > 0.7
                          ? 'bg-emerald-500'
                          : 'bg-neutral-200 dark:bg-neutral-800'
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
