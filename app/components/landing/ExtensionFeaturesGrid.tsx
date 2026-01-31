import {
  AlertTriangle,
  Eye,
  FileText,
  LayoutGrid,
  Shield,
  Users,
} from 'lucide-react'

const features = [
  {
    title: 'District Dashboard',
    description:
      'Monitor all farms in your assigned district at a glance. Color-coded health status (green/amber/red) based on species-specific mortality thresholds.',
    icon: LayoutGrid,
    borderColor: 'group-hover:border-purple-500/20',
    iconColor: 'text-purple-400',
    iconBg: 'from-purple-500/20 to-pink-500/20',
  },
  {
    title: 'Outbreak Detection',
    description:
      'Automatic alerts when 3+ farms show high mortality in the same district. Severity classification (critical/alert/watch) with affected farm tracking.',
    icon: AlertTriangle,
    borderColor: 'group-hover:border-red-500/20',
    iconColor: 'text-red-400',
    iconBg: 'from-red-500/20 to-orange-500/20',
  },
  {
    title: 'Digital Visit Records',
    description:
      'Record farm visits digitally with findings, recommendations, and photo attachments. Set follow-up dates and track visit history.',
    icon: FileText,
    borderColor: 'group-hover:border-blue-500/20',
    iconColor: 'text-blue-400',
    iconBg: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    title: 'Privacy-First Access',
    description:
      'Farmers control who sees their data with time-limited access grants. Optional financial visibility. Revoke access anytime.',
    icon: Shield,
    borderColor: 'group-hover:border-emerald-500/20',
    iconColor: 'text-emerald-400',
    iconBg: 'from-emerald-500/20 to-green-500/20',
  },
  {
    title: 'Supervisor Dashboard',
    description:
      'Multi-district overview for senior extension workers. Aggregated statistics, regional mortality trends, and drill-down capabilities.',
    icon: Eye,
    borderColor: 'group-hover:border-indigo-500/20',
    iconColor: 'text-indigo-400',
    iconBg: 'from-indigo-500/20 to-violet-500/20',
  },
  {
    title: 'Role-Based Access',
    description:
      'Extension workers, supervisors, farmers, and admins each have tailored views. Audit logs track all actions for accountability.',
    icon: Users,
    borderColor: 'group-hover:border-teal-500/20',
    iconColor: 'text-teal-400',
    iconBg: 'from-teal-500/20 to-cyan-500/20',
  },
]

export function ExtensionFeaturesGrid() {
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
            <span className="block">Powerful Tools</span>
            <span className="block text-neutral-600 dark:text-neutral-600">
              For Field Agents
            </span>
          </h2>
          <p className="text-neutral-400 max-w-xs text-sm font-mono mt-6 md:mt-0">
            // MONITORING // DETECTION // ADVISORY
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
                style={{
                  borderColor: 'var(--border-landing-subtle)',
                }}
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
                style={{
                  color: 'var(--text-landing-secondary)',
                }}
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
