import { Building2, MessageSquare, Shield, Users } from 'lucide-react'

const STATS = [
  {
    label: 'Active Farmers',
    value: '500+',
    icon: Users,
    color: 'text-emerald-500',
  },
  {
    label: 'Extension Agents',
    value: '50+',
    icon: Shield,
    color: 'text-blue-500',
  },
  {
    label: 'Districts Covered',
    value: '12',
    icon: Building2,
    color: 'text-purple-500',
  },
  {
    label: 'Daily Discussions',
    value: '200+',
    icon: MessageSquare,
    color: 'text-amber-500',
  },
]

export function CommunityStats() {
  return (
    <section
      className="py-20 px-6 lg:px-12 relative overflow-hidden text-center"
      style={{ backgroundColor: 'var(--bg-landing-page)' }}
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center group"
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-black/5 dark:bg-white/5 transition-transform group-hover:scale-110 ${stat.color}`}
                >
                  <Icon className="w-8 h-8" />
                </div>
                <div
                  className="text-4xl font-bold font-mono tracking-tighter mb-2"
                  style={{
                    color: 'var(--text-landing-primary)',
                  }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-sm font-medium uppercase tracking-widest opacity-60"
                  style={{
                    color: 'var(--text-landing-secondary)',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Extension Worker Value Prop */}
        <div
          className="mt-24 p-8 rounded-2xl border text-left"
          style={{
            backgroundColor: 'var(--bg-landing-card)',
            borderColor: 'var(--border-landing-subtle)',
          }}
        >
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10"
              style={{ color: 'var(--text-landing-primary)' }}
            >
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3
                className="text-2xl font-semibold mb-2"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                For Government & NGO Extension Workers
              </h3>
              <p
                className="text-base mb-4"
                style={{ color: 'var(--text-landing-secondary)' }}
              >
                LivestockAI provides extension workers with powerful oversight
                tools to monitor farm health across entire districts, detect
                disease outbreaks early, and provide better advisory services.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div>
                  <h4
                    className="font-semibold mb-2 text-sm"
                    style={{ color: 'var(--text-landing-primary)' }}
                  >
                    ✓ District Dashboard
                  </h4>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--text-landing-secondary)' }}
                  >
                    Monitor all farms in your district with color-coded health
                    status
                  </p>
                </div>
                <div>
                  <h4
                    className="font-semibold mb-2 text-sm"
                    style={{ color: 'var(--text-landing-primary)' }}
                  >
                    ✓ Outbreak Detection
                  </h4>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--text-landing-secondary)' }}
                  >
                    Automatic alerts when multiple farms show high mortality
                  </p>
                </div>
                <div>
                  <h4
                    className="font-semibold mb-2 text-sm"
                    style={{ color: 'var(--text-landing-primary)' }}
                  >
                    ✓ Digital Visit Records
                  </h4>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--text-landing-secondary)' }}
                  >
                    Record farm visits digitally with findings and
                    recommendations
                  </p>
                </div>
                <div>
                  <h4
                    className="font-semibold mb-2 text-sm"
                    style={{ color: 'var(--text-landing-primary)' }}
                  >
                    ✓ Privacy-First Access
                  </h4>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--text-landing-secondary)' }}
                  >
                    Farmers control who sees their data with time-limited access
                    grants
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <a
              href="/support"
              className="px-6 py-3 rounded-lg border font-mono text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              style={{
                borderColor: 'var(--border-landing-subtle)',
                color: 'var(--text-landing-primary)',
              }}
            >
              Contact for Extension Access →
            </a>
          </div>
        </div>

        {/* Farmer Community */}
        <div
          className="mt-8 p-8 rounded-2xl border text-left flex flex-col md:flex-row items-center justify-between gap-8"
          style={{
            backgroundColor: 'var(--bg-landing-card)',
            borderColor: 'var(--border-landing-subtle)',
          }}
        >
          <div>
            <h3
              className="text-2xl font-semibold mb-2"
              style={{ color: 'var(--text-landing-primary)' }}
            >
              Farmer-to-Farmer Support
            </h3>
            <p
              className="max-w-xl"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              Join our WhatsApp and Discord communities to connect with other
              farmers, share experiences, ask questions, and learn best
              practices.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="https://chat.whatsapp.com/livestockai"
              className="px-6 py-3 rounded-lg bg-[#25D366] text-white font-semibold text-sm hover:bg-[#128C7E] transition-colors whitespace-nowrap"
            >
              WhatsApp
            </a>
            <a
              href="https://discord.gg/livestockai"
              className="px-6 py-3 rounded-lg bg-[#5865F2] text-white font-semibold text-sm hover:bg-[#4752C4] transition-colors whitespace-nowrap"
            >
              Discord
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
