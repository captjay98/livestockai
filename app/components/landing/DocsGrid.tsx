import { Book, Code2, Server, Settings, Shield, Terminal } from 'lucide-react'

const DOCS_SECTIONS = [
    {
        title: 'Getting Started',
        description: 'Quick start guide for new users and farmers.',
        icon: Book,
        color: 'text-emerald-500',
        links: ['Introduction', 'Core Concepts', 'First Login'],
    },
    {
        title: 'Installation',
        description: 'Self-hosting guide and server requirements.',
        icon: Server,
        color: 'text-blue-500',
        links: [
            'Docker Compose',
            'Manual Installation',
            'Environment Variables',
        ],
    },
    {
        title: 'API Reference',
        description: 'REST API documentation for developers.',
        icon: Code2,
        color: 'text-purple-500',
        links: ['Authentication', 'Endpoints', 'Webhooks'],
        href: '/typedocs/',
    },
    {
        title: 'CLI Tools',
        description: 'Command line utilities for management.',
        icon: Terminal,
        color: 'text-amber-500',
        links: ['Installation', 'Commands', 'Backup/Restore'],
    },
    {
        title: 'Configuration',
        description: 'Advanced settings and customization options.',
        icon: Settings,
        color: 'text-rose-500',
        links: ['Theme Config', 'Localization', 'Plugins'],
    },
    {
        title: 'Security',
        description: 'Best practices for securing your instance.',
        icon: Shield,
        color: 'text-cyan-500',
        links: ['SSL/TLS', 'Firewall', 'User Roles'],
    },
]

export function DocsGrid() {
    return (
        <section
            className="py-20 px-6 lg:px-12 relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-landing-page)' }}
        >
            <div className="max-w-6xl mx-auto relative z-10">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {DOCS_SECTIONS.map((section) => {
                        const Icon = section.icon

                        const CardContent = (
                            <>
                                <div
                                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 bg-black/5 dark:bg-white/5 ${section.color}`}
                                >
                                    <Icon className="w-6 h-6" />
                                </div>

                                <h3
                                    className="text-xl font-semibold mb-3 group-hover:text-emerald-500 transition-colors"
                                    style={{
                                        color: 'var(--text-landing-primary)',
                                    }}
                                >
                                    {section.title}
                                </h3>

                                <p
                                    className="mb-6 text-sm leading-relaxed"
                                    style={{
                                        color: 'var(--text-landing-secondary)',
                                    }}
                                >
                                    {section.description}
                                </p>

                                <ul className="space-y-2">
                                    {section.links.map((link) => (
                                        <li key={link}>
                                            <span
                                                className="text-sm hover:text-emerald-500 transition-colors flex items-center gap-2"
                                                style={{
                                                    color: 'var(--text-landing-secondary)',
                                                }}
                                            >
                                                <span className="w-1 h-1 rounded-full bg-neutral-400 opacity-50"></span>
                                                {link}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )

                        return (
                            <div key={section.title} className="h-full">
                                {section.href ? (
                                    <a
                                        href={section.href}
                                        className="block h-full p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
                                        style={{
                                            backgroundColor:
                                                'var(--bg-landing-card)',
                                            borderColor:
                                                'var(--border-landing-subtle)',
                                        }}
                                    >
                                        {CardContent}
                                    </a>
                                ) : (
                                    <div
                                        className="h-full p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
                                        style={{
                                            backgroundColor:
                                                'var(--bg-landing-card)',
                                            borderColor:
                                                'var(--border-landing-subtle)',
                                        }}
                                    >
                                        {CardContent}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
