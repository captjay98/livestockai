import { Book, Github, MessageCircle, Phone } from 'lucide-react'

const SUPPORT_CHANNELS = [
    {
        name: 'Community Support',
        description:
            'Join our active community of farmers and developers. Ask questions, share tips, and contribute.',
        icon: MessageCircle,
        color: 'text-emerald-500',
        features: [
            'WhatsApp Community Group',
            'Discord Server',
            'GitHub Discussions',
            'Peer-to-peer help',
        ],
        cta: 'Join WhatsApp',
        link: 'https://chat.whatsapp.com/openlivestock', // Placeholder
    },
    {
        name: 'Documentation',
        description:
            'Comprehensive guides, API references, and tutorials to help you get the most out of the platform.',
        icon: Book,
        color: 'text-blue-500',
        features: [
            'Installation guides',
            'Configuration docs',
            'API reference',
            'User manuals',
        ],
        cta: 'Browse Docs',
        link: '/docs',
    },
    {
        name: 'Commercial & Enterprise',
        description:
            'Need managed hosting, custom integrations, or SLAs? Contact our team for professional services.',
        icon: Phone,
        color: 'text-purple-500',
        features: [
            'Custom integrations',
            'Managed hosting',
            'Training & Onboarding',
            'Dedicated support',
        ],
        cta: 'Contact Us',
        link: 'mailto:enterprise@openlivestock.com',
    },
]

export function SupportTiers() {
    return (
        <section
            className="py-20 px-6 lg:px-12 relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-landing-page)' }}
        >
            <div className="max-w-6xl mx-auto relative z-10">
                <div className="grid md:grid-cols-3 gap-8">
                    {SUPPORT_CHANNELS.map((channel) => {
                        const Icon = channel.icon
                        return (
                            <div
                                key={channel.name}
                                className="p-8 rounded-2xl border flex flex-col relative group overflow-hidden"
                                style={{
                                    backgroundColor: 'var(--bg-landing-card)',
                                    borderColor: 'var(--border-landing-subtle)',
                                }}
                            >
                                <div
                                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 bg-black/5 dark:bg-white/5 ${channel.color}`}
                                >
                                    <Icon className="w-6 h-6" />
                                </div>

                                <h3
                                    className="text-xl font-semibold mb-4"
                                    style={{
                                        color: 'var(--text-landing-primary)',
                                    }}
                                >
                                    {channel.name}
                                </h3>
                                <p
                                    className="mb-8 text-sm leading-relaxed"
                                    style={{
                                        color: 'var(--text-landing-secondary)',
                                    }}
                                >
                                    {channel.description}
                                </p>

                                <ul className="space-y-4 mb-8 flex-1">
                                    {channel.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex gap-3 text-sm"
                                            style={{
                                                color: 'var(--text-landing-secondary)',
                                            }}
                                        >
                                            <span
                                                className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5`}
                                            >
                                                <div
                                                    className={`w-1.5 h-1.5 rounded-full bg-current ${channel.color}`}
                                                />
                                            </span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <a
                                    href={channel.link}
                                    className="w-full py-3 rounded-lg border text-center text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                    style={{
                                        borderColor:
                                            'var(--border-landing-subtle)',
                                        color: 'var(--text-landing-primary)',
                                    }}
                                >
                                    {channel.cta}
                                </a>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-20 max-w-2xl mx-auto text-center">
                    <h3
                        className="text-2xl font-semibold mb-4"
                        style={{ color: 'var(--text-landing-primary)' }}
                    >
                        Report a Bug?
                    </h3>
                    <p
                        className="mb-8"
                        style={{ color: 'var(--text-landing-secondary)' }}
                    >
                        Found an issue? Help us improve OpenLivestock by
                        reporting it on GitHub.
                    </p>
                    <a
                        href="https://github.com/captjay98/open-livestock-manager/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                    >
                        <Github className="w-5 h-5" />
                        Open an Issue →
                    </a>
                </div>
            </div>
        </section>
    )
}
