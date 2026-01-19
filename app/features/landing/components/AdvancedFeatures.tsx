import { useEffect, useState } from 'react'
import {
  Bot,
  Cpu,
  CreditCard,
  Scale,
  ShieldCheck,
  Store,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react'

const features = [
  {
    id: 'dr-ai',
    title: 'Dr. AI Veterinary Assistant',
    badge: 'AI DIAGNOSTICS',
    description:
      'Access expert veterinary triage instantly, anywhere. Our hybrid AI model runs locally on your device to analyze symptoms and photos, providing immediate care advice while you wait for a human vet.',
    details: [
      'Offline-first decision tree for immediate triage',
      'Multimodal analysis of symptoms and photos',
      'Escalation pathway to human veterinarians',
      'Works with poor or no internet connection',
    ],
    icon: Bot,
    color: 'emerald',
  },
  {
    id: 'passport',
    title: 'Financial Credit Passport',
    badge: 'DEFI READY',
    description:
      'Stop being "unbankable". Generate cryptographically verifiable financial reports that prove your farm\'s performance, mortality rates, and feed conversion ratios to lenders without revealing trade secrets.',
    details: [
      'Cryptographically signed PDF reports',
      'QR code verification for loan officers',
      'Aggregated risk and performance metrics',
      'Privacy-preserving data sharing',
    ],
    icon: CreditCard,
    color: 'violet',
  },
  {
    id: 'feed',
    title: 'Smart Feed Formulation',
    badge: 'COST OPTIMIZATION',
    description:
      'Feed accounts for 70% of production costs. Our linear programming engine calculates the perfect mix of locally available ingredients (maize, soya, etc.) to meet nutritional requirements at the lowest possible cost.',
    details: [
      'Least-cost formulation algorithm (Simplex)',
      'Database of local ingredient nutritional profiles',
      'Customizable nutritional constraints',
      'Save and share successful formulas',
    ],
    icon: Scale,
    color: 'cyan',
  },
  {
    id: 'foreman',
    title: 'Digital Foreman',
    badge: 'STAFF MANAGEMENT',
    description:
      'Manage your workforce with precision. Prevent theft and "ghost inventory" with role-based access control and GPS-verified clock-ins. Ensure every task is attributable to a specific team member.',
    details: [
      'GPS-fenced staff clock-in/out',
      'Granular Role-Based Access Control (RBAC)',
      'Attributable mortality and feed logs',
      'Blind inventory counts for audit integrity',
    ],
    icon: UserCheck,
    color: 'indigo',
  },
  {
    id: 'marketplace',
    title: 'Offline Marketplace',
    badge: 'DIRECT SALES',
    description:
      'Bypass exploitative middlemen. List your harvest for sale directly to local buyers. Our conflict-free sync engine ensures your listings are published as soon as you connect to the network.',
    details: [
      'Local-first listing creation',
      'Automatic background synchronization',
      'Location obfuscation for security',
      'Direct buyer-to-farmer messaging',
    ],
    icon: Store,
    color: 'amber',
  },
  {
    id: 'iot',
    title: 'IoT Sensor Hub',
    badge: 'AUTOMATION',
    description:
      "Prevent losses from heat stress and equipment failure. Connect low-cost ESP32 and Arduino sensors to monitor your farm's environment 24/7, receiving alerts before disaster strikes.",
    details: [
      'Plug-and-play extensive hardware support',
      'Real-time temperature & humidity alerts',
      'Historical environmental data logging',
      'Automated fan and cooling control triggers',
    ],
    icon: Cpu,
    color: 'blue',
  },
  {
    id: 'extension',
    title: 'Extension Worker Mode',
    badge: 'GOV / ENTERPRISE',
    description:
      'Empowering government agents and NGOs to manage thousands of farmers. A specialized interface for monitoring regional outbreaks, distributing resources, and tracking program impact.',
    details: [
      'Multi-tenant "Observer" access',
      'Regional disease outbreak heatmaps',
      'Digital prescription and visit logging',
      'Compliance and grant tracking',
    ],
    icon: Users,
    color: 'lime',
  },
]

export function AdvancedFeatures() {
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id')
            if (id) {
              setVisibleItems((prev) => new Set(prev).add(id))
            }
          }
        })
      },
      { threshold: 0.2 },
    )

    const elements = document.querySelectorAll('.advanced-feature-card')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <section
      className="py-32 px-6 lg:px-12 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-landing-page)' }}
    >
      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="mb-24 max-w-3xl">
          <h2
            className="text-4xl lg:text-6xl font-bold tracking-tight mb-6"
            style={{ color: 'var(--text-landing-primary)' }}
          >
            Advanced Capabilities <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">
              For The Future Farm.
            </span>
          </h2>
          <p
            className="text-xl font-light"
            style={{ color: 'var(--text-landing-secondary)' }}
          >
            Beyond standard management. OpenLivestock equips you with
            enterprise-grade tools to secure capital, automate operations, and
            access global markets.
          </p>
        </div>

        <div className="space-y-32">
          {features.map((feature, idx) => (
            <div
              key={feature.id}
              data-id={feature.id}
              id={feature.id}
              className={`advanced-feature-card group grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-1000 ${visibleItems.has(feature.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24'}`}
            >
              {/* Text Content */}
              <div
                className={`order-2 ${idx % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}
              >
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-6 bg-${feature.color}-500/10 border-${feature.color}-500/20 text-${feature.color}-500`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span className="text-xs font-mono uppercase tracking-widest">
                    {feature.badge}
                  </span>
                </div>

                <h3
                  className="text-3xl lg:text-4xl font-bold mb-6"
                  style={{ color: 'var(--text-landing-primary)' }}
                >
                  {feature.title}
                </h3>

                <p
                  className="text-lg leading-relaxed mb-8"
                  style={{ color: 'var(--text-landing-secondary)' }}
                >
                  {feature.description}
                </p>

                <ul className="space-y-4">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div
                        className={`mt-1.5 w-5 h-5 rounded-full bg-${feature.color}-500/20 flex items-center justify-center shrink-0`}
                      >
                        <ShieldCheck
                          className={`w-3 h-3 text-${feature.color}-500`}
                        />
                      </div>
                      <span
                        className="font-light"
                        style={{ color: 'var(--text-landing-primary)' }}
                      >
                        {detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual/Card */}
              <div
                className={`order-1 ${idx % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}`}
              >
                <div
                  className="aspect-[4/3] rounded-3xl border overflow-hidden relative group-hover:shadow-2xl transition-shadow duration-500"
                  style={{
                    borderColor: 'var(--border-landing-subtle)',
                    backgroundColor: 'var(--bg-landing-card)',
                  }}
                >
                  {/* Abstract Visual Representation */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-500/10 via-transparent to-transparent opacity-50`}
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`w-32 h-32 rounded-3xl bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-700`}
                    >
                      <feature.icon className="w-16 h-16 text-white" />
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div
                    className="absolute bottom-6 left-6 right-6 p-4 rounded-xl border backdrop-blur-md bg-black/20"
                    style={{ borderColor: 'var(--border-landing-subtle)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                      <div className="text-[10px] font-mono opacity-50">
                        SYS.Metric.{feature.id.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
