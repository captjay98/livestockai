import { Check, Minus } from 'lucide-react'

const features = [
    {
        name: 'Number of Farms',
        free: '1',
        starter: '1',
        pro: '3',
        business: '10',
    },
    {
        name: 'Livestock Limit',
        free: '200',
        starter: '2,000',
        pro: '10,000',
        business: 'Unlimited',
        highlighted: true,
    },
    { name: 'Team Members', free: '1', starter: '1', pro: '3', business: '10' },
    {
        name: 'History Retention',
        free: '30 days',
        starter: 'Unlimited',
        pro: 'Unlimited',
        business: 'Unlimited',
        highlighted: true,
    },
    {
        name: 'Offline-First PWA',
        free: true,
        starter: true,
        pro: true,
        business: true,
    },
    {
        name: 'Auto Backups',
        free: false,
        starter: true,
        pro: true,
        business: true,
    },
    {
        name: 'SMS Alerts',
        free: false,
        starter: false,
        pro: true,
        business: true,
    },
    {
        name: 'WhatsApp Alerts',
        free: false,
        starter: false,
        pro: false,
        business: true,
    },
    {
        name: 'API Access',
        free: false,
        starter: false,
        pro: true,
        business: true,
    },
    {
        name: 'Support',
        free: 'Community',
        starter: 'Email',
        pro: 'Priority',
        business: '24/7 Dedicated',
    },
]

export function ComparisonTable() {
    const renderCell = (val: string | boolean) => {
        if (typeof val === 'boolean') {
            return val ? (
                <Check className="w-5 h-5 text-emerald-500 mx-auto" />
            ) : (
                <Minus className="w-5 h-5 text-neutral-800 mx-auto" />
            )
        }
        return (
            <span
                className={
                    val === 'Unlimited'
                        ? 'text-emerald-400 font-medium'
                        : 'text-neutral-400'
                }
            >
                {val}
            </span>
        )
    }

    return (
        <section
            className="w-full py-32 px-6 lg:px-12 border-t transition-colors duration-500"
            style={{
                backgroundColor: 'var(--bg-landing-page)',
                borderColor: 'var(--border-landing-subtle)',
            }}
        >
            <div className="max-w-[1400px] mx-auto">
                <h2
                    className="text-3xl lg:text-5xl font-manrope font-semibold mb-16 text-center tracking-tight transition-colors duration-500"
                    style={{ color: 'var(--text-landing-primary)' }}
                >
                    Compare All Features
                </h2>

                <div
                    className="glass-card rounded-3xl border overflow-hidden"
                    style={{ borderColor: 'var(--border-landing-subtle)' }}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr
                                    className="border-b"
                                    style={{
                                        borderColor:
                                            'var(--border-landing-subtle)',
                                    }}
                                >
                                    <th
                                        className="text-left p-8 font-mono text-[10px] uppercase tracking-widest transition-colors duration-500"
                                        style={{
                                            color: 'var(--text-landing-secondary)',
                                        }}
                                    >
                                        Capability
                                    </th>
                                    <th
                                        className="p-8 font-semibold text-sm transition-colors duration-500"
                                        style={{
                                            color: 'var(--text-landing-primary)',
                                        }}
                                    >
                                        Free
                                    </th>
                                    <th
                                        className="p-8 font-semibold text-sm transition-colors duration-500"
                                        style={{
                                            color: 'var(--text-landing-primary)',
                                        }}
                                    >
                                        Starter
                                    </th>
                                    <th
                                        className="p-8 font-semibold text-sm transition-colors duration-500"
                                        style={{
                                            color: 'var(--text-landing-primary)',
                                        }}
                                    >
                                        Pro
                                    </th>
                                    <th
                                        className="p-8 font-semibold text-sm transition-colors duration-500"
                                        style={{
                                            color: 'var(--text-landing-primary)',
                                        }}
                                    >
                                        Business
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-light">
                                {features.map((feature, idx) => (
                                    <tr
                                        key={idx}
                                        className={`border-b transition-colors hover:bg-black/5 dark:hover:bg-white/[0.01] ${
                                            idx === features.length - 1
                                                ? 'border-none'
                                                : ''
                                        }`}
                                        style={{
                                            borderColor:
                                                'var(--border-landing-subtle)',
                                        }}
                                    >
                                        <td
                                            className="text-left p-6 pl-8 font-normal transition-colors duration-500"
                                            style={{
                                                color: 'var(--text-landing-secondary)',
                                            }}
                                        >
                                            {feature.name}
                                        </td>
                                        <td className="p-6">
                                            {renderCell(feature.free)}
                                        </td>
                                        <td className="p-6">
                                            {renderCell(feature.starter)}
                                        </td>
                                        <td className="p-6">
                                            {renderCell(feature.pro)}
                                        </td>
                                        <td className="p-6">
                                            {renderCell(feature.business)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    )
}
