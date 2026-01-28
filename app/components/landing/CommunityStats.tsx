import { GitFork, Github, Star, Users } from 'lucide-react'

const STATS = [
    {
        label: 'Contributors',
        value: '12',
        icon: Users,
        color: 'text-emerald-500',
    },
    {
        label: 'GitHub Stars',
        value: '45',
        icon: Star,
        color: 'text-amber-500',
    },
    {
        label: 'Forks',
        value: '8',
        icon: GitFork,
        color: 'text-blue-500',
    },
    {
        label: 'Commits',
        value: '1,200+',
        icon: Github,
        color: 'text-purple-500',
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

                <div
                    className="mt-24 p-8 rounded-2xl border text-left flex flex-col md:flex-row items-center justify-between gap-8"
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
                            Contribute Code
                        </h3>
                        <p
                            className="max-w-xl"
                            style={{ color: 'var(--text-landing-secondary)' }}
                        >
                            We welcome contributions from everyone. Whether it's
                            fixing a bug, adding a feature, or improving
                            documentation.
                        </p>
                    </div>
                    <a
                        href="https://github.com/captjay98/open-livestock-manager/blob/main/CONTRIBUTING.md"
                        className="px-6 py-3 rounded-lg border font-mono text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
                        style={{
                            borderColor: 'var(--border-landing-subtle)',
                            color: 'var(--text-landing-primary)',
                        }}
                    >
                        Read Contribution Guide →
                    </a>
                </div>
            </div>
        </section>
    )
}
