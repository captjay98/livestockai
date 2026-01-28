import { Circle, Hexagon, LayoutGrid, Pentagon, Waves, Zap } from 'lucide-react'

const species = [
    {
        id: '01',
        name: 'Poultry',
        description:
            'Broilers, Layers, Turkey, Duck. Track egg production, feed conversion, and vaccination schedules.',
        icon: LayoutGrid,
        accent: 'bg-emerald-500',
    },
    {
        id: '02',
        name: 'Aquaculture',
        description:
            'Catfish, Tilapia. Monitor water quality (pH, DO, ammonia, temp) and feeding schedules.',
        icon: Waves,
        accent: 'bg-cyan-500',
    },
    {
        id: '03',
        name: 'Cattle',
        description:
            'Beef and Dairy. Track breeding cycles, milk production, and health records.',
        icon: Hexagon,
        accent: 'bg-orange-500',
    },
    {
        id: '04',
        name: 'Goats',
        description:
            'Meat and Dairy breeds. Monitor kidding schedules and browse consumption.',
        icon: Pentagon,
        accent: 'bg-purple-500',
    },
    {
        id: '05',
        name: 'Sheep',
        description:
            'Wool and Meat production. Track lambing rates and shearing schedules.',
        icon: Circle,
        accent: 'bg-pink-500',
    },
    {
        id: '06',
        name: 'Bees',
        description:
            'Honey production and pollination services. Track hive health and harvest cycles.',
        icon: Zap,
        accent: 'bg-yellow-500',
    },
]

export function SpeciesSupport() {
    return (
        <section
            className="relative w-full py-32 border-t overflow-hidden transition-colors duration-500"
            style={{
                backgroundColor: 'var(--bg-landing-page)',
                borderColor: 'var(--border-landing-subtle)',
            }}
        >
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none transition-colors duration-500"
                style={{
                    backgroundImage:
                        'linear-gradient(var(--landing-grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--landing-grid-color) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-6">
                    <h2
                        className="text-4xl lg:text-6xl font-manrope font-semibold tracking-tight transition-colors duration-500"
                        style={{ color: 'var(--text-landing-primary)' }}
                    >
                        Supported Species
                    </h2>
                    <p
                        className="font-mono text-sm max-w-xs text-right transition-colors duration-500"
                        style={{ color: 'var(--text-landing-secondary)' }}
                    >
                        // MODULAR // EXTENSIBLE // SPECIES-SPECIFIC
                    </p>
                </div>

                <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px border"
                    style={{
                        borderColor: 'var(--border-landing-subtle)',
                        backgroundColor: 'var(--border-landing-subtle)',
                    }}
                >
                    {species.map((item) => (
                        <div
                            key={item.id}
                            className="group relative p-8 h-80 flex flex-col justify-between overflow-hidden transition-colors duration-500"
                            style={{
                                backgroundColor: 'var(--bg-landing-card)',
                            }}
                        >
                            <div
                                className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ color: 'var(--text-landing-primary)' }}
                            >
                                <item.icon className="w-8 h-8 stroke-[1.2]" />
                            </div>

                            <div className="flex flex-col gap-4">
                                <span
                                    className="text-xs font-mono transition-colors duration-500"
                                    style={{
                                        color: 'var(--text-landing-secondary)',
                                    }}
                                >
                                    {item.id}
                                </span>
                                <h3
                                    className="text-xl font-manrope font-medium tracking-tight transition-colors duration-500"
                                    style={{
                                        color: 'var(--text-landing-primary)',
                                    }}
                                >
                                    {item.name}
                                </h3>
                            </div>

                            <p
                                className="text-sm font-light leading-relaxed group-hover:text-current transition-colors relative z-10"
                                style={{
                                    color: 'var(--text-landing-secondary)',
                                }}
                            >
                                {item.description}
                            </p>

                            <div
                                className={`absolute bottom-0 left-0 w-full h-0.5 ${item.accent} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
