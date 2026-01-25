import {
  Boxes,
  Heart,
  History,
  LayoutGrid,
  Network,
  Package,
  TrendingUp,
  Users,
  WifiOff,
} from 'lucide-react'

const features = [
  {
    title: '6+ Livestock Types',
    description:
      'Poultry, Aquaculture, Cattle, Goats, Sheep, and Bees with species-specific metrics and tracking.',
    icon: LayoutGrid,
    borderColor: 'group-hover:border-emerald-500/20',
    iconColor: 'text-emerald-400',
    iconBg: 'from-emerald-500/20 to-cyan-500/20',
  },
  {
    title: 'Offline-First PWA',
    description:
      'Full functionality without internet. Syncs automatically when reconnected. Install on any device.',
    icon: WifiOff,
    borderColor: 'group-hover:border-cyan-500/20',
    iconColor: 'text-cyan-400',
    iconBg: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    title: 'Growth Forecasting',
    description:
      'Predict harvest dates and target weights using species-specific growth curves and historical data.',
    icon: TrendingUp,
    borderColor: 'group-hover:border-purple-500/20',
    iconColor: 'text-purple-400',
    iconBg: 'from-purple-500/20 to-pink-500/20',
  },
  {
    title: 'P&L Reports',
    description:
      'Track sales, expenses, and profitability with 20+ currency presets including USD, NGN, KES, EUR.',
    icon: History, // Used History instead of Dollar Sign because provided HTML used a different one internally in description
    borderColor: 'group-hover:border-yellow-500/20',
    iconColor: 'text-yellow-400',
    iconBg: 'from-yellow-500/20 to-orange-500/20',
  },
  {
    title: 'Feed & Medicine',
    description:
      'Monitor stock levels with low-threshold alerts. Track expiry dates and consumption patterns.',
    icon: Package,
    borderColor: 'group-hover:border-green-500/20',
    iconColor: 'text-green-400',
    iconBg: 'from-green-500/20 to-emerald-500/20',
  },
  {
    title: 'Multi-Farm Support',
    description:
      'Manage multiple farms from a single account with farm-level filtering and consolidated reports.',
    icon: Network,
    borderColor: 'group-hover:border-indigo-500/20',
    iconColor: 'text-indigo-400',
    iconBg: 'from-indigo-500/20 to-violet-500/20',
  },
  {
    title: 'Batch Lifecycle',
    description:
      'Track batches from acquisition to sale with status management and complete history.',
    icon: Boxes,
    borderColor: 'group-hover:border-blue-500/20',
    iconColor: 'text-blue-400',
    iconBg: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    title: 'Health Alerts',
    description:
      'Automatic warnings for mortality thresholds, vaccination schedules, and health records.',
    icon: Heart,
    borderColor: 'group-hover:border-red-500/20',
    iconColor: 'text-red-400',
    iconBg: 'from-red-500/20 to-pink-500/20',
  },
  {
    title: 'Customer Management',
    description:
      'Track customers, suppliers, and purchase history with comprehensive contact management.',
    icon: Users,
    borderColor: 'group-hover:border-teal-500/20',
    iconColor: 'text-teal-400',
    iconBg: 'from-teal-500/20 to-green-500/20',
  },
]

export function FeaturesBentoGrid() {
  return (
    <section
      className="relative w-full px-6 lg:px-12 py-24 border-y transition-colors duration-500"
      style={{
        backgroundColor: 'var(--bg-landing-page)',
        borderColor: 'var(--border-landing-subtle)',
      }}
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <h2
            className="font-manrope text-4xl lg:text-6xl font-semibold tracking-tight leading-[0.9] transition-colors duration-500"
            style={{ color: 'var(--text-landing-primary)' }}
          >
            <span className="block">Powerful Features</span>
            <span className="block text-neutral-600 dark:text-neutral-600">
              For Modern Farms
            </span>
          </h2>
          <p className="text-neutral-400 max-w-xs text-sm font-mono mt-6 md:mt-0">
            // ANALYTICS // TRACKING // OFFLINE
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`glass-card p-8 rounded-3xl transition-all duration-300 group ${feature.borderColor} hover:bg-black/5 dark:hover:bg-white/[0.02]`}
            >
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${feature.iconBg} border flex items-center justify-center mb-6 ${feature.iconColor} group-hover:scale-110 transition-transform`}
                style={{ borderColor: 'var(--border-landing-subtle)' }}
              >
                <feature.icon className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3
                className="text-lg font-medium mb-3 tracking-tight transition-colors duration-500"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm leading-relaxed font-light transition-colors duration-500"
                style={{ color: 'var(--text-landing-secondary)' }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
